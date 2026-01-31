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
  const [isVisible, setIsVisible] = useState(true); // Always visible by default
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(0);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Physics optimization: stiffness 800 makes it very snappy (fast), damping 28 prevents oscillation
  const springConfig = { damping: 28, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Softer trail springs but tighter than before
  const trailConfigs = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      damping: 20 + i * 2,  // Reduced increment
      stiffness: 400 - i * 30, // Higher base stiffness
      mass: 0.1 + i * 0.05, // Lower mass
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
    // if (isTouchDevice) return; // Removed this line

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      // if (!isVisible) setIsVisible(true); // Removed this line
    };

    // setIsVisible(true); // Removed this line
    // console.log("CustomCursor mounted"); // Removed this line

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

    // const handleMouseLeave = () => { // Removed this function
    //   setIsVisible(false);
    // };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseEnter);
    // document.documentElement.addEventListener('mouseleave', handleMouseLeave); // Removed this line

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseEnter);
      // document.documentElement.removeEventListener('mouseleave', handleMouseLeave); // Removed this line
    };
  }, [cursorX, cursorY]); // Removed isVisible and isTouchDevice from dependencies

  // Force render even on touch devices for now to debug visibility
  // if (isTouchDevice) return null;

  const getCursorSize = () => {
    if (cursorState.isClicking) return 8;
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 14;
    return 10;
  };

  const getRingSize = () => {
    if (cursorState.isClicking) return 24; // Reduced from 32
    if (cursorState.hoverType === 'button' || cursorState.hoverType === 'link') return 36; // Reduced from 48
    return 20; // Reduced from 28
  };

  // Gradient colors for the trail - creates a vibrant rainbow/aurora effect
  const getTrailGradient = (index: number) => {
    const hueShift = (gradientAngle + index * 45) % 360; // Faster color shift
    return `linear-gradient(${hueShift}deg, 
      hsl(var(--primary)) 0%, 
      hsl(${hueShift} 80% 60%) 100%)`;
  };

  return (
    <>
      <style>{`
        html, body, a, button, input, textarea, select, [role="button"] {
          cursor: none !important;
        }
        /* Restore cursor for touch devices if needed, but for now force hide to debug */
      `}</style>

      {/* Gradient trail particles */}
      {trailSprings.map((spring, index) => (
        <motion.div
          key={index}
          className="pointer-events-none fixed left-0 top-0 z-[2147483645] rounded-full"
          style={{
            x: spring.x,
            y: spring.y,
            translateX: '-50%',
            translateY: '-50%',
            width: 10 - index * 1.2,
            height: 10 - index * 1.2,
            background: getTrailGradient(index),
            opacity: isVisible ? 0.6 - index * 0.05 : 0, // Increased opacity
            filter: 'blur(2px)',
          }}
        />
      ))}

      {/* Main cursor dot with gradient glow */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full shadow-sm"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: `hsl(var(--primary))`, // Primary color!
          border: '1px solid white', // White border for contrast
        }}
        animate={{
          width: getCursorSize(),
          height: getCursorSize(),
          opacity: 1, // Always opaque
          scale: cursorState.isClicking ? 0.8 : 1,
        }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />

      {/* Intense Gradient Glow Layer */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          background: `conic-gradient(from ${gradientAngle}deg, 
            hsl(var(--primary)), 
            #ff0080, 
            hsl(var(--primary)), 
            #7928ca, 
            hsl(var(--primary)))`,
          filter: 'blur(8px)',
        }}
        animate={{
          width: getRingSize() * 1.5,
          height: getRingSize() * 1.5,
          opacity: isVisible ? 0.5 : 0, // Reduced opacity without blend mode
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Outer rotating ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9997] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          background: 'transparent',
        }}
        animate={{
          width: getRingSize(),
          height: getRingSize(),
          opacity: isVisible ? (cursorState.isHovering ? 1 : 0.5) : 0,
          rotate: gradientAngle,
        }}
        transition={{ duration: 0 }}
      />
    </>
  );
}
