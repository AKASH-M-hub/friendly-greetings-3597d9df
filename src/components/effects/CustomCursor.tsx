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

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 50, stiffness: 400 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Create springs for the trail
  const trailSprings = Array.from({ length: 8 }).map((_, i) => ({
    x: useSpring(cursorX, { damping: 20 + i * 2, stiffness: 200 - i * 10 }),
    y: useSpring(cursorY, { damping: 20 + i * 2, stiffness: 200 - i * 10 }),
  }));

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseDown = () => {
      setCursorState(prev => ({ ...prev, isClicking: true }));
    };

    const handleMouseUp = () => {
      setCursorState(prev => ({ ...prev, isClicking: false }));
    };

    const handleMouseEnter = (e: MouseEvent) => {
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
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseEnter); // Keeping mouseover for delegation
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseEnter);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, isVisible]);

  const getCursorSize = () => {
    if (cursorState.isClicking) return 6; // Shrink slightly on click
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 10;
    return 8;
  };

  const getRingSize = () => {
    if (cursorState.isClicking) return 24;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 32;
    return 20;
  };

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Trail effect */}
      {trailSprings.map((spring, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full bg-primary/30"
          style={{
            x: spring.x,
            y: spring.y,
            translateX: '-50%',
            translateY: '-50%',
            width: 8 - index * 0.5,
            height: 8 - index * 0.5,
            opacity: isVisible ? 0.6 - index * 0.05 : 0,
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
            ? 'hsl(var(--primary))'
            : 'hsl(var(--foreground))',
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
            ? 'hsl(var(--primary))'
            : 'hsl(var(--primary) / 0.5)',
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
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: 40,
            height: 40,
            opacity: 0.8
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
