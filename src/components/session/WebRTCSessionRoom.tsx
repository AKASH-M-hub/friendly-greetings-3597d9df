import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Check,
  Users,
  Clock,
  Coins,
  Play,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useWebRTCSession } from '@/hooks/useWebRTCSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WebRTCSessionRoomProps {
  sessionId?: string;
  sessionTitle?: string;
  mode: 'create' | 'join';
  onSessionEnd?: (result: { durationSeconds: number; creditsEarned: number }) => void;
  onClose?: () => void;
}

export function WebRTCSessionRoom({
  sessionId,
  sessionTitle,
  mode,
  onSessionEnd,
  onClose,
}: WebRTCSessionRoomProps) {
  const {
    room,
    isTeacher,
    localStream,
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
  } = useWebRTCSession();

  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Create room on mount if mode is 'create'
  useEffect(() => {
    if (mode === 'create' && sessionId && !room) {
      createRoom(sessionId, sessionTitle);
    }
  }, [mode, sessionId, sessionTitle, room, createRoom]);

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    const success = await joinRoom(roomCode.trim());
    if (success) {
      toast.success('Joined session room!');
    }
  };

  const handleCopyCode = async () => {
    if (room?.room_code) {
      await navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartSession = async () => {
    const success = await startSession();
    if (success) {
      toast.success('Session started!');
    }
  };

  const handleEndSession = async () => {
    const result = await endSession();
    if (result) {
      toast.success(`Session ended! You earned ${result.creditsEarned} credits.`);
      onSessionEnd?.(result);
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    onClose?.();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedCredits = isTeacher
    ? Math.floor((elapsedTime / 3600) * 2)
    : Math.floor(elapsedTime / 3600);

  // Join room UI
  if (mode === 'join' && !room) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Join Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Enter the room code shared by your teacher to join the session.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter room code (e.g., ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="font-mono text-lg tracking-widest"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={isConnecting || !roomCode.trim()}
              className="gap-2"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Join'
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isConnecting) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Setting up session room...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Room Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-3 w-3 rounded-full",
                room?.status === 'active' ? "bg-green-500 animate-pulse" :
                room?.status === 'waiting' ? "bg-yellow-500 animate-pulse" :
                "bg-muted"
              )} />
              <div>
                <h3 className="font-semibold">{sessionTitle || 'Live Session'}</h3>
                <p className="text-sm text-muted-foreground">
                  {room?.status === 'waiting' ? 'Waiting for participants...' :
                   room?.status === 'active' ? 'Session in progress' :
                   'Session ended'}
                </p>
              </div>
            </div>

            {/* Room Code */}
            {room?.room_code && room.status === 'waiting' && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {room.room_code}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {/* Timer */}
            {room?.status === 'active' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-xl font-bold">{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-accent-foreground">
                  <Coins className="h-5 w-5" />
                  <span className="font-bold">{estimatedCredits} credits</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Local Video */}
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                You {isTeacher ? '(Teacher)' : '(Learner)'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Remote Video Placeholder */}
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted flex items-center justify-center">
            {room?.learner_id || (room?.teacher_id && !isTeacher) ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  Waiting for {isTeacher ? 'learner' : 'teacher'} to join...
                </p>
                {isTeacher && room?.room_code && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Share code: <span className="font-mono font-bold">{room.room_code}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            {/* Audio Toggle */}
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            {/* Video Toggle */}
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>

            {/* Start Session (Teacher only, when waiting) */}
            {isTeacher && room?.status === 'waiting' && room.learner_id && (
              <Button
                variant="chrono"
                size="lg"
                className="rounded-full h-14 px-6 gap-2"
                onClick={handleStartSession}
              >
                <Play className="h-5 w-5" />
                Start Session
              </Button>
            )}

            {/* End Session */}
            {room?.status === 'active' && (
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={handleEndSession}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {/* Leave */}
            {room?.status === 'waiting' && (
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full h-14 px-6"
                onClick={handleLeave}
              >
                Leave
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      {room?.status === 'active' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Session is being recorded for credit calculation. 
              {isTeacher ? ' You earn 2 credits per hour taught.' : ' 1 credit is deducted per hour.'}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
