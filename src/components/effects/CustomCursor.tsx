import { useEffect, useState, useMemo } from 'react';
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 35, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Softer trail springs
  const trailConfigs = useMemo(() => 
    Array.from({ length: 5 }).map((_, i) => ({
      damping: 25 + i * 5,
      stiffness: 180 - i * 20,
      mass: 0.3 + i * 0.1,
    })), []
  );

  const trailSprings = trailConfigs.map((config) => ({
    x: useSpring(cursorX, config),
    y: useSpring(cursorY, config),
  }));

  useEffect(() => {
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

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
      } else if (target.closest('button, [role="button"], .cursor-pointer, [data-clickable]')) {
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
    window.addEventListener('mouseover', handleMouseEnter);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseEnter);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, isVisible, isTouchDevice]);

  // Hide on touch devices
  if (isTouchDevice) return null;

  const getCursorSize = () => {
    if (cursorState.isClicking) return 6;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 12;
    return 8;
  };

  const getRingSize = () => {
    if (cursorState.isClicking) return 28;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 40;
    return 24;
  };

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Soft gradient trail */}
      {trailSprings.map((spring, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed left-0 top-0 z-[9997] rounded-full"
          style={{
            x: spring.x,
            y: spring.y,
            translateX: '-50%',
            translateY: '-50%',
            width: 6 - index * 0.8,
            height: 6 - index * 0.8,
            background: `radial-gradient(circle, hsl(var(--primary) / ${0.4 - index * 0.06}) 0%, transparent 70%)`,
            opacity: isVisible ? 0.8 - index * 0.12 : 0,
          }}
        />
      ))}

      {/* Main cursor dot with soft glow */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full"
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
          boxShadow: cursorState.isHovering 
            ? '0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)'
            : '0 0 10px hsl(var(--primary) / 0.3)',
          backgroundColor: cursorState.hoverType === 'text'
            ? 'hsl(var(--primary))'
            : 'hsl(var(--foreground))',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />

      {/* Outer ring with gradient */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: 'transparent',
          border: '1.5px solid',
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          opacity: isVisible ? (cursorState.isHovering ? 0.9 : 0.5) : 0,
          borderColor: cursorState.isClicking
            ? 'hsl(var(--primary))'
            : 'hsl(var(--primary) / 0.6)',
          scale: cursorState.isClicking ? 0.9 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />

      {/* Soft ambient glow on hover */}
      {cursorState.isHovering && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9996] rounded-full"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 40%, transparent 70%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: 60,
            height: 60,
            opacity: 0.9
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}

      {/* Gentle click ripple */}
      {cursorState.isClicking && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9995] rounded-full"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
          }}
          initial={{ width: 20, height: 20, opacity: 0.8 }}
          animate={{ width: 80, height: 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </>
  );
}
