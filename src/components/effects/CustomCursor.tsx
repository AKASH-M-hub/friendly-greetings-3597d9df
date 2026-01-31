import { useEffect, useState, useMemo } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

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
  const [gradientAngle, setGradientAngle] = useState(0);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 35, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Softer trail springs with varying delays for gradient effect
  const trailConfigs = useMemo(() => 
    Array.from({ length: 8 }).map((_, i) => ({
      damping: 20 + i * 4,
      stiffness: 200 - i * 18,
      mass: 0.2 + i * 0.08,
    })), []
  );

  const trailSprings = trailConfigs.map((config) => ({
    x: useSpring(cursorX, config),
    y: useSpring(cursorY, config),
  }));

  // Rotating gradient angle for dynamic effect
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientAngle(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
    if (cursorState.isClicking) return 8;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 14;
    return 10;
  };

  const getRingSize = () => {
    if (cursorState.isClicking) return 32;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 48;
    return 28;
  };

  // Gradient colors for the trail - creates a rainbow/aurora effect
  const getTrailGradient = (index: number) => {
    const hueShift = (gradientAngle + index * 30) % 360;
    return `linear-gradient(${hueShift}deg, 
      hsl(var(--primary) / ${0.6 - index * 0.06}) 0%, 
      hsl(${hueShift} 80% 60% / ${0.4 - index * 0.04}) 50%,
      transparent 100%)`;
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

      {/* Gradient trail particles */}
      {trailSprings.map((spring, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed left-0 top-0 z-[9996] rounded-full"
          style={{
            x: spring.x,
            y: spring.y,
            translateX: '-50%',
            translateY: '-50%',
            width: 12 - index * 1,
            height: 12 - index * 1,
            background: getTrailGradient(index),
            opacity: isVisible ? 0.9 - index * 0.1 : 0,
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Main cursor dot with gradient glow */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: `linear-gradient(${gradientAngle}deg, hsl(var(--primary)), hsl(var(--accent)))`,
        }}
        animate={{
          width: getCursorSize(),
          height: getCursorSize(),
          opacity: isVisible ? 1 : 0,
          boxShadow: cursorState.isHovering 
            ? `0 0 24px hsl(var(--primary) / 0.6), 0 0 48px hsl(var(--primary) / 0.4), 0 0 72px hsl(var(--primary) / 0.2)`
            : `0 0 16px hsl(var(--primary) / 0.4), 0 0 32px hsl(var(--primary) / 0.2)`,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />

      {/* Outer gradient ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: `conic-gradient(from ${gradientAngle}deg, 
            hsl(var(--primary) / 0.8), 
            hsl(var(--accent) / 0.6), 
            hsl(var(--primary) / 0.4), 
            hsl(var(--accent) / 0.6), 
            hsl(var(--primary) / 0.8))`,
          WebkitMask: 'radial-gradient(transparent 60%, black 62%, black 100%)',
          mask: 'radial-gradient(transparent 60%, black 62%, black 100%)',
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          opacity: isVisible ? (cursorState.isHovering ? 1 : 0.7) : 0,
          scale: cursorState.isClicking ? 0.85 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />

      {/* Soft ambient glow on hover with gradient */}
      {cursorState.isHovering && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9995] rounded-full"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(circle, 
              hsl(var(--primary) / 0.2) 0%, 
              hsl(var(--accent) / 0.1) 40%, 
              transparent 70%)`,
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: 80,
            height: 80,
            opacity: 0.9
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}

      {/* Gradient click ripple */}
      {cursorState.isClicking && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9994] rounded-full"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(circle, 
              hsl(var(--primary) / 0.3) 0%, 
              hsl(var(--accent) / 0.2) 30%,
              transparent 70%)`,
          }}
          initial={{ width: 24, height: 24, opacity: 0.9 }}
          animate={{ width: 100, height: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Extra sparkle particles on click */}
      {cursorState.isClicking && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="pointer-events-none fixed left-0 top-0 z-[9993] rounded-full"
              style={{
                x: cursorX,
                y: cursorY,
                width: 4,
                height: 4,
                background: `hsl(var(--primary))`,
              }}
              initial={{ 
                translateX: '-50%', 
                translateY: '-50%',
                opacity: 1,
              }}
              animate={{ 
                translateX: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * 40}px)`,
                translateY: `calc(-50% + ${Math.sin(angle * Math.PI / 180) * 40}px)`,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ))}
        </>
      )}
    </>
  );
}
