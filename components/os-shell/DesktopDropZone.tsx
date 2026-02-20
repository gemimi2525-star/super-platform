/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Drop Zone + Shortcut Grid (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Drop zone spanning the desktop surface. Accepts:
 * - 'capability' drops → creates desktop shortcut
 * - 'file' drops → shows VFS-locked indicator (Phase 15A constraint)
 *
 * Shortcuts persist in localStorage.
 *
 * @module components/os-shell/DesktopDropZone
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDragContext, useDropZone } from '@/coreos/dnd';
import type { DragPayload } from '@/coreos/dnd';
import type { CapabilityId } from '@/coreos/types';

// ─── Shortcut Store (localStorage) ─────────────────────────────────────

interface DesktopShortcut {
    id: string;
    capabilityId: CapabilityId;
    label: string;
    icon: string;
    position: { x: number; y: number };
    createdAt: string;
}

const STORAGE_KEY = 'coreos.desktop.shortcuts';

function loadShortcuts(): DesktopShortcut[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveShortcuts(shortcuts: DesktopShortcut[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch {
        // Non-blocking
    }
}

// ─── Grid snapping ─────────────────────────────────────────────────────

const GRID_SIZE = 100;
const ICON_SIZE = 64;

function snapToGrid(x: number, y: number): { x: number; y: number } {
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
}

// ─── Component ─────────────────────────────────────────────────────────

interface DesktopDropZoneProps {
    onOpenCapability?: (capabilityId: CapabilityId) => void;
}

export function DesktopDropZone({ onOpenCapability }: DesktopDropZoneProps) {
    const { phase } = useDragContext();
    const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>([]);
    const [vfsLockedMsg, setVfsLockedMsg] = useState<string | null>(null);

    // Load shortcuts on mount
    useEffect(() => {
        setShortcuts(loadShortcuts());
    }, []);

    // Handle drop
    const handleDrop = useCallback((payload: DragPayload, position: { x: number; y: number }): boolean => {
        if (payload.type === 'capability' && payload.capabilityId) {
            const snapped = snapToGrid(position.x, position.y);

            // Check if shortcut already exists at this capabilityId
            const exists = shortcuts.some(s => s.capabilityId === payload.capabilityId);
            if (exists) {
                return true; // Accept drop but don't duplicate
            }

            const shortcut: DesktopShortcut = {
                id: `shortcut-${Date.now()}`,
                capabilityId: payload.capabilityId,
                label: payload.label,
                icon: payload.icon ?? '📦',
                position: snapped,
                createdAt: new Date().toISOString(),
            };

            const next = [...shortcuts, shortcut];
            setShortcuts(next);
            saveShortcuts(next);
            return true;
        }

        if (payload.type === 'file') {
            // VFS 15A Lock — show message
            setVfsLockedMsg('VFS is currently locked (Phase 15A). File drop not available.');
            setTimeout(() => setVfsLockedMsg(null), 3000);
            return true; // Accept to clear drag state
        }

        return false;
    }, [shortcuts]);

    const { dropRef, isOver, canDrop, handlers } = useDropZone({
        zoneId: 'desktop',
        accepts: ['capability', 'file'],
        onDrop: handleDrop,
    });

    // Remove shortcut handler
    const removeShortcut = useCallback((id: string) => {
        const next = shortcuts.filter(s => s.id !== id);
        setShortcuts(next);
        saveShortcuts(next);
    }, [shortcuts]);

    const isDragging = phase === 'dragging';

    return (
        <div
            ref={dropRef}
            {...handlers}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                // Visual feedback during drag
                ...(isDragging && canDrop ? {
                    outline: '2px dashed rgba(100, 180, 255, 0.4)',
                    outlineOffset: '-4px',
                    borderRadius: '8px',
                } : {}),
                ...(isOver ? {
                    backgroundColor: 'rgba(100, 180, 255, 0.08)',
                } : {}),
                transition: 'background-color 0.2s ease, outline 0.2s ease',
            }}
        >
            {/* Desktop Shortcuts Grid */}
            {shortcuts.map(shortcut => (
                <div
                    key={shortcut.id}
                    style={{
                        position: 'absolute',
                        left: shortcut.position.x,
                        top: shortcut.position.y,
                        width: ICON_SIZE,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                    onClick={() => onOpenCapability?.(shortcut.capabilityId)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeShortcut(shortcut.id);
                    }}
                    title={`${shortcut.label}\nRight-click to remove`}
                >
                    <div style={{
                        fontSize: '32px',
                        width: '52px',
                        height: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                    }}>
                        {shortcut.icon}
                    </div>
                    <span style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.85)',
                        textAlign: 'center',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {shortcut.label}
                    </span>
                </div>
            ))}

            {/* VFS Locked Indicator */}
            {vfsLockedMsg && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255, 120, 50, 0.9)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    zIndex: 9999,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    🔒 {vfsLockedMsg}
                </div>
            )}
        </div>
    );
}
