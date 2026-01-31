/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core System Menu
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4: Top-left logo dropdown menu (macOS-style)
 * 
 * Features:
 * - 7 menu items (v1)
 * - Keyboard navigation (Arrow up/down + Enter + Escape)
 * - Click outside to close
 * - i18n support EN/TH
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useOSRouter } from '@/lib/stores/osRouterStore';
import { useCorePreferences } from '@/lib/stores/corePreferencesStore';
import { OS_DURATION, OS_EASING } from '@/lib/motion/os-motion';
import { CoreSystemLogo } from './CoreSystemLogo';
import {
    Info,
    Settings,
    Grid3X3,
    Clock,
    Palette,
    Lock,
    LogOut,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreMenuItem =
    | 'about'
    | 'settings'
    | 'apps'
    | 'recent'
    | 'appearance'
    | 'lock'
    | 'logout';

interface MenuItem {
    id: CoreMenuItem;
    labelKey: string;
    icon: React.ComponentType<{ className?: string }>;
    action: 'panel' | 'navigate' | 'action';
}

export interface CoreSystemMenuProps {
    locale: string;
    onOpenSettings?: (section?: string) => void;
    onOpenAbout?: () => void;
    onLogout?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const MENU_ITEMS: MenuItem[] = [
    { id: 'about', labelKey: 'about', icon: Info, action: 'panel' },
    { id: 'settings', labelKey: 'systemSettings', icon: Settings, action: 'panel' },
    { id: 'apps', labelKey: 'coreApps', icon: Grid3X3, action: 'navigate' },
    { id: 'recent', labelKey: 'recentItems', icon: Clock, action: 'navigate' },
    { id: 'appearance', labelKey: 'brandAppearance', icon: Palette, action: 'panel' },
    { id: 'lock', labelKey: 'lockDesktop', icon: Lock, action: 'action' },
    { id: 'logout', labelKey: 'logOut', icon: LogOut, action: 'action' },
];

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const menuVariants = {
    initial: {
        opacity: 0,
        y: -8,
        scale: 0.96
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: OS_DURATION.normal,
            ease: OS_EASING.smooth,
        }
    },
    exit: {
        opacity: 0,
        y: -4,
        scale: 0.98,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreSystemMenu({
    locale,
    onOpenSettings,
    onOpenAbout,
    onLogout,
}: CoreSystemMenuProps) {
    const router = useRouter();
    const t = useTranslations('v2.coreSystem.menu');
    const { setActiveApp } = useOSRouter();
    const { recentApps, setLocked } = useCorePreferences();

    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // ─────────────────────────────────────────────────────────────────────
    // CLICK OUTSIDE
    // ─────────────────────────────────────────────────────────────────────

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // ─────────────────────────────────────────────────────────────────────
    // KEYBOARD NAVIGATION
    // ─────────────────────────────────────────────────────────────────────

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                setIsOpen(false);
                setFocusedIndex(-1);
                triggerRef.current?.focus();
                break;

            case 'ArrowDown':
                event.preventDefault();
                setFocusedIndex(prev =>
                    prev < MENU_ITEMS.length - 1 ? prev + 1 : 0
                );
                break;

            case 'ArrowUp':
                event.preventDefault();
                setFocusedIndex(prev =>
                    prev > 0 ? prev - 1 : MENU_ITEMS.length - 1
                );
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex >= 0) {
                    handleItemClick(MENU_ITEMS[focusedIndex]);
                }
                break;

            case 'Tab':
                // Close on tab
                setIsOpen(false);
                setFocusedIndex(-1);
                break;
        }
    }, [isOpen, focusedIndex]);

    // Focus management
    useEffect(() => {
        if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.focus();
        }
    }, [focusedIndex]);

    // ─────────────────────────────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────────────────────────────

    const handleItemClick = (item: MenuItem) => {
        setIsOpen(false);
        setFocusedIndex(-1);

        switch (item.id) {
            case 'about':
                onOpenAbout?.();
                break;

            case 'settings':
                onOpenSettings?.();
                break;

            case 'apps':
                // Navigate to OS Home (app launcher)
                setActiveApp('os-home');
                break;

            case 'recent':
                // For v1: Navigate to OS Home (shows recent)
                setActiveApp('os-home');
                break;

            case 'appearance':
                onOpenSettings?.('appearance');
                break;

            case 'lock':
                setLocked(true);
                break;

            case 'logout':
                onLogout?.();
                break;
        }
    };

    const toggleMenu = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            setFocusedIndex(0);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div
            ref={menuRef}
            className="core-system-menu relative"
            onKeyDown={handleKeyDown}
        >
            {/* Trigger Button (Logo) */}
            <button
                ref={triggerRef}
                onClick={toggleMenu}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    transition-colors duration-150
                    hover:bg-neutral-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    ${isOpen ? 'bg-neutral-100' : ''}
                `}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={t('title')}
            >
                {/* Use reactive CoreSystemLogo component */}
                <CoreSystemLogo size="md" showLabel={true} />
                <svg
                    className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                        className={`
                            absolute top-full left-0 mt-1
                            w-56 py-1.5
                            bg-white/95 backdrop-blur-xl
                            border border-neutral-200/80
                            rounded-xl shadow-lg shadow-black/5
                            z-[var(--os-z-dropdown)]
                        `}
                        role="menu"
                        aria-orientation="vertical"
                    >
                        {MENU_ITEMS.map((item, index) => {
                            const Icon = item.icon;
                            const isFocused = focusedIndex === index;
                            const isLogout = item.id === 'logout';

                            return (
                                <button
                                    key={item.id}
                                    ref={el => { itemRefs.current[index] = el; }}
                                    onClick={() => handleItemClick(item)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2 mx-1.5
                                        text-sm text-left rounded-lg
                                        transition-colors duration-100
                                        ${isFocused ? 'bg-blue-50' : 'hover:bg-neutral-50'}
                                        ${isLogout ? 'text-red-600 hover:bg-red-50' : 'text-neutral-700'}
                                        focus:outline-none focus:bg-blue-50
                                    `}
                                    style={{ width: 'calc(100% - 12px)' }}
                                    role="menuitem"
                                    tabIndex={isFocused ? 0 : -1}
                                >
                                    <Icon className={`w-4 h-4 ${isLogout ? 'text-red-500' : 'text-neutral-400'}`} />
                                    <span>{t(item.labelKey)}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CoreSystemMenu;
