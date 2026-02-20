/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Dock Bar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style dock with app launchers and minimized windows.
 * 
 * Phase 8: Updated to use NEXUS Design Tokens (CSS variables)
 * Phase 9.1: Use useSingleInstanceOpen for single-instance enforcement
 * 
 * @module components/os-shell/DockBar
 * @version 2.1.0 (Phase 9.1)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
import {
    useDockCapabilities,
    useMinimizedWindows,
    useSingleInstanceOpen,
    useSystemState,
    useWindowControls,
    useCapabilityInfo,
    type Window,
    type CapabilityId,
} from '@/governance/synapse';
import { useAuthStore } from '@/lib/stores/authStore';
import { HUB_TAB_MAP, HUB_SHORTCUT_CAPABILITIES } from './stateMigration'; // Phase 39: Hub-tab routing + dock canonicalization
// Phase 15B: Process Model
import { useProcessStore } from '@/coreos/process/process-store';
import type { ProcessState } from '@/coreos/process/types';

// ═══════════════════════════════════════════════════════════════════════════
// DOCK ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface DockItemProps {
    icon: string;
    title: string;
    onClick: () => void;
    isRunning?: boolean;
    processState?: ProcessState | null; // Phase 15B
}

function DockItem({ icon, title, onClick, isRunning, processState }: DockItemProps) {
    const [hover, setHover] = React.useState(false);

    // Phase 15B: Process state badge color
    const badgeColor = processState === 'BACKGROUND' ? '#007aff'
        : processState === 'SUSPENDED' ? '#ff9f0a'
            : 'var(--nx-text-inverse-muted)';
    const badgeTitle = processState === 'BACKGROUND' ? '◐ Background'
        : processState === 'SUSPENDED' ? '⏸ Suspended'
            : undefined;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    width: 'var(--nx-dock-item-size)',
                    height: 'var(--nx-dock-item-size)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hover
                        ? 'var(--nx-surface-dock-item-hover)'
                        : 'var(--nx-surface-dock-item)',
                    border: 'none',
                    borderRadius: 'var(--nx-radius-xl)',
                    cursor: 'pointer',
                    fontSize: 28,
                    transition: `all var(--nx-duration-fast) var(--nx-ease-out)`,
                    transform: hover ? 'translateY(-8px) scale(1.1)' : 'none',
                }}
                title={badgeTitle ? `${title} (${badgeTitle})` : title}
            >
                {icon}
            </button>

            {/* Running indicator — Phase 15B: state-aware color */}
            {isRunning && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: badgeColor,
                        transition: 'background 0.2s ease',
                    }}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MINIMIZED WINDOW ITEM
// ═══════════════════════════════════════════════════════════════════════════

function MinimizedWindowItem({ window }: { window: Window }) {
    const { restore } = useWindowControls(window.id);
    const { icon } = useCapabilityInfo(window.capabilityId);
    const [hover, setHover] = React.useState(false);

    return (
        <button
            onClick={restore}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: 'var(--nx-dock-item-size)',
                height: 'var(--nx-dock-item-size)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hover
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.25)',
                border: '1px solid var(--nx-border-inverse-strong)',
                borderRadius: 'var(--nx-radius-xl)',
                cursor: 'pointer',
                fontSize: 20,
                transition: `all var(--nx-duration-fast) var(--nx-ease-out)`,
                transform: hover ? 'translateY(-8px) scale(1.1)' : 'none',
            }}
            title={`Restore: ${window.title}`}
        >
            {icon}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK BAR
// ═══════════════════════════════════════════════════════════════════════════

