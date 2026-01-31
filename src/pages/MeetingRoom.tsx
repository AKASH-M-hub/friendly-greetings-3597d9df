import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Video, Copy, Clock, Pause, Play, ExternalLink,
    CheckCircle, AlertCircle, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function MeetingRoom() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [session, setSession] = useState<any>(null);
    // State
    const [meetingUrl, setMeetingUrl] = useState('');
    const [roomData, setRoomData] = useState<any>(null); // For session_rooms data
    const [loading, setLoading] = useState(true);
    const [isTeacher, setIsTeacher] = useState(false);

    // Timer State
    const [timerStatus, setTimerStatus] = useState<'stopped' | 'running' | 'paused'>('stopped');
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Display State
    const [displaySeconds, setDisplaySeconds] = useState(0);
    const [pauseCountdown, setPauseCountdown] = useState(0);

    useEffect(() => {
        if (user && sessionId) {
            fetchSessionAndRoom();

            const channel = supabase
                .channel('room-updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'session_rooms',
                        filter: `session_id=eq.${sessionId}`,
                    },
                    (payload) => {
                        const fresh = payload.new as any;
                        if (fresh) {
                            setRoomData(fresh);
                            if (fresh.room_code) setMeetingUrl(fresh.room_code);

                            // Map status
                            // We'll use specific status strings if possible, or mapping
                            // For this implementation, let's assume 'status' column holds our timer state string
                            // If the schema enforces enum, we might need to be careful. 
                            // Checks types: status is string. Good.

                            if (fresh.status) setTimerStatus(fresh.status as any);
                            if (fresh.actual_duration_seconds !== undefined) setTimerSeconds(fresh.actual_duration_seconds);
                            if (fresh.updated_at) setLastUpdated(fresh.updated_at);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, sessionId]);

    // Main Clock Ticker
    useEffect(() => {
        const tick = async () => {
            const now = new Date().getTime();

            if (timerStatus === 'running' && lastUpdated) {
                const start = new Date(lastUpdated).getTime();
                const diff = Math.floor((now - start) / 1000);
                const currentTotalSeconds = Number(timerSeconds) + diff;

                setDisplaySeconds(currentTotalSeconds);
                setPauseCountdown(0);

                // Credit Mining Trigger (Teacher Only)
                // Trigger every 60 seconds (approx) to bill for the minute
                // We check if we just crossed a minute boundary or if it's a multiple of 60
                // To avoid spamming, we rely on the backend being idempotent or checking previous bill.
                // Our SQL function calculates based on total duration, so it is safe to call repeatedly?
                // SQL: v_new_credits := floor(p_duration_seconds / 60); 
                // So calling it at 61s and 62s produces same v_new_credits. DB only bill difference.
                // So we can call it whenever currentTotalSeconds % 60 === 0 (and > 0).

                if (isTeacher && currentTotalSeconds > 0 && currentTotalSeconds % 60 === 0) {
                    console.log('Triggering Credit Mining...');
                    // Explicitly type the RPC response as any to bypass missing type definition
                    const { data, error } = await supabase.rpc('process_session_tick', {
                        p_session_id: sessionId,
                        p_duration_seconds: currentTotalSeconds
                    }) as any;

                    if (error) console.error('Mining Error:', error);
                    if (data && !data.success && data.error === 'insufficient_funds') {
                        toast.error("Session Paused: Learner has insufficient credits!");
                        pauseSession();
                    } else if (data && data.success && data.transferred > 0) {
                        toast.success(`+${data.transferred} Credit Earned!`);
                    }
                }

            } else if (timerStatus === 'paused' && lastUpdated) {
                setDisplaySeconds(timerSeconds);
                const start = new Date(lastUpdated).getTime();
                const elapsedPause = Math.floor((now - start) / 1000);
                const remaining = Math.max(0, (5 * 60) - elapsedPause);
                setPauseCountdown(remaining);

                if (remaining === 0 && isTeacher) {
                    resumeSession();
                }
            } else {
                setDisplaySeconds(timerSeconds);
                setPauseCountdown(0);
            }
        };

        // We run tick immediately and then interval
        // tick(); // removed immediate call to avoid double effect with interval in strict mode issues
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [timerStatus, lastUpdated, timerSeconds, isTeacher, sessionId]);

    const fetchSessionAndRoom = async () => {
        if (!sessionId) return;

        // 1. Get Session Info
        const { data: sessionData, error: sessionError } = await supabase
            .from('teaching_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionData) {
            setSession(sessionData);
            setIsTeacher(user?.id === sessionData.teacher_id);
        }

        // 2. Get Room Info (for link and timer)
        const { data: room, error: roomError } = await supabase
            .from('session_rooms')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle();

        if (room) {
            setRoomData(room);
            setMeetingUrl(room.room_code || '');
            setTimerStatus((room.status as any) || 'stopped');
            setTimerSeconds(room.actual_duration_seconds || 0);
            setLastUpdated(room.updated_at);
        } else if (user?.id === sessionData?.teacher_id) {
            // Create room if teacher and missing
            // Don't auto-create until they save something? 
            // Actually safe to auto-create to hold state
        }
        setLoading(false);
    };

    const upsertRoom = async (updates: any) => {
        // Ensure we have a record to update
        const payload = {
            session_id: sessionId,
            teacher_id: session?.teacher_id, // valid if teacher is creating
            room_code: updates.room_code || meetingUrl || '',
            ...updates,
            updated_at: new Date().toISOString()
        };

        // Check if room exists (we have roomData)
        if (roomData?.id) {
            await supabase
                .from('session_rooms')
                .update(updates)
                .eq('id', roomData.id);
        } else {
            // Insert new
            await supabase
                .from('session_rooms')
                .insert([payload]);
        }
    };

    const handleSaveLink = async () => {
        if (!meetingUrl) return;
        if (!meetingUrl.includes('meet.google.com') && !meetingUrl.includes('google.com/meet')) {
            toast.warning('Please enter a valid Google Meet link');
            return;
        }

        try {
            await upsertRoom({ room_code: meetingUrl });
            toast.success('Meeting link shared with learners!');
        } catch (err) {
            toast.error('Failed to share link');
        }
    };

    const updateTimerState = async (status: 'running' | 'paused', seconds: number) => {
        // Optimistic
        setTimerStatus(status);
        setTimerSeconds(seconds);
        setLastUpdated(new Date().toISOString());

        try {
            await upsertRoom({
                status: status,
                actual_duration_seconds: seconds
            });
        } catch (err) {
            console.error("Timer update failed", err);
        }
    };

    const startSession = () => updateTimerState('running', 0);
    const pauseSession = () => updateTimerState('paused', displaySeconds);
    const resumeSession = () => updateTimerState('running', displaySeconds);

    const togglePause = () => {
        // Legacy mapping for UI
        if (timerStatus === 'paused') resumeSession();
        else if (timerStatus === 'running') pauseSession();
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 text-white md:p-12">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Button variant="ghost" className="mb-2 pl-0 text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <h1 className="font-display text-3xl font-bold">{session?.title || 'Teaching Session'}</h1>
                        <p className="text-slate-400">Manage your virtual classroom</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 px-6 py-4 shadow-lg shadow-indigo-500/10">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Session Timer</p>
                            <div className="font-mono text-3xl font-bold tracking-tight text-emerald-400">
                                {formatTime(displaySeconds)}
                            </div>
                        </div>
                        {timerStatus === 'paused' && (
                            <div className="ml-4 border-l border-slate-700 pl-4">
                                <p className="text-xs text-amber-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                                    <Pause className="h-3 w-3" /> Resuming in
                                </p>
                                <div className="font-mono text-xl font-bold text-amber-400">
                                    {formatTime(pauseCountdown)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Interface */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left: Meeting Controls */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Video className="h-5 w-5 text-indigo-400" />
                                Meeting Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isTeacher ? (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                                        <h3 className="text-sm font-medium text-slate-300 mb-2">Step 1: Create Meeting</h3>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                                            onClick={() => window.open('https://meet.google.com/new', '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 text-indigo-400" />
                                            Generate Google Meet Link
                                        </Button>
                                        <p className="text-xs text-slate-500 mt-2">Opens in a new tab. Copy the link created there.</p>
                                    </div>

                                    <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                                        <h3 className="text-sm font-medium text-slate-300 mb-2">Step 2: Share Link</h3>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Paste Google Meet link here..."
                                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                                                value={meetingUrl}
                                                onChange={(e) => setMeetingUrl(e.target.value)}
                                            />
                                            <Button onClick={handleSaveLink} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Link will immediately appear for all learners.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {meetingUrl ? (
                                        <div className="rounded-xl bg-emerald-500/10 p-6 border border-emerald-500/20 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                                                <Video className="h-6 w-6 text-emerald-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-emerald-400 mb-1">Class is Live!</h3>
                                            <p className="text-sm text-slate-300 mb-6">The teacher has started the session.</p>
                                            <Button
                                                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11"
                                                onClick={() => window.open(meetingUrl, '_blank')}
                                            >
                                                Join Google Meet
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-amber-500/10 p-8 border border-amber-500/20 flex flex-col items-center text-center">
                                            <div className="relative mb-4">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20"></div>
                                                <div className="relative rounded-full bg-amber-500/20 p-3">
                                                    <Clock className="h-8 w-8 text-amber-500" />
                                                </div>
                                            </div>
                                            <h3 className="font-medium text-amber-400 text-lg">Waiting for Teacher</h3>
                                            <p className="text-slate-400 mt-2 max-w-[200px]">The meeting link will appear here automatically once generated.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Session Controls */}
                    <Card className="bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Clock className="h-5 w-5 text-indigo-400" />
                                Session Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col gap-4">
                                {isTeacher ? (
                                    <>
                                        {timerStatus === 'stopped' ? (
                                            <Button
                                                size="lg"
                                                className="w-full h-12 gap-2 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-500/20"
                                                onClick={startSession}
                                            >
                                                <Play className="h-5 w-5" />
                                                Start Session Timer
                                            </Button>
                                        ) : (
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                className={`w-full h-12 gap-2 border-2 ${timerStatus === 'paused' ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-950' : 'border-amber-500 text-amber-500 hover:bg-amber-950'}`}
                                                onClick={timerStatus === 'paused' ? resumeSession : pauseSession}
                                            >
                                                {timerStatus === 'paused' ? (
                                                    <>
                                                        <Play className="h-5 w-5" /> Resume Session
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pause className="h-5 w-5" /> Take 5-Min Break
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <div className="rounded-lg bg-slate-800 p-4 border border-slate-700">
                                            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-indigo-400" />
                                                Session Rules
                                            </h4>
                                            <ul className="text-xs text-slate-400 space-y-2">
                                                <li className="flex gap-2">
                                                    <span className="text-indigo-500">•</span>
                                                    Timer tracks your official earned credit duration.
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-indigo-500">•</span>
                                                    "Take Break" pauses for exactly 5 minutes.
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="text-indigo-500">•</span>
                                                    Timer auto-resumes after break ends.
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <div className="text-4xl mb-4">👀</div>
                                        <h4 className="font-medium text-slate-300 mb-2">Timer in Progress</h4>
                                        <p className="text-sm text-slate-400 px-8">
                                            Please keep this tab open. This timer tracks the official duration of your learning session.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
