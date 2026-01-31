/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CoreHub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: OS-grade app launcher overlay (like macOS Launchpad)
 * 
 * Features:
 * - Full-screen overlay with blur backdrop
 * - App grid from CoreAppsRegistry
 * - Open/close with animation
 * - Esc key to close
 * - Click outside to close
 * - Keyboard navigation
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CoreAppIcon } from '../app-icon/CoreAppIcon';
import { CoreAppGrid } from '../app-grid/CoreAppGrid';
import { getEnabledApps, type CoreAppDefinition } from '@/lib/os-core/coreApps';
import {
    Users, Building2, ScrollText, Settings,
    Home, Grid3X3, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoreHubProps {
    /** Whether the hub is open */
    isOpen: boolean;
    /** Callback when hub should close */
    onClose: () => void;
    /** Callback when an app is selected */
    onSelectApp?: (app: CoreAppDefinition) => void;
    /** Current active app ID (for selected state) */
    activeAppId?: string;
    /** Portal container */
    container?: HTMLElement;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const iconMap: Record<string, React.ReactNode> = {
    Users: <Users size={24} />,
    Building2: <Building2 size={24} />,
    ScrollText: <ScrollText size={24} />,
    Settings: <Settings size={24} />,
    Home: <Home size={24} />,
    Grid3X3: <Grid3X3 size={24} />,
};

function getIconForApp(iconName: string): React.ReactNode {
    return iconMap[iconName] || <Grid3X3 size={24} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const }
    },
};

const contentVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1] as const,
            staggerChildren: 0.03,
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: 10,
        transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const }
    },
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2 }
    },
};


// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreHub({
    isOpen,
    onClose,
    onSelectApp,
    activeAppId,
    container,
}: CoreHubProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const apps = getEnabledApps();

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle click outside
    const handleBackdropClick = useCallback((event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // Handle app selection
    const handleAppClick = useCallback((app: CoreAppDefinition) => {
        onSelectApp?.(app);
        onClose();
    }, [onSelectApp, onClose]);

    // Focus trap (basic implementation)
    useEffect(() => {
        if (!isOpen || !contentRef.current) return;

        const firstFocusable = contentRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
    }, [isOpen]);

    const portalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="core-hub-backdrop"
                    className="core-hub-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleBackdropClick}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    {/* Content Container */}
                    <motion.div
                        ref={contentRef}
                        className="core-hub-content"
                        variants={contentVariants}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '720px',
                            maxHeight: '80vh',
                            margin: 'var(--os-space-8)',
                            padding: 'var(--os-space-8)',
                            backgroundColor: 'var(--os-color-surface)',
                            borderRadius: 'var(--os-radius-2xl)',
                            boxShadow: 'var(--os-shadow-2xl)',
                            overflow: 'auto',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--os-space-6)',
                        }}>
                            <div>
                                <h2 style={{
                                    fontSize: 'var(--os-text-xl)',
                                    fontWeight: 600,
                                    fontFamily: 'var(--os-font-sans)',
                                    color: 'var(--os-color-text)',
                                    margin: 0,
                                }}>
                                    Core Hub
                                </h2>
                                <p style={{
                                    fontSize: 'var(--os-text-sm)',
                                    color: 'var(--os-color-text-muted)',
                                    margin: 0,
                                    marginTop: 'var(--os-space-1)',
                                }}>
                                    Select an app to open
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close hub"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--os-radius-md)',
                                    cursor: 'pointer',
                                    color: 'var(--os-color-text-muted)',
                                    transition: 'all var(--os-motion-fast) ease-out',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--os-color-surface-hover)';
                                    e.currentTarget.style.color = 'var(--os-color-text)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--os-color-text-muted)';
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* App Grid */}
                        <CoreAppGrid minItemWidth={100} gap="lg">
                            {apps.map((app) => (
                                <motion.div key={app.id} variants={itemVariants}>
                                    <CoreAppIcon
                                        icon={getIconForApp(app.iconName)}
                                        label={app.labelFallback}
                                        size="lg"
                                        selected={activeAppId === app.id}
                                        onClick={() => handleAppClick(app)}
                                    />
                                </motion.div>
                            ))}
                        </CoreAppGrid>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render in portal
    if (typeof window === 'undefined') return null;

    return createPortal(
        portalContent,
        container || document.body
    );
}

CoreHub.displayName = 'CoreHub';

export default CoreHub;
