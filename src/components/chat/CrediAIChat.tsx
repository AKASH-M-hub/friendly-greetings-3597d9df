import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  GraduationCap,
  BookOpen,
  Coins,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCrediAI } from '@/hooks/useCrediAI';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface QuickAction {
  label: string;
  action: string;
  icon: React.ReactNode;
}

export function CrediAIChat() {
  const { user } = useAuth();
  const { currentMode, setMode } = useMode();
  const navigate = useNavigate();
  const { messages, isLoading, error, sendMessage, clearMessages } = useCrediAI();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    { label: 'Start Teaching', action: 'I want to start teaching', icon: <GraduationCap className="h-3 w-3" /> },
    { label: 'Switch to Learning', action: 'How do I switch to learning mode?', icon: <BookOpen className="h-3 w-3" /> },
    { label: 'View Credits', action: 'What is my current credit balance?', icon: <Coins className="h-3 w-3" /> },
    { label: 'Session Help', action: 'How do sessions work?', icon: <Sparkles className="h-3 w-3" /> },
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle navigation commands from assistant responses
  const processAssistantActions = (content: string) => {
    if (content.toLowerCase().includes('start teaching') || content.toLowerCase().includes('switch to teaching')) {
      return () => {
        setMode('teaching');
        navigate('/teaching');
      };
    }
    if (content.toLowerCase().includes('switch to learning') || content.toLowerCase().includes('start learning')) {
      return () => {
        setMode('learning');
        navigate('/learning');
      };
    }
    if (content.toLowerCase().includes('view credits') || content.toLowerCase().includes('check your credits')) {
      return () => navigate('/credits');
    }
    return null;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all",
            isOpen && "rotate-0",
            !isOpen && "chrono-glow"
          )}
          variant="chrono"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <ChevronDown className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        
        {/* Notification dot for new users */}
        {messages.length === 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
          </span>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 via-card to-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Credi.AI</h3>
                  <p className="text-xs text-muted-foreground">Your personal assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentMode && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {currentMode} Mode
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="h-[380px] p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Hi! I'm Credi.AI</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[280px]">
                    I can help you with credits, sessions, mode switching, and more. What would you like to know?
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => handleQuickAction(action.action)}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' && "flex-row-reverse"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        message.role === 'user' ? "bg-primary/20" : "bg-muted"
                      )}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-primary" />
                        ) : (
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className={cn(
                        "rounded-2xl px-4 py-2 max-w-[260px]",
                        message.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {/* Action button if detected */}
                        {message.role === 'assistant' && processAssistantActions(message.content) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2 w-full text-xs"
                            onClick={processAssistantActions(message.content)!}
                          >
                            Take Action
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2">
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 mt-4">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              {!user ? (
                <p className="text-center text-sm text-muted-foreground">
                  Please sign in to chat with Credi.AI
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about credits, sessions..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    variant="chrono"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
