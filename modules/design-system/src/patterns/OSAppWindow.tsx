'use client';

/**
 * OS App Window Component
 * 
 * STEP 3: OS App Window Model
 * 
 * This component wraps App content to create the "window" feel.
 * Apps are not pages - they are windows/surfaces within the OS.
 * 
 * MENTAL MODEL:
 * - App = Window, not Page
 * - OS Chrome stays mounted
 * - Window opens with animation
 * - Scroll is contained within window
 * 
 * WINDOW TYPES:
 * - primary: Full workspace width (default)
 * - compact: Narrower width for focused tasks
 * 
 * PRINCIPLES:
 * - OS Chrome (TopBar + Sidebar) never re-mounts
 * - Window has depth / shadow / frame feel
 * - Scroll is isolated from OS Desktop
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { OS_DURATION, OS_EASING } from '@/lib/motion/os-motion';

// Window animation variants
const windowVariants = {
    initial: {
        opacity: 0,
        y: 10,
        scale: 0.99,
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: OS_DURATION.slow,
            ease: OS_EASING.smooth,
        },
    },
    exit: {
        opacity: 0,
        y: 8,
        scale: 0.99,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        },
    },
};

export interface OSAppWindowProps {
    children: ReactNode;
    /** Window type - primary (full width) or compact (narrower) */
    variant?: 'primary' | 'compact';
    /** Whether to show window animation on mount */
    animate?: boolean;
    /** Custom className for the window container */
    className?: string;
    /** Accessible label for the window */
    ariaLabel?: string;
}

export function OSAppWindow({
    children,
    variant = 'primary',
    animate = true,
    className = '',
    ariaLabel,
}: OSAppWindowProps) {
    const variantStyles = {
        primary: 'max-w-full',
        compact: 'max-w-5xl mx-auto',
    };

    const WindowContent = (
        <div
            role="main"
            aria-label={ariaLabel}
            className={`
                os-app-window
                relative
                min-h-full
                bg-neutral-50
                ${variantStyles[variant]}
                ${className}
            `}
            style={{
                // Contain scroll within window
                overflowY: 'auto',
                overflowX: 'hidden',
            }}
        >
            {/* Window Content Area */}
            <div className="os-app-window__content p-6">
                {children}
            </div>
        </div>
    );

    // If animation disabled, render directly
    if (!animate) {
        return WindowContent;
    }

    // Animated window
    return (
        <motion.div
            className="os-app-window-container h-full"
            variants={windowVariants}
            initial="initial"
            animate="enter"
            exit="exit"
        >
            {WindowContent}
        </motion.div>
    );
}

/**
 * Window Header Component
 * 
 * Used within OSAppWindow for consistent app headers.
 * Includes breadcrumbs, title, subtitle, and actions.
 */
export interface OSAppWindowHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
    actions?: ReactNode;
}

export function OSAppWindowHeader({
    title,
    subtitle,
    breadcrumbs,
    actions,
}: OSAppWindowHeaderProps) {
    return (
        <header className="os-app-window__header mb-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="os-breadcrumbs text-sm text-neutral-500 mb-2">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index}>
                            {crumb.href ? (
                                <a
                                    href={crumb.href}
                                    className="hover:text-neutral-700 transition-colors no-underline"
                                >
                                    {crumb.label}
                                </a>
                            ) : (
                                <span className="text-neutral-700 font-medium">
                                    {crumb.label}
                                </span>
                            )}
                            {index < breadcrumbs.length - 1 && (
                                <span className="mx-2 text-neutral-300">/</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-neutral-500 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {actions && (
                    <div className="os-app-window__actions flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
}
