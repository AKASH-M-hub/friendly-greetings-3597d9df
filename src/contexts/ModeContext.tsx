import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserMode = 'teaching' | 'learning' | null;

interface ModeHistory {
  teachingSessions: number;
  learningSessions: number;
}

interface ModeContextType {
  currentMode: UserMode;
  setMode: (mode: UserMode) => void;
  isModeLocked: boolean;
  lockMode: () => void;
  unlockMode: () => void;
  modeHistory: ModeHistory;
  incrementHistory: (mode: 'teaching' | 'learning') => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<UserMode>(null);
  const [isModeLocked, setIsModeLocked] = useState(false);
  const [modeHistory, setModeHistory] = useState<ModeHistory>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chrono-mode-history');
      if (stored) return JSON.parse(stored);
    }
    return { teachingSessions: 0, learningSessions: 0 };
  });

  const setMode = useCallback((mode: UserMode) => {
    if (!isModeLocked) {
      setCurrentMode(mode);
    }
  }, [isModeLocked]);

  const lockMode = useCallback(() => {
    setIsModeLocked(true);
  }, []);

  const unlockMode = useCallback(() => {
    setIsModeLocked(false);
    setCurrentMode(null);
  }, []);

  const incrementHistory = useCallback((mode: 'teaching' | 'learning') => {
    setModeHistory(prev => {
      const updated = {
        ...prev,
        [mode === 'teaching' ? 'teachingSessions' : 'learningSessions']: 
          prev[mode === 'teaching' ? 'teachingSessions' : 'learningSessions'] + 1
      };
      localStorage.setItem('chrono-mode-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <ModeContext.Provider value={{
      currentMode,
      setMode,
      isModeLocked,
      lockMode,
      unlockMode,
      modeHistory,
      incrementHistory,
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
