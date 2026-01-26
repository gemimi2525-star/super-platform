import { useState, useEffect, useCallback } from 'react';

interface UseDismissableOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    exitDuration?: number; // ms
}

export function useDismissableOverlay({
    isOpen,
    onClose,
    exitDuration = 120
}: UseDismissableOverlayProps) {
    // visible: should the element be in the DOM (true during exit animation)
    const [isVisible, setIsVisible] = useState(isOpen);

    // active: is the element logically "open" (false during exit animation)
    const [isActive, setIsActive] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay to allow mounting before starting entrance animation if needed, 
            // but for React state updates usually requestAnimationFrame is enough or just next tick.
            // Here we just set active true immediately, hoping usually CSS handles initial state.
            // For safety with CSS transitions, sometimes a double-raf is needed.
            // But simple boolean flip works for CSS keyframes 'animate-in'.
            requestAnimationFrame(() => setIsActive(true));
        } else {
            setIsActive(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, exitDuration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, exitDuration]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return {
        // Render if this is true
        shouldRender: isVisible,
        // Use this for animation state (data-state="open" | "closed")
        animationState: isActive ? 'open' : 'closed',
        // Handler for backdrop click
        handleBackdropClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onClose();
        },
    };
}
