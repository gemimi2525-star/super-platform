'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OfflineBanner — Phase 36.5
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Global banner showing offline/degraded/reconnected status.
 * Integrates with ConnectivityMonitor + SyncQueue.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getConnectivityMonitor, type ConnectivityStatus } from '../connectivity';
import { getSyncQueue, isOutboxLockedByOther, type QueueStatus } from './syncQueue';
import { getConflictStore } from '../vfs/maintenance/conflictStore';

type BannerState = 'hidden' | 'offline' | 'reconnecting' | 'syncing' | 'conflict' | 'lockedOther';

export function OfflineBanner() {
    const [bannerState, setBannerState] = useState<BannerState>('hidden');
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        pending: 0, processing: 0, completed: 0, failed: 0, dead: 0, total: 0,
    });
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasOffline = useRef(false);

    useEffect(() => {
        const monitor = getConnectivityMonitor();
        const queue = getSyncQueue();

        // Subscribe to connectivity
        const unsubConn = monitor.subscribe((state) => {
            const status: ConnectivityStatus = state.status;

            if (status === 'OFFLINE') {
                wasOffline.current = true;
                setBannerState('offline');
                if (hideTimer.current) clearTimeout(hideTimer.current);
            } else if (status === 'DEGRADED') {
                wasOffline.current = true;
                setBannerState('offline');
            } else if (status === 'ONLINE' && wasOffline.current) {
                // Just came back online
                wasOffline.current = false;
                const qs = queue.getStatus();
                if (qs.pending > 0) {
                    // 15C.2B: Check multi-tab lock
                    if (isOutboxLockedByOther()) {
                        setBannerState('lockedOther');
                        hideTimer.current = setTimeout(() => setBannerState('hidden'), 5000);
                    } else {
                        setBannerState('syncing');
                        queue.processQueue().then((result) => {
                            if (result.locked) {
                                setBannerState('lockedOther');
                                hideTimer.current = setTimeout(() => setBannerState('hidden'), 5000);
                            } else {
                                setBannerState('hidden');
                            }
                        });
                    }
                } else {
                    // Show "back online" briefly
                    setBannerState('reconnecting');
                    hideTimer.current = setTimeout(() => {
                        // Phase 37B: Check for conflicts before hiding
                        const conflicts = getConflictStore().getOpenCount();
                        if (conflicts > 0) {
                            setBannerState('conflict');
                        } else {
                            setBannerState('hidden');
                        }
                    }, 3000);
                }
            }
        });

        // Subscribe to queue changes
        const unsubQueue = queue.subscribe((qs) => {
            setQueueStatus(qs);
            if (qs.pending === 0 && qs.processing === 0 && bannerState === 'syncing') {
                hideTimer.current = setTimeout(() => {
                    setBannerState('hidden');
                }, 2000);
            }
        });

        // Check initial state
        const initialState = monitor.getState();
        if (initialState.status === 'OFFLINE' || initialState.status === 'DEGRADED') {
            wasOffline.current = true;
            setBannerState('offline');
        }

        return () => {
            unsubConn();
            unsubQueue();
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
        // We only want this to run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (bannerState === 'hidden') return null;

    const config = BANNER_CONFIG[bannerState];

    return (
        <div style={{ ...styles.banner, ...config.style }}>
            <span style={styles.icon}>{config.icon}</span>
            <span style={styles.text}>
                {config.text}
                {bannerState === 'syncing' && queueStatus.pending > 0 && (
                    <span style={styles.count}> ({queueStatus.pending} pending)</span>
                )}
            </span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const BANNER_CONFIG: Record<Exclude<BannerState, 'hidden'>, {
    icon: string;
    text: string;
    style: React.CSSProperties;
}> = {
    offline: {
        icon: '⚡',
        text: 'OFFLINE MODE — Some features unavailable. Queued actions will sync when reconnected.',
        style: {
            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.08))',
            borderColor: 'rgba(234, 179, 8, 0.3)',
            color: '#fbbf24',
        },
    },
    reconnecting: {
        icon: '✅',
        text: 'Back Online — Connection restored.',
        style: {
            background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08))',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
        },
    },
    syncing: {
        icon: '🔄',
        text: 'Back Online — Syncing queued actions...',
        style: {
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
        },
    },
    conflict: {
        icon: '⚠️',
        text: 'Sync needs attention: naming conflict detected — open Ops → VFS to resolve.',
        style: {
            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.08))',
            borderColor: 'rgba(234, 179, 8, 0.3)',
            color: '#fbbf24',
        },
    },
    lockedOther: {
        icon: '🔒',
        text: 'Syncing in another tab — this tab will wait.',
        style: {
            background: 'linear-gradient(90deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.08))',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            color: '#94a3b8',
        },
    },
};

const styles: Record<string, React.CSSProperties> = {
    banner: {
        position: 'fixed',
        top: 28, // Below macOS-style menu bar
        left: 0,
        right: 0,
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 16px',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        borderBottom: '1px solid',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
    },
    icon: {
        fontSize: 14,
    },
    text: {
        letterSpacing: '-0.2px',
    },
    count: {
        fontFamily: '"SF Mono", Monaco, monospace',
        fontSize: 11,
        opacity: 0.8,
    },
};
