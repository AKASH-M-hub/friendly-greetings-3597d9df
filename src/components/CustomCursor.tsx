import { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const CustomCursor = () => {
    const { theme } = useTheme();
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const coreRef = useRef<HTMLDivElement>(null);

    const [isVisible, setIsVisible] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    // Use refs for values that change frequently to avoid re-renders
    const position = useRef({ x: 0, y: 0 });
    const targetPosition = useRef({ x: 0, y: 0 });
    const rafId = useRef<number | null>(null);

    // Initial setup to center cursor off-screen or at 0,0
    useEffect(() => {
        const updatePosition = () => {
            // Smooth lerp for the outer ring
            const lerp = (start: number, end: number, factor: number) => {
                return start + (end - start) * factor;
            };

            position.current.x = lerp(position.current.x, targetPosition.current.x, 0.15);
            position.current.y = lerp(position.current.y, targetPosition.current.y, 0.15);

            // Access refs directly
            const ring = ringRef.current;
            const dot = dotRef.current;
            const core = coreRef.current;
            const glow = cursorRef.current;

            if (ring && dot && core && glow) {
                // Secondary ring lags slightly for smooth feel
                ring.style.transform = `translate3d(${position.current.x - 16}px, ${position.current.y - 16}px, 0) scale(${isPointer ? 1.4 : 1})`;
                ring.style.opacity = isClicking ? '0.5' : '1';

                // Glow follows ring with lag
                glow.style.transform = `translate3d(${position.current.x - 20}px, ${position.current.y - 20}px, 0) scale(${isPointer ? 1.5 : 1}) ${isClicking ? 'scale(0.8)' : ''}`;
                glow.style.opacity = isPointer ? '0.8' : '0.5';

                // Dot and Core follow mouse exactly (instant)
                dot.style.transform = `translate3d(${targetPosition.current.x - 6}px, ${targetPosition.current.y - 6}px, 0) scale(${isClicking ? 0.7 : isPointer ? 1.2 : 1})`;
                core.style.transform = `translate3d(${targetPosition.current.x - 2}px, ${targetPosition.current.y - 2}px, 0)`;
            }

            rafId.current = requestAnimationFrame(updatePosition);
        };

        rafId.current = requestAnimationFrame(updatePosition);

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [isPointer, isClicking]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            targetPosition.current = { x: e.clientX, y: e.clientY };
            if (!isVisible) setIsVisible(true);

            const target = e.target as HTMLElement;
            const isClickable = Boolean(
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                window.getComputedStyle(target).cursor === 'pointer'
            );

            // Only update state if it changes
            setIsPointer(prev => prev !== isClickable ? isClickable : prev);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        document.documentElement.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [isVisible]);

    const getThemeColors = () => {
        switch (theme) {
            case 'light':
                return {
                    primary: 'rgba(199, 85, 28, 0.9)',
                    secondary: 'rgba(218, 75, 15, 0.3)',
                    glow: 'rgba(221, 91, 31, 0.4)',
                    trail: 'rgba(204, 64, 9, 0.15)'
                };
            case 'sunset':
                return {
                    primary: 'rgba(249, 115, 22, 0.9)',
                    secondary: 'rgba(249, 115, 22, 0.3)',
                    glow: 'rgba(251, 146, 60, 0.5)',
                    trail: 'rgba(249, 115, 22, 0.15)'
                };
            case 'aqua':
                return {
                    primary: 'rgba(0, 188, 212, 0.9)',
                    secondary: 'rgba(0, 188, 212, 0.3)',
                    glow: 'rgba(0, 230, 230, 0.5)',
                    trail: 'rgba(0, 188, 212, 0.15)'
                };
            default: // dark
                return {
                    primary: 'rgba(227, 119, 5, 0.9)',
                    secondary: 'rgba(180, 86, 10, 0.3)',
                    glow: 'rgba(207, 52, 21, 0.5)',
                    trail: 'rgba(220, 69, 4, 0.15)'
                };
        }
    };

    const colors = getThemeColors();

    if (!isVisible) return null;

    return (
        <>
            <style>{`
                * {
                    cursor: none !important;
                }
            `}</style>

            {/* Outer glow ring */}
            <div
                ref={cursorRef}
                className="fixed pointer-events-none z-[9999] rounded-full mix-blend-screen transition-opacity duration-150 ease-out"
                style={{
                    left: 0,
                    top: 0,
                    width: 40,
                    height: 40,
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                    opacity: isPointer ? 0.8 : 0.5,
                    willChange: 'transform'
                }}
            />

            {/* Secondary ring */}
            <div
                ref={ringRef}
                className="fixed pointer-events-none z-[9999] rounded-full border-2 transition-opacity duration-200 ease-out"
                style={{
                    left: 0,
                    top: 0,
                    width: 32,
                    height: 32,
                    borderColor: colors.secondary,
                    opacity: isClicking ? 0.5 : 1,
                    willChange: 'transform'
                }}
            />

            {/* Primary cursor dot */}
            <div
                ref={dotRef}
                className="fixed pointer-events-none z-[9999] rounded-full"
                style={{
                    left: 0,
                    top: 0,
                    width: 12,
                    height: 12,
                    background: colors.primary,
                    boxShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.trail}`,
                    visibility: isVisible ? 'visible' : 'hidden',
                    willChange: 'transform'
                }}
            />

            {/* Inner bright core */}
            <div
                ref={coreRef}
                className="fixed pointer-events-none z-[9999] rounded-full"
                style={{
                    left: 0,
                    top: 0,
                    width: 4,
                    height: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: `0 0 8px ${colors.primary}`,
                    visibility: isVisible ? 'visible' : 'hidden',
                    willChange: 'transform'
                }}
            />
        </>
    );
};

export default CustomCursor;
