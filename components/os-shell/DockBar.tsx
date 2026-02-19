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

// ═══════════════════════════════════════════════════════════════════════════
// DOCK ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface DockItemProps {
    icon: string;
    title: string;
    onClick: () => void;
    isRunning?: boolean;
}

function DockItem({ icon, title, onClick, isRunning }: DockItemProps) {
    const [hover, setHover] = React.useState(false);

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
                title={title}
            >
                {icon}
            </button>

            {/* Running indicator */}
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
                        background: 'var(--nx-text-inverse-muted)',
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
    // Monitor Hub (ops.center) is OWNER ONLY.
    // System Hub (system.hub) is OWNER + ADMIN ONLY.
    // Brain Assistant (brain.assist) is Open to All.
    const firebaseUser = useAuthStore((s) => s.firebaseUser);
    const currentUid = firebaseUser?.uid;
    const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    const isOwner = currentUid === SUPER_ADMIN_ID;
    // Phase 27A: For system.hub, admin check would need role from state
    const userRole = state.security?.role || 'user';

    const visibleCapabilities = dockCapabilities.filter(cap => {
        // Phase 39D: exclude hub-tab shortcuts — they are accessible via System Hub tabs only
        if (HUB_SHORTCUT_CAPABILITIES.has(cap.id)) {
            return false;
        }
        if (cap.id === 'ops.center') {
            // Only show Monitor Hub if user is owner
            return isOwner;
        }
        if (cap.id === 'system.hub') {
            // System Hub visible for owner and admin
            return isOwner || userRole === 'admin';
        }
        return true;
    });

    // Phase 14.1: Emit intent event when opening app
    const handleAppOpen = async (capabilityId: CapabilityId, title: string) => {
        // Phase 39: Hub-tab routing — redirect overlapping capabilities to System Hub
        const hubTab = HUB_TAB_MAP[capabilityId];
        if (hubTab) {
            // Open/focus System Hub instead of spawning standalone app
            openCapability('system.hub' as CapabilityId);
            return;
        }

        // Phase 14.2: Generate traceId for this interaction
        const traceId = crypto.randomUUID();

        // Emit intent event (fire-and-forget, non-blocking)
        fetch('/api/platform/audit-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': traceId, // Phase 14.2: Trace propagation
            },
            body: JSON.stringify({
                action: 'os.app.open',
                target: { appId: capabilityId },
                meta: { appTitle: title },
                timestamp: new Date().toISOString(),
            }),
        }).catch(err => console.warn('[Intent] Failed to emit os.app.open:', err));

        // Open app (original logic)
        openCapability(capabilityId);
    };

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
            {visibleCapabilities.map(cap => (
                <DockItem
                    key={cap.id}
                    icon={cap.icon}
                    title={cap.title}
                    onClick={() => handleAppOpen(cap.id, cap.title)}
                    isRunning={hasOpenWindow(cap.id)}
                />
            ))}

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
        </div>
    );
}
