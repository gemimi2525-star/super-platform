/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Explorer Main List (Applications Section)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 9.1: Added manifest-based Applications section.
 * Uses getFinderApps() as SSOT for app visibility.
 * 
 * @module components/os-shell/apps/explorer/MainList
 * @version 2.0.0 (Phase 9.1)
 */

import React, { useState, useEffect, useMemo } from 'react';
import '@/styles/nexus-tokens.css';
import { oms, CoreObject } from '@/coreos/oms';
import { getFinderApps, type ShellAppManifest } from '../manifest';
import { useSecurityContext } from '@/governance/synapse';
import { type UserRole } from '../manifest';

interface MainListProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    onLaunchApp: (appId: string) => void;
}

export function MainList({ currentPath, onNavigate, onLaunchApp }: MainListProps) {
    const [items, setItems] = useState<CoreObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Phase 9.1: Get apps from manifest SSOT
    const { role } = useSecurityContext();
    const userRole = (role || 'user') as UserRole;
    const finderApps = useMemo(() => getFinderApps(userRole), [userRole]);

    useEffect(() => {
        // Special handling for Applications path - use manifest SSOT
        if (currentPath === '/Applications' || currentPath === '/apps') {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        oms.list(currentPath)
            .then(children => {
                setItems(children);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load items');
                setLoading(false);
            });
    }, [currentPath]);

    const handleDoubleClick = (item: CoreObject) => {
        if (item.type === 'collection') {
            onNavigate(item.path);
        } else if (item.type === 'app') {
            if (item.meta?.appId) {
                onLaunchApp(item.meta.appId);
            }
        }
    };

    const handleAppDoubleClick = (app: ShellAppManifest) => {
        onLaunchApp(app.appId);
    };

    // Render Applications from manifest SSOT
    if (currentPath === '/Applications' || currentPath === '/apps') {
        return (
            <div style={{
                flex: 1,
                padding: 'var(--nx-space-5)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gridAutoRows: 'min-content',
                gap: 'var(--nx-space-4)',
                alignContent: 'start',
                background: 'var(--nx-surface-window)',
            }}>
                {finderApps.map(app => (
                    <div
                        key={app.appId}
                        onDoubleClick={() => handleAppDoubleClick(app)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--nx-space-2)',
                            padding: 'var(--nx-space-3)',
                            borderRadius: 'var(--nx-radius-base)',
                            cursor: 'default',
                            transition: 'background var(--nx-duration-fast) var(--nx-ease-out)',
                            opacity: app.disabled ? 0.5 : 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--nx-surface-panel)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{
                            width: 48,
                            height: 48,
                            background: 'var(--nx-surface-panel)',
                            borderRadius: 'var(--nx-radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            boxShadow: 'var(--nx-shadow-sm)',
                        }}>
                            {app.icon}
                        </div>
                        <span style={{
                            fontSize: 'var(--nx-text-caption)',
                            textAlign: 'center',
                            wordBreak: 'break-word',
                            color: 'var(--nx-text-primary)',
                            fontWeight: 'var(--nx-weight-medium)',
                        }}>
                            {app.name}
                        </span>
                        {app.disabled && (
                            <span style={{
                                fontSize: 'var(--nx-text-micro)',
                                color: 'var(--nx-warning)'
                            }}>
                                {app.disabledReason || 'Unavailable'}
                            </span>
                        )}
                    </div>
                ))}

                {finderApps.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        color: 'var(--nx-text-tertiary)',
                        marginTop: 'var(--nx-space-10)',
                    }}>
                        No applications available
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                padding: 'var(--nx-space-5)',
                color: 'var(--nx-text-secondary)',
                fontFamily: 'var(--nx-font-system)',
            }}>
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: 'var(--nx-space-5)',
                color: 'var(--nx-danger)',
                fontFamily: 'var(--nx-font-system)',
            }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            padding: 'var(--nx-space-5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gridAutoRows: 'min-content',
            gap: 'var(--nx-space-4)',
            alignContent: 'start',
            background: 'var(--nx-surface-window)',
        }}>
            {items.map(item => (
                <div
                    key={item.id}
                    onDoubleClick={() => handleDoubleClick(item)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--nx-space-2)',
                        padding: 'var(--nx-space-3)',
                        borderRadius: 'var(--nx-radius-base)',
                        cursor: 'default',
                        transition: 'background var(--nx-duration-fast) var(--nx-ease-out)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--nx-surface-panel)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{
                        width: 48, height: 48,
                        background: item.type === 'app' ? 'var(--nx-text-primary)' : 'var(--nx-accent)',
                        borderRadius: 'var(--nx-radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 24,
                        boxShadow: 'var(--nx-shadow-sm)',
                    }}>
                        {item.type === 'app' ? '🚀' : (item.type === 'collection' ? '📁' : '📄')}
                    </div>
                    <span style={{
                        fontSize: 'var(--nx-text-caption)',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        color: 'var(--nx-text-primary)',
                        fontWeight: 'var(--nx-weight-medium)',
                    }}>
                        {item.name}
                    </span>
                    {item.meta?.degraded && (
                        <span style={{
                            fontSize: 'var(--nx-text-micro)',
                            color: 'var(--nx-warning)'
                        }}>
                            ⚠️ Offline
                        </span>
                    )}
                </div>
            ))}

            {items.length === 0 && (
                <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    color: 'var(--nx-text-tertiary)',
                    marginTop: 'var(--nx-space-10)',
                }}>
                    Folder is empty
                </div>
            )}
        </div>
    );
}
