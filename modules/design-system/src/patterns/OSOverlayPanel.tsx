'use client';

/**
 * OS Overlay Panel Component
 * 
 * STEP 3: OS App Window Model
 * 
 * Modal-grade overlay panel for:
 * - Create / Edit forms
 * - Detail views
 * - Confirmations
 * 
 * MENTAL MODEL:
 * - Not a page, but a surface on top of App Window
 * - Dim background slightly
 * - macOS-grade animation
 * 
 * PRINCIPLES:
 * - Focus trap when open
 * - Escape to close
 * - Click outside to close (optional)
 * - Smooth enter/exit animations
 */

import React, { ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OS_DURATION, OS_EASING } from '@/lib/motion/os-motion';

// Backdrop animation
const backdropVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: OS_DURATION.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: OS_DURATION.fast }
    },
};

// Panel animation
const panelVariants = {
    initial: {
        opacity: 0,
        y: 16,
        scale: 0.98,
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: OS_DURATION.normal,
            ease: OS_EASING.smooth,
        },
    },
    exit: {
        opacity: 0,
        y: 12,
        scale: 0.98,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        },
    },
};

export interface OSOverlayPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Called when panel should close */
    onClose: () => void;
    /** Panel content */
    children: ReactNode;
    /** Panel title for accessibility */
    title?: string;
    /** Panel size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Whether clicking backdrop closes panel */
    closeOnBackdropClick?: boolean;
    /** Whether pressing Escape closes panel */
    closeOnEscape?: boolean;
    /** Custom className */
    className?: string;
}

export function OSOverlayPanel({
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    closeOnBackdropClick = true,
    closeOnEscape = true,
    className = '',
}: OSOverlayPanelProps) {
    // Handle Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (closeOnEscape && e.key === 'Escape') {
            onClose();
        }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when panel is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Size classes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] max-h-[90vh]',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="os-overlay-panel fixed inset-0 z-50 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="os-overlay-backdrop absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                        variants={backdropVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        onClick={closeOnBackdropClick ? onClose : undefined}
                    />

                    {/* Panel */}
                    <motion.div
                        className={`
                            os-overlay-panel__content
                            relative
                            w-full
                            ${sizeClasses[size]}
                            bg-white
                            rounded-xl
                            shadow-2xl
                            overflow-hidden
                            ${className}
                        `}
                        variants={panelVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/**
 * Panel Header Component
 */
export interface OSOverlayPanelHeaderProps {
    title: string;
    subtitle?: string;
    onClose?: () => void;
}

export function OSOverlayPanelHeader({
    title,
    subtitle,
    onClose,
}: OSOverlayPanelHeaderProps) {
    return (
        <header className="os-overlay-panel__header flex items-start justify-between p-6 border-b border-neutral-100">
            <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 -mr-2 -mt-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </header>
    );
}

/**
 * Panel Body Component
 */
export function OSOverlayPanelBody({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`os-overlay-panel__body p-6 ${className}`}>
            {children}
        </div>
    );
}

/**
 * Panel Footer Component
 */
export function OSOverlayPanelFooter({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <footer className={`os-overlay-panel__footer flex items-center justify-end gap-3 p-6 border-t border-neutral-100 bg-neutral-50 ${className}`}>
            {children}
        </footer>
    );
}
