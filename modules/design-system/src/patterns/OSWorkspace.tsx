'use client';

/**
 * OS Workspace Container
 * 
 * STEP 3 + 3.1: OS App Window Model + Performance
 * 
 * This component wraps the main content area to create the
 * "workspace surface" feel. It provides:
 * 
 * - Visual depth separation from OS Desktop
 * - Smooth cross-fade between apps
 * - Window-like container styling
 * - DEV-only performance instrumentation
 * 
 * Used within AppShell to wrap {children} content.
 * 
 * MENTAL MODEL:
 * - Workspace = The surface where App Windows live
 * - OS Chrome stays static around the workspace
 * - Content within workspace animates on route change
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OS_DURATION, OS_EASING } from '@/lib/motion/os-motion';

// DEV-only performance tracking
const isDev = process.env.NODE_ENV === 'development';

// Workspace content animation variants
const workspaceContentVariants = {
    initial: {
        opacity: 0,
        y: 6,
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: OS_DURATION.normal,
            ease: OS_EASING.smooth,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        },
    },
};

export interface OSWorkspaceProps {
    children: ReactNode;
    /** Unique key for AnimatePresence (usually the route/pathname) */
    routeKey?: string;
    /** Custom className */
    className?: string;
}

export function OSWorkspace({
    children,
    routeKey,
    className = '',
}: OSWorkspaceProps) {
    const lastRouteRef = useRef<string | null>(null);
    const routeStartRef = useRef<number>(0);

    // DEV-only: Track route change timing
    useEffect(() => {
        if (!isDev) return;

        const currentRoute = routeKey || 'default';
        const now = performance.now();

        if (lastRouteRef.current && lastRouteRef.current !== currentRoute) {
            // Route changed - measure time from when route started to content paint
            const elapsed = now - routeStartRef.current;
            const from = lastRouteRef.current.split('/').pop() || 'unknown';
            const to = currentRoute.split('/').pop() || 'unknown';

            console.info(
                `[OS Perf] 🚀 Route: ${from} → ${to} | Content Paint: ${elapsed.toFixed(0)}ms`
            );

            // Log warning if navigation feels slow
            if (elapsed > 300) {
                console.warn(`[OS Perf] ⚠️ Slow navigation detected (>${303}ms). Consider prefetching.`);
            }
        }

        // Mark this as the new last route
        lastRouteRef.current = currentRoute;
        routeStartRef.current = now;
    }, [routeKey]);

    return (
        <div
            className={`
                os-workspace
                relative
                h-full
                overflow-hidden
                bg-neutral-50
                ${className}
            `}
        >
            {/* Animated content container */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={routeKey || 'default'}
                    className="os-workspace__content os-workspace-content h-full overflow-auto"
                    data-scroll-container="true"
                    variants={workspaceContentVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    // Report when animation completes
                    onAnimationComplete={() => {
                        if (isDev && routeStartRef.current) {
                            const elapsed = performance.now() - routeStartRef.current;
                            console.info(`[OS Perf] ✅ Animation complete: ${elapsed.toFixed(0)}ms total`);
                        }
                    }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/**
 * OS Workspace Surface
 * 
 * A styled container for app content with window-like appearance.
 * Use inside OSWorkspace when you want a "panel" feel.
 */
export interface OSWorkspaceSurfaceProps {
    children: ReactNode;
    /** Maximum width of the surface */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Add rounded corners and shadow */
    elevated?: boolean;
    /** Custom className */
    className?: string;
}

export function OSWorkspaceSurface({
    children,
    maxWidth = 'full',
    elevated = false,
    className = '',
}: OSWorkspaceSurfaceProps) {
    const maxWidthClasses = {
        sm: 'max-w-2xl',
        md: 'max-w-4xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        full: 'max-w-full',
    };

    return (
        <div
            className={`
                os-workspace-surface
                mx-auto
                ${maxWidthClasses[maxWidth]}
                ${elevated ? 'bg-white rounded-xl shadow-sm border border-neutral-100 p-6' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

