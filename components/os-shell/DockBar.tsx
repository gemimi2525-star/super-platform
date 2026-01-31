/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Dock Bar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style dock with app launchers and minimized windows.
 * 
 * @module components/os-shell/DockBar
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { tokens } from './tokens';
import {
    useDockCapabilities,
    useMinimizedWindows,
    useOpenCapability,
    useSystemState,
    useWindowControls,
    useCapabilityInfo,
    type Window,
    type CapabilityId,
} from '@/governance/synapse';

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
                    width: tokens.dockItemSize,
                    height: tokens.dockItemSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 28,
                    transition: 'all 0.15s ease',
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
                        background: 'rgba(255,255,255,0.9)',
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
                width: tokens.dockItemSize,
                height: tokens.dockItemSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 20,
                transition: 'all 0.15s ease',
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
    const openCapability = useOpenCapability();
    const state = useSystemState();

    // Check if capability has open window
    const hasOpenWindow = (capabilityId: CapabilityId): boolean => {
        return Object.values(state.windows).some(
            w => w.capabilityId === capabilityId
        );
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                padding: `${tokens.dockPadding}px ${tokens.dockPadding + 4}px`,
                background: tokens.dockBackground,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: tokens.dockRadius,
                border: `1px solid ${tokens.dockBorder}`,
                zIndex: 9999,
            }}
        >
            {/* Capability Launchers */}
            {dockCapabilities.map(cap => (
                <DockItem
                    key={cap.id}
                    icon={cap.icon}
                    title={cap.title}
                    onClick={() => openCapability(cap.id)}
                    isRunning={hasOpenWindow(cap.id)}
                />
            ))}

            {/* Separator if there are minimized windows */}
            {minimizedWindows.length > 0 && (
                <div
                    style={{
                        width: 1,
                        height: 40,
                        background: 'rgba(255,255,255,0.3)',
                        margin: '0 4px',
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
