/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Drop Zone (Phase 19.5 — Intent-Bound)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Drop target for the desktop surface.
 * - Capability drops → Intent → POST /api/os/desktop/shortcuts/create → Apply → Store
 * - File drops → VFS-locked indicator (Phase 15A)
 *
 * No direct localStorage mutations. All writes go through the Apply Layer.
 *
 * @module components/os-shell/DesktopDropZone
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { DragPayload } from '@/coreos/dnd/dragTypes';
import { useDropZone } from '@/coreos/dnd/useDropZone';
import { useShortcutStore } from '@/coreos/desktop/shortcuts/store';
import { buildDropIntent, registerDesktopTarget } from '@/coreos/dnd/dropRegistry';
import type { DesktopShortcut } from '@/coreos/desktop/shortcuts/types';

// ─── Props ─────────────────────────────────────────────────────────────

interface DesktopDropZoneProps {
    onOpenCapability: (capabilityId: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────

export function DesktopDropZone({ onOpenCapability }: DesktopDropZoneProps) {
    const [vfsLockedMsg, setVfsLockedMsg] = useState<string | null>(null);
    const [pendingDrop, setPendingDrop] = useState(false);

    // Zustand store for shortcuts
    const shortcuts = useShortcutStore(s => s.shortcuts);
    const addShortcut = useShortcutStore(s => s.addShortcut);
    const removeShortcut = useShortcutStore(s => s.removeShortcut);
    const hydrate = useShortcutStore(s => s.hydrate);

    // Register desktop target + hydrate on mount
    useEffect(() => {
        registerDesktopTarget();
        hydrate();
    }, [hydrate]);

    // ─── Intent-Bound Drop Handler ─────────────────────────────
    const handleDrop = useCallback(async (payload: DragPayload, position: { x: number; y: number }): Promise<boolean> => {
        if (payload.type === 'capability' && payload.capabilityId) {
            // Step 1: Build intent via registry
            const intent = buildDropIntent(payload, 'desktop', payload.traceId);
            if (!intent) return false;

            setPendingDrop(true);

            try {
                // Step 2: POST to API (audit sink)
                const resp = await fetch('/api/os/desktop/shortcuts/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-trace-id': payload.traceId,
                    },
                    body: JSON.stringify({
                        capabilityId: intent.payload.capabilityId,
                        title: intent.payload.title,
                        icon: intent.payload.icon,
                        position,
                        traceId: payload.traceId,
                    }),
                });

                if (!resp.ok) {
                    console.error('[DesktopDropZone] API error:', resp.status);
                    setPendingDrop(false);
                    return false;
                }

                const data = await resp.json();

                // Step 3: Apply via store (which calls apply layer → localStorage)
                const shortcut: DesktopShortcut = {
                    id: data.shortcut.id,
                    capabilityId: data.shortcut.capabilityId,
                    title: data.shortcut.title,
                    icon: data.shortcut.icon,
                    createdAt: data.shortcut.createdAt,
                    createdBy: { uid: 'current' },
                    traceId: payload.traceId,
                    source: { from: 'dock', appId: payload.sourceAppId },
                    position,
                };

                addShortcut(shortcut);
                setPendingDrop(false);
                return true;

            } catch (error) {
                console.error('[DesktopDropZone] Error creating shortcut:', error);
                setPendingDrop(false);
                return false;
            }
        }

        // File drops → VFS locked
        if (payload.type === 'file') {
            setVfsLockedMsg('VFS is currently locked (Phase 15A). File drop not available.');
            setTimeout(() => setVfsLockedMsg(null), 3000);
            return true;
        }

        return false;
    }, [addShortcut]);

    // ─── Drop Zone Hook ────────────────────────────────────────
    const { dropRef, isOver, canDrop, handlers } = useDropZone({
        zoneId: 'desktop',
        accepts: ['capability', 'file'],
        onDrop: (payload, position) => {
            handleDrop(payload, position);
            return true; // Accept immediately, async flow handles the rest
        },
    });

    // ─── Remove Shortcut (Intent-Bound) ────────────────────────
    const handleRemoveShortcut = useCallback(async (shortcutId: string) => {
        const traceId = `sc-rm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        try {
            const resp = await fetch('/api/os/desktop/shortcuts/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-trace-id': traceId,
                },
                body: JSON.stringify({ shortcutId, traceId }),
            });

            if (resp.ok) {
                removeShortcut(shortcutId);
            }
        } catch (error) {
            console.error('[DesktopDropZone] Error removing shortcut:', error);
        }
    }, [removeShortcut]);

    // ─── Render ────────────────────────────────────────────────
    return (
        <div
            ref={dropRef}
            {...handlers}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                outline: isOver && canDrop ? '2px dashed rgba(0,122,255,0.5)' : 'none',
                backgroundColor: isOver && canDrop ? 'rgba(0,122,255,0.05)' : 'transparent',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
            }}
        >
            {/* Desktop Shortcuts */}
            {shortcuts.map(sc => (
                <div
                    key={sc.id}
                    onDoubleClick={() => onOpenCapability(sc.capabilityId)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveShortcut(sc.id);
                    }}
                    title={`${sc.title}\nRight-click to remove`}
                    style={{
                        position: 'absolute',
                        left: sc.position?.x ?? 20,
                        top: sc.position?.y ?? 20,
                        width: 72,
                        height: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        borderRadius: 8,
                        transition: 'background 0.15s ease',
                        userSelect: 'none',
                    }}
                >
                    <span style={{ fontSize: 32 }}>{sc.icon}</span>
                    <span style={{
                        fontSize: 11,
                        color: 'var(--nx-text-inverse)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        maxWidth: 68,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {sc.title}
                    </span>
                </div>
            ))}

            {/* VFS Locked Message */}
            {vfsLockedMsg && (
                <div style={{
                    position: 'fixed',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255,59,48,0.9)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease',
                }}>
                    🔒 {vfsLockedMsg}
                </div>
            )}

            {/* Pending Drop Indicator */}
            {pendingDrop && (
                <div style={{
                    position: 'fixed',
                    bottom: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,122,255,0.9)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    zIndex: 1000,
                }}>
                    ⏳ Creating shortcut...
                </div>
            )}
        </div>
    );
}