export function DockBar() {
    const dockCapabilities = useDockCapabilities();
    const minimizedWindows = useMinimizedWindows();
    const openCapability = useSingleInstanceOpen(); // Phase 9.1: Single-instance aware
    const state = useSystemState();

    // Check if capability has open window
    const hasOpenWindow = (capabilityId: CapabilityId): boolean => {
        return Object.values(state.windows).some(
            w => w.capabilityId === capabilityId
        );
    };

    // Phase 26D: Security Matrix v1 - Filter Dock Items
    const firebaseUser = useAuthStore((s) => s.firebaseUser);
    const authLoading = useAuthStore((s) => s.loading);
    const currentUid = firebaseUser?.uid;
    const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    const isOwner = currentUid === SUPER_ADMIN_ID;
    const userRole = state.security?.role || 'user';

    // Phase 17X: Auth status for smooth dock rendering
    const authReady = !authLoading && (firebaseUser !== null || !authLoading);

    // Phase 17X: Determine icon state per capability
    type DockSlot = {
        cap: typeof dockCapabilities[0];
        state: 'visible' | 'placeholder' | 'denied';
    };

    const dockSlots: DockSlot[] = dockCapabilities
        .filter(cap => {
            // Phase 39E: Block capabilities with route/href="/system"
            if ((cap as any).route === '/system' || (cap as any).href === '/system') {
                return false;
            }
            // Phase 39D: exclude hub-tab shortcuts
            if (HUB_SHORTCUT_CAPABILITIES.has(cap.id)) {
                return false;
            }
            return true;
        })
        .map(cap => {
            // Auth-gated capabilities
            if (cap.id === 'ops.center') {
                if (!authReady) return { cap, state: 'placeholder' as const };
                return { cap, state: isOwner ? 'visible' as const : 'denied' as const };
            }
            if (cap.id === 'system.hub') {
                if (!authReady) return { cap, state: 'placeholder' as const };
                return { cap, state: (isOwner || userRole === 'admin') ? 'visible' as const : 'denied' as const };
            }
            return { cap, state: 'visible' as const };
        });

    // Phase 17X: Track denied fade-out (remove after animation)
    const [fadingOut, setFadingOut] = React.useState<Set<string>>(new Set());
    const prevSlotsRef = React.useRef<Map<string, string>>(new Map());

    React.useEffect(() => {
        const newFading = new Set<string>();
        for (const slot of dockSlots) {
            const prevState = prevSlotsRef.current.get(slot.cap.id);
            if (prevState === 'placeholder' && slot.state === 'denied') {
                newFading.add(slot.cap.id);
            }
        }
        if (newFading.size > 0) {
            setFadingOut(newFading);
            const timer = setTimeout(() => setFadingOut(new Set()), 300);
            return () => clearTimeout(timer);
        }
        // Update previous states
        const map = new Map<string, string>();
        for (const slot of dockSlots) map.set(slot.cap.id, slot.state);
        prevSlotsRef.current = map;
    }, [dockSlots.map(s => `${s.cap.id}:${s.state}`).join(',')]);

    // Phase 14.1: Emit intent event when opening app
    const handleAppOpen = async (capabilityId: CapabilityId, title: string) => {
        // Phase 39: Hub-tab routing
        const hubTab = HUB_TAB_MAP[capabilityId];
        if (hubTab) {
            openCapability('system.hub' as CapabilityId);
            return;
        }

        const traceId = crypto.randomUUID();
        fetch('/api/platform/audit-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': traceId,
            },
            body: JSON.stringify({
                action: 'os.app.open',
                target: { appId: capabilityId },
                meta: { appTitle: title },
                timestamp: new Date().toISOString(),
            }),
        }).catch(err => console.warn('[Intent] Failed to emit os.app.open:', err));

        openCapability(capabilityId);
    };

    // Filter: remove denied (unless fading)
    const renderSlots = dockSlots.filter(
        slot => slot.state !== 'denied' || fadingOut.has(slot.cap.id)
    );

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 'var(--nx-space-2)',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'var(--nx-dock-gap)',
                padding: 'var(--nx-dock-padding) calc(var(--nx-dock-padding) + 4px)',
                background: 'var(--nx-surface-dock)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: 'var(--nx-dock-radius)',
                border: '1px solid var(--nx-border-inverse)',
                boxShadow: 'var(--nx-shadow-dock)',
                zIndex: 'var(--nx-z-dock)',
            }}
        >
            {/* Capability Launchers */}
            {renderSlots.map(slot => {
                if (slot.state === 'placeholder') {
                    return (
                        <DockIconPlaceholder
                            key={slot.cap.id}
                            icon={slot.cap.icon}
                            title={slot.cap.title}
                        />
                    );
                }
                if (slot.state === 'denied' && fadingOut.has(slot.cap.id)) {
                    return (
                        <div key={slot.cap.id} style={{
                            opacity: 0,
                            transition: 'opacity 150ms ease-out',
                            pointerEvents: 'none',
                        }}>
                            <DockIconPlaceholder icon={slot.cap.icon} title={slot.cap.title} />
                        </div>
                    );
                }
                return (
                    <DockItem
                        key={slot.cap.id}
                        icon={slot.cap.icon}
                        title={slot.cap.title}
                        onClick={() => handleAppOpen(slot.cap.id, slot.cap.title)}
                        isRunning={hasOpenWindow(slot.cap.id)}
                        processState={useProcessStore.getState().getActiveByAppId(slot.cap.id)?.state ?? null}
                    />
                );
            })}

            {/* Separator if there are minimized windows */}
            {minimizedWindows.length > 0 && (
                <div
                    style={{
                        width: 1,
                        height: 40,
                        background: 'var(--nx-border-inverse-strong)',
                        margin: '0 var(--nx-space-1)',
                    }}
                />
            )}

            {/* Minimized Windows */}
            {minimizedWindows.map(window => (
                <MinimizedWindowItem key={window.id} window={window} />
            ))}

            {/* Phase 17X.2: Removed warp animations — dock renders crisp */}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 17X: DOCK ICON PLACEHOLDER (ghost/skeleton during auth loading)
// ═══════════════════════════════════════════════════════════════════════════

function DockIconPlaceholder({ icon, title }: { icon: string; title: string }) {
    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    width: 'var(--nx-dock-item-size)',
                    height: 'var(--nx-dock-item-size)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--nx-surface-dock-item)',
                    border: 'none',
                    borderRadius: 'var(--nx-radius-xl)',
                    fontSize: 28,
                    opacity: 0.5,
                    cursor: 'default',
                }}
                title={`${title} — Checking permissions…`}
            >
                {icon}
            </div>
        </div>
    );
}

