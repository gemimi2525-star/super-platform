/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Explorer Main List (Phase 15A M3 → Phase 16B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dual-mode file list:
 * - VFS mode: when path starts with user://, system://, workspace://
 * - OMS mode: legacy path-based navigation
 * - Applications mode: manifest-based app grid
 * 
 * Phase 16B: Migrated to AppVFSAdapter via props.
 * 
 * @module components/os-shell/apps/explorer/MainList
 * @version 3.1.0 (Phase 16B)
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '@/styles/nexus-tokens.css';
import { oms, CoreObject } from '@/coreos/oms';
import { getFinderApps, type ShellAppManifest } from '../manifest';
import { useSecurityContext } from '@/governance/synapse';
import { type UserRole } from '../manifest';
import { CoreEmptyState } from '@/core-ui';
import type { AppVFSAdapter } from '@/coreos/vfs/app-adapter';
import type { VFSMetadata } from '@/lib/vfs/types';

interface MainListProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    onLaunchApp: (appId: string) => void;
    onError?: (msg: string) => void;
    onReadFile?: (meta: VFSMetadata, content: string) => void;
    /** Phase 16B: VFS adapter for permission-enforced access */
    vfsAdapter: AppVFSAdapter;
}

// Helper: check if path is a VFS path
function isVFSPath(path: string): boolean {
    return /^(user|system|workspace):\/\//.test(path);
}

