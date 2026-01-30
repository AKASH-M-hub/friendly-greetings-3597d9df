import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SessionRequestButtonProps {
  sessionId: string;
  sessionTitle: string;
  teacherName: string;
  creditsRequired: number;
  userCredits: number;
  isFull: boolean;
  onRequest: (sessionId: string, message: string) => Promise<boolean>;
}

type RequestState = 'idle' | 'confirming' | 'sending' | 'success' | 'error';

export function SessionRequestButton({
  sessionId,
  sessionTitle,
  teacherName,
  creditsRequired,
  userCredits,
  isFull,
  onRequest
}: SessionRequestButtonProps) {
  const [state, setState] = useState<RequestState>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasEnoughCredits = userCredits >= creditsRequired;
  const isDisabled = isFull || !hasEnoughCredits;

  const handleClick = () => {
    if (isDisabled) return;
    setState('confirming');
  };

  const handleConfirm = async () => {
    setState('sending');
    try {
      const success = await onRequest(sessionId, message);
      if (success) {
        setState('success');
        setTimeout(() => {
          setState('idle');
          setMessage('');
        }, 3000);
      } else {
        setError('Failed to send request');
        setState('error');
      }
    } catch (err) {
      setError('Something went wrong');
      setState('error');
    }
  };

  const handleClose = () => {
    if (state === 'sending') return;
    setState('idle');
    setMessage('');
    setError('');
  };

  const getButtonText = () => {
    if (isFull) return 'Session Full';
    if (!hasEnoughCredits) return 'Not Enough Credits';
    return 'Request to Learn';
  };

  return (
    <>
      <Button 
        variant="chrono-outline" 
        className="w-full gap-2"
        disabled={isDisabled}
        onClick={handleClick}
      >
        <Play className="h-4 w-4" />
        {getButtonText()}
      </Button>

      <Dialog open={state !== 'idle'} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {state === 'confirming' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogHeader>
                  <DialogTitle>Request to Join Session</DialogTitle>
                  <DialogDescription>
                    You're requesting to join "{sessionTitle}" with {teacherName}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credit cost:</span>
                      <span className="font-medium text-foreground">
                        {creditsRequired} credit{creditsRequired > 1 ? 's' : ''}/hour
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Your balance:</span>
                      <span className="font-medium text-primary">
                        {userCredits} credits
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Message to teacher (optional)
                    </label>
                    <Textarea
                      placeholder="Introduce yourself or share what you'd like to learn..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="chrono" onClick={handleConfirm} className="gap-2">
                    <Play className="h-4 w-4" />
                    Send Request
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {state === 'sending' && (
              <motion.div
                key="sending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Sending request...</p>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Request Sent!
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {teacherName} will be notified. You'll receive a response shortly.
                </p>
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Usually responds within 5 minutes</span>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Request Failed
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {error}
                </p>
                <Button variant="outline" onClick={handleClose}>
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
