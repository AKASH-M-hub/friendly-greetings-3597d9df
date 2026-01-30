import { useEffect, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CursorState {
  isHovering: boolean;
  isClicking: boolean;
  hoverType: 'default' | 'link' | 'button' | 'text';
}

export function CustomCursor() {
  const [cursorState, setCursorState] = useState<CursorState>({
    isHovering: false,
    isClicking: false,
    hoverType: 'default',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const moveCursor = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    setIsVisible(true);

    // Add to trail
    setTrail(prev => {
      const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
      return newTrail.slice(-8); // Keep last 8 points
    });
  }, [cursorX, cursorY]);

  const handleMouseDown = useCallback(() => {
    setCursorState(prev => ({ ...prev, isClicking: true }));
  }, []);

  const handleMouseUp = useCallback(() => {
    setCursorState(prev => ({ ...prev, isClicking: false }));
  }, []);

  const handleMouseEnter = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.closest('a, [role="link"]')) {
      setCursorState(prev => ({ ...prev, isHovering: true, hoverType: 'link' }));
    } else if (target.closest('button, [role="button"], .cursor-pointer')) {
      setCursorState(prev => ({ ...prev, isHovering: true, hoverType: 'button' }));
    } else if (target.closest('input, textarea, [contenteditable]')) {
      setCursorState(prev => ({ ...prev, isHovering: true, hoverType: 'text' }));
    } else {
      setCursorState(prev => ({ ...prev, isHovering: false, hoverType: 'default' }));
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [moveCursor, handleMouseDown, handleMouseUp, handleMouseEnter, handleMouseLeave]);

  // Clean up old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => prev.filter(point => Date.now() - point.id < 300));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getCursorSize = () => {
    if (cursorState.isClicking) return 8;
    if (cursorState.hoverType === 'button') return 48;
    if (cursorState.hoverType === 'link') return 40;
    return 16;
  };

  const getRingSize = () => {
    if (cursorState.isClicking) return 32;
    if (cursorState.hoverType === 'button') return 64;
    if (cursorState.hoverType === 'link') return 56;
    return 40;
  };

  return (
    <>
      {/* Trail effect */}
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full bg-primary/30"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.3 }}
          style={{
            x: point.x - 4,
            y: point.y - 4,
            width: 8 - index * 0.5,
            height: 8 - index * 0.5,
          }}
        />
      ))}

      {/* Main cursor dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: getCursorSize(),
          height: getCursorSize(),
          opacity: isVisible ? 1 : 0,
          backgroundColor: cursorState.hoverType === 'text' 
            ? 'hsl(24, 100%, 50%)' 
            : 'hsl(0, 0%, 100%)',
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border-2 border-primary/50"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          opacity: isVisible ? (cursorState.isHovering ? 1 : 0.5) : 0,
          borderColor: cursorState.isClicking 
            ? 'hsl(24, 100%, 60%)' 
            : 'hsl(24, 100%, 50%)',
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Glow effect on hover */}
      {cursorState.isHovering && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9997] rounded-full"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, hsl(24, 100%, 50%, 0.2) 0%, transparent 70%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{ 
            width: 100, 
            height: 100, 
            opacity: 1 
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Click ripple effect */}
      {cursorState.isClicking && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9996] rounded-full border border-primary"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ width: 10, height: 10, opacity: 1 }}
          animate={{ width: 60, height: 60, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </>
  );
}