// Helper: format file size
function formatSize(bytes: number): string {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper: format timestamp
function formatDate(ts: number): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

export function MainList({ currentPath, onNavigate, onLaunchApp, onError, onReadFile, vfsAdapter }: MainListProps) {
    // OMS state
    const [omsItems, setOmsItems] = useState<CoreObject[]>([]);
    // VFS state
    const [vfsItems, setVfsItems] = useState<VFSMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Manifest apps
    const { role } = useSecurityContext();
    const userRole = (role || 'user') as UserRole;
    const finderApps = useMemo(() => getFinderApps(userRole), [userRole]);

    const vfsMode = isVFSPath(currentPath);

    // Load data when path changes
    useEffect(() => {
        // Applications path — use manifest SSOT
        if (currentPath === '/Applications' || currentPath === '/apps') {
            setOmsItems([]);
            setVfsItems([]);
            setLoading(false);
            setError('');
            return;
        }

        setLoading(true);
        setError('');

        if (vfsMode) {
            // VFS Mode
            vfsAdapter.list(currentPath)
                .then(items => {
                    // Sort: folders first, then by name
                    const sorted = items.sort((a, b) => {
                        if (a.type !== b.type) {
                            return (a.type === 'folder' || a.type === 'directory') ? -1 : 1;
                        }
                        return a.name.localeCompare(b.name);
                    });
                    setVfsItems(sorted);
                    setOmsItems([]);
                    setLoading(false);
                })
                .catch(err => {
                    const msg = err?.message || 'Failed to list files';
                    setError(msg);
                    setVfsItems([]);
                    setLoading(false);
                    onError?.(msg);
                });
        } else {
            // OMS Mode (legacy)
            oms.list(currentPath)
                .then(children => {
                    setOmsItems(children);
                    setVfsItems([]);
                    setLoading(false);
                })
                .catch(err => {
                    setError('Failed to load items');
                    setOmsItems([]);
                    setLoading(false);
                });
        }
    }, [currentPath, vfsMode]);

    // VFS: double-click handler
    const handleVFSDoubleClick = useCallback(async (item: VFSMetadata) => {
        if (item.type === 'folder' || item.type === 'directory') {
            onNavigate(item.path);
        } else if (item.type === 'file') {
            // Read the file
            try {
                const data = await vfsAdapter.read(item.path);
                const text = new TextDecoder().decode(data);
                onReadFile?.(item, text);
            } catch (err: any) {
                onError?.(err?.message || 'Failed to read file');
            }
        }
    }, [onNavigate, onReadFile, onError]);

    // OMS: double-click handler
    const handleOmsDoubleClick = (item: CoreObject) => {
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

    // ─── Applications View ──────────────────────────────────────────────────
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
                            width: 48, height: 48,
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
                            <span style={{ fontSize: 'var(--nx-text-micro)', color: 'var(--nx-warning)' }}>
                                {app.disabledReason || 'Unavailable'}
                            </span>
                        )}
                    </div>
                ))}

                {finderApps.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: 'var(--nx-space-10)' }}>
                        <CoreEmptyState
                            icon="📦"
                            title="No Applications Available"
                            subtitle="Applications will appear here based on your role and permissions"
                            size="md"
                        />
                    </div>
                )}
            </div>
        );
    }

    // ─── Loading ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                flex: 1,
                padding: 'var(--nx-space-5)',
                color: 'var(--nx-text-secondary)',
                fontFamily: 'var(--nx-font-system)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span style={{ opacity: 0.6 }}>Loading...</span>
            </div>
        );
    }

    // ─── Error ───────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div style={{
                flex: 1,
                padding: 'var(--nx-space-5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--nx-space-3)',
            }}>
                <span style={{ fontSize: 32 }}>⚠️</span>
                <span style={{
                    color: 'var(--nx-danger, #FF3B30)',
                    fontFamily: 'var(--nx-font-system)',
                    fontSize: 'var(--nx-text-body)',
                    textAlign: 'center',
                    maxWidth: 400,
                }}>
                    {error}
                </span>
            </div>
        );
    }

    // ─── VFS List View ──────────────────────────────────────────────────────
    if (vfsMode) {
        return (
            <div style={{
                flex: 1,
                background: 'var(--nx-surface-window)',
                overflow: 'auto',
            }}>
                {/* Column Headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 140px',
                    padding: '6px 16px',
                    borderBottom: '1px solid var(--nx-border-divider, rgba(0,0,0,0.08))',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--nx-text-tertiary, #888)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    userSelect: 'none',
                }}>
                    <span>Name</span>
                    <span style={{ textAlign: 'right' }}>Size</span>
                    <span style={{ textAlign: 'right' }}>Modified</span>
                </div>

                {/* File/Folder Rows */}
                {vfsItems.map(item => (
                    <div
                        key={item.id}
                        onDoubleClick={() => handleVFSDoubleClick(item)}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 80px 140px',
                            padding: '7px 16px',
                            borderBottom: '1px solid var(--nx-border-subtle, rgba(0,0,0,0.04))',
                            cursor: 'default',
                            fontSize: 13,
                            transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--nx-accent-muted, rgba(0,122,255,0.08))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>
                                {(item.type === 'folder' || item.type === 'directory') ? '📁' : '📄'}
                            </span>
                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'var(--nx-text-primary)',
                            }}>
                                {item.name}
                            </span>
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--nx-text-secondary)', fontSize: 12 }}>
                            {(item.type === 'folder' || item.type === 'directory') ? '—' : formatSize(item.size)}
                        </span>
                        <span style={{ textAlign: 'right', color: 'var(--nx-text-secondary)', fontSize: 12 }}>
                            {formatDate(item.updatedAt)}
                        </span>
                    </div>
                ))}

                {/* Empty State */}
                {vfsItems.length === 0 && (
                    <div style={{ padding: 'var(--nx-space-10)', textAlign: 'center' }}>
                        <CoreEmptyState
                            icon="📂"
                            title="Empty Folder"
                            subtitle="Use the toolbar to create files and folders"
                            size="md"
                        />
                    </div>
                )}
            </div>
        );
    }

    // ─── OMS Grid View (Legacy) ─────────────────────────────────────────────
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
            {omsItems.map(item => (
                <div
                    key={item.id}
                    onDoubleClick={() => handleOmsDoubleClick(item)}
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
                        <span style={{ fontSize: 'var(--nx-text-micro)', color: 'var(--nx-warning)' }}>
                            ⚠️ Offline
                        </span>
                    )}
                </div>
            ))}

            {omsItems.length === 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--nx-space-10)' }}>
                    <CoreEmptyState
                        icon="📂"
                        title="Empty Folder"
                        subtitle="This folder doesn't contain any items yet"
                        size="md"
                    />
                </div>
            )}
        </div>
    );
}
