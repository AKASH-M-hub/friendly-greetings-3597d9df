import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SessionRoom {
  id: string;
  session_id: string;
  room_code: string;
  teacher_id: string;
  learner_id: string | null;
  status: 'waiting' | 'active' | 'ended' | 'cancelled';
  teacher_joined_at: string | null;
  learner_joined_at: string | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  actual_duration_seconds: number;
  created_at: string;
}

interface UseWebRTCSessionReturn {
  room: SessionRoom | null;
  isTeacher: boolean;
  isLearner: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  elapsedTime: number;
  createRoom: (sessionId: string, sessionTitle?: string) => Promise<string | null>;
  joinRoom: (roomCode: string) => Promise<boolean>;
  startSession: () => Promise<boolean>;
  endSession: () => Promise<{ durationSeconds: number; creditsEarned: number } | null>;
  leaveRoom: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useWebRTCSession(): UseWebRTCSessionReturn {
  const { user } = useAuth();
  const [room, setRoom] = useState<SessionRoom | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isTeacher = room?.teacher_id === user?.id;
  const isLearner = room?.learner_id === user?.id;

  // Timer effect
  useEffect(() => {
    if (room?.status === 'active' && room.session_started_at) {
      const startTime = new Date(room.session_started_at).getTime();

      const updateTimer = () => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [room?.status, room?.session_started_at]);

  // Subscribe to room changes
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new as SessionRoom);
          }
        }
      )
      .subscribe();

    roomChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone');
      return null;
    }
  }, []);

  // Create a new room (teacher)
  const createRoom = useCallback(async (sessionId: string, sessionTitle?: string): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const roomCode = generateRoomCode();

      const { data, error: insertError } = await supabase
        .from('session_rooms')
        .insert({
          session_id: sessionId,
          room_code: roomCode,
          teacher_id: user.id,
          status: 'waiting',
          teacher_joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setRoom(data as SessionRoom);
      await initializeMedia();

      return roomCode;
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [user, initializeMedia]);

  // Join an existing room (learner)
  const joinRoom = useCallback(async (roomCode: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Find the room
      const { data: roomData, error: fetchError } = await supabase
        .from('session_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!roomData) {
        setError('Room not found or session has already started');
        return false;
      }

      // Join the room
      const { data, error: updateError } = await supabase
        .from('session_rooms')
        .update({
          learner_id: user.id,
          learner_joined_at: new Date().toISOString(),
        })
        .eq('id', roomData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRoom(data as SessionRoom);
      await initializeMedia();

      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [user, initializeMedia]);

  // Start the session (teacher only)
  const startSession = useCallback(async (): Promise<boolean> => {
    if (!room || !isTeacher) return false;

    try {
      const { error: updateError } = await supabase
        .from('session_rooms')
        .update({
          status: 'active',
          session_started_at: new Date().toISOString(),
        })
        .eq('id', room.id);

      if (updateError) throw updateError;

      // Also update the teaching session
      await supabase
        .from('teaching_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          learner_id: room.learner_id,
        })
        .eq('id', room.session_id);

      setIsConnected(true);
      return true;
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start session');
      return false;
    }
  }, [room, isTeacher]);

  // End the session
  const endSession = useCallback(async (): Promise<{ durationSeconds: number; creditsEarned: number } | null> => {
    if (!room) return null;

    try {
      const durationSeconds = elapsedTime;
      const durationMinutes = Math.ceil(durationSeconds / 60);
      // Credit rules: Teaching = 2 credits/hour, Learning = 1 credit/hour
      const creditsEarned = isTeacher 
        ? Math.floor((durationMinutes / 60) * 2) 
        : Math.floor(durationMinutes / 60);

      const { error: updateError } = await supabase
        .from('session_rooms')
        .update({
          status: 'ended',
          session_ended_at: new Date().toISOString(),
          actual_duration_seconds: durationSeconds,
        })
        .eq('id', room.id);

      if (updateError) throw updateError;

      // Update the teaching session
      await supabase
        .from('teaching_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          actual_minutes: durationMinutes,
          credits_earned: creditsEarned,
        })
        .eq('id', room.session_id);

      // Create transaction record for credit ledger
      if (room.learner_id) {
        await supabase
          .from('session_transactions')
          .insert({
            session_id: room.session_id,
            teacher_id: room.teacher_id,
            learner_id: room.learner_id,
            status: 'pending',
            duration_minutes: durationMinutes,
            credits_amount: creditsEarned,
          });
      }

      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      setRoom(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setElapsedTime(0);

      return { durationSeconds, creditsEarned };
    } catch (err) {
      console.error('Error ending session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
      return null;
    }
  }, [room, elapsedTime, isTeacher, localStream]);

  // Leave room without ending (for learner)
  const leaveRoom = useCallback(async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setRoom(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setElapsedTime(0);
    setError(null);
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  return {
    room,
    isTeacher,
    isLearner,
    localStream,
    remoteStream,
    isConnecting,
    isConnected,
    error,
    elapsedTime,
    createRoom,
    joinRoom,
    startSession,
    endSession,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
  };
}
