/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ContextMenu — Phase 13: OS-Level Context Menu
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Custom context menu component rendered as a positioned overlay.
 * Replaces native right-click menu throughout the OS Shell.
 * 
 * Features:
 * - Positioned at cursor location
 * - Auto-closes on click outside or ESC
 * - Supports icons, labels, shortcuts, dividers, and disabled items
 * - Subtle open animation
 * - Uses NEXUS Design Tokens
 * 
 * @module components/os-shell/ContextMenu
 * @version 1.0.0 (Phase 13)
 */

'use client';

import React, { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
    onClick: () => void;
}

export interface ContextMenuDivider {
    id: string;
    type: 'divider';
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider;

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuEntry[];
    onClose: () => void;
}

function isDivider(entry: ContextMenuEntry): entry is ContextMenuDivider {
    return 'type' in entry && entry.type === 'divider';
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Use setTimeout to avoid immediate close from the right-click that opened this
        const t = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 10);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Adjust position to stay within viewport
    const adjustedX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1920) - 220);
    const adjustedY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 1080) - items.length * 36);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: adjustedY,
                left: adjustedX,
                minWidth: 200,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 'var(--nx-radius-base)',
                boxShadow: 'var(--nx-shadow-dropdown)',
                border: '1px solid var(--nx-border-subtle)',
                padding: '4px 0',
                zIndex: 'var(--nx-z-dropdown)',
                fontFamily: 'var(--nx-font-system)',
                fontSize: 'var(--nx-text-body)',
                animation: 'nx-context-menu-open 100ms var(--nx-ease-out) forwards',
                overflow: 'hidden',
            }}
        >
            {items.map((entry) => {
                if (isDivider(entry)) {
                    return (
                        <div
                            key={entry.id}
                            style={{
                                height: 1,
                                background: 'var(--nx-border-divider)',
                                margin: '4px 0',
                            }}
                        />
                    );
                }

                return (
                    <button
                        key={entry.id}
                        onClick={() => {
                            if (!entry.disabled) {
                                entry.onClick();
                                onClose();
                            }
                        }}
                        disabled={entry.disabled}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '6px 12px',
                            background: 'transparent',
                            border: 'none',
                            cursor: entry.disabled ? 'default' : 'pointer',
                            color: entry.disabled
                                ? 'var(--nx-text-disabled)'
                                : entry.danger
                                    ? 'var(--nx-danger)'
                                    : 'var(--nx-text-primary)',
                            fontSize: 'var(--nx-text-body)',
                            fontFamily: 'var(--nx-font-system)',
                            textAlign: 'left',
                            gap: '8px',
                            borderRadius: 'var(--nx-radius-sm)',
                            margin: '0 4px',
                            transition: 'background var(--nx-duration-instant) ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!entry.disabled) {
                                (e.target as HTMLElement).style.background = 'var(--nx-accent)';
                                (e.target as HTMLElement).style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.background = 'transparent';
                            (e.target as HTMLElement).style.color = entry.disabled
                                ? 'var(--nx-text-disabled)'
                                : entry.danger
                                    ? 'var(--nx-danger)'
                                    : 'var(--nx-text-primary)';
                        }}
                    >
                        {entry.icon && (
                            <span style={{ width: 18, textAlign: 'center', flexShrink: 0 }}>
                                {entry.icon}
                            </span>
                        )}
                        <span style={{ flex: 1 }}>{entry.label}</span>
                        {entry.shortcut && (
                            <span style={{
                                color: 'var(--nx-text-tertiary)',
                                fontSize: 'var(--nx-text-caption)',
                                fontFamily: 'var(--nx-font-system)',
                                marginLeft: 16,
                            }}>
                                {entry.shortcut}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
