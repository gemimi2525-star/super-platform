/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Files / Data Explorer App (Phase 15A M3 → Phase 16B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style Finder with VFS integration:
 * - Sidebar: VFS scheme navigation + OMS tree
 * - Main: VFS file list / OMS grid / Applications
 * - Toolbar: New Folder, New File, Refresh
 * - Dialogs: mkdir, write text, file viewer
 * - Toast: error/success notifications
 * 
 * Phase 16B: Migrated to AppVFSAdapter (Standard VFS Consumer Contract).
 * All VFS calls now go through the adapter for permission enforcement
 * and consistent audit logging.
 * 
 * @module components/os-shell/apps/explorer/ExplorerApp
 * @version 3.1.0 (Phase 16B)
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import '@/styles/nexus-tokens.css';
import { Sidebar } from './Sidebar';
import { MainList } from './MainList';
import { useOpenCapability } from '@/governance/synapse';
import { useVFSAdapter } from '@/coreos/vfs/useVFSAdapter';
import type { VFSMetadata } from '@/lib/vfs/types';
import type { AppProps } from '../registry';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function isVFSPath(path: string): boolean {
    return /^(user|system|workspace):\/\//.test(path);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

type ToastType = 'success' | 'error';

interface ToastState {
    show: boolean;
    type: ToastType;
    message: string;
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
    if (!toast.show) return null;

    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                borderRadius: 8,
                background: toast.type === 'error'
                    ? 'var(--nx-danger, #FF3B30)'
                    : 'var(--nx-success, #34C759)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                zIndex: 100,
                maxWidth: '80%',
                textAlign: 'center',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIALOG OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--nx-surface-panel, #fff)',
                    borderRadius: 12,
                    padding: 20,
                    minWidth: 320,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPLORER APP
// ═══════════════════════════════════════════════════════════════════════════

type DialogMode = 'none' | 'newFolder' | 'newFile' | 'viewFile';

export function ExplorerApp({ capabilityId }: Partial<AppProps>) {
    // Phase 16B: Use AppVFSAdapter instead of direct vfsService
    const adapter = useVFSAdapter(capabilityId ?? 'core.finder');
    const [currentPath, setCurrentPath] = useState('user://');
    const [refreshKey, setRefreshKey] = useState(0);
    const [dialog, setDialog] = useState<DialogMode>('none');
    const [dialogInput, setDialogInput] = useState('');
    const [dialogContent, setDialogContent] = useState('');
    const [viewingFile, setViewingFile] = useState<{ meta: VFSMetadata; content: string } | null>(null);
    const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' });

    const openCapability = useOpenCapability();
    const toastTimer = useRef<NodeJS.Timeout | null>(null);

    const vfsMode = isVFSPath(currentPath);

    // ─── Toast ──────────────────────────────────────────────────────────────
    const showToast = useCallback((type: ToastType, message: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ show: true, type, message });
        toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
    }, []);

    const dismissToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);

    // ─── Refresh ────────────────────────────────────────────────────────────
    const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

    // ─── New Folder ─────────────────────────────────────────────────────────
    const handleNewFolder = useCallback(() => {
        setDialogInput('');
        setDialog('newFolder');
    }, []);

    const submitNewFolder = useCallback(async () => {
        const name = dialogInput.trim();
        if (!name) return;
        setDialog('none');
        try {
            const folderPath = currentPath.endsWith('/') ? `${currentPath}${name}` : `${currentPath}/${name}`;
            await adapter.mkdir(folderPath);
            showToast('success', `Created folder "${name}"`);
            handleRefresh();
        } catch (err: any) {
            const msg = err?.code === 'VFS_DUPLICATE_NAME'
                ? `ชื่อซ้ำในโฟลเดอร์เดียวกัน (Strict OS Mode)`
                : err?.message || 'Failed to create folder';
            showToast('error', msg);
        }
    }, [adapter, dialogInput, currentPath, showToast, handleRefresh]);

    // ─── New File ───────────────────────────────────────────────────────────
    const handleNewFile = useCallback(() => {
        setDialogInput('');
        setDialogContent('');
        setDialog('newFile');
    }, []);

    const submitNewFile = useCallback(async () => {
        const name = dialogInput.trim();
        if (!name) return;
        setDialog('none');
        try {
            const filePath = currentPath.endsWith('/') ? `${currentPath}${name}` : `${currentPath}/${name}`;
            await adapter.write(filePath, dialogContent || '');
            showToast('success', `Created file "${name}"`);
            handleRefresh();
        } catch (err: any) {
            const msg = err?.code === 'VFS_DUPLICATE_NAME'
                ? `ชื่อซ้ำในโฟลเดอร์เดียวกัน (Strict OS Mode)`
                : err?.message || 'Failed to create file';
            showToast('error', msg);
        }
    }, [adapter, dialogInput, dialogContent, currentPath, showToast, handleRefresh]);

    // ─── File Viewer ────────────────────────────────────────────────────────
    const handleReadFile = useCallback((meta: VFSMetadata, content: string) => {
        setViewingFile({ meta, content });
        setDialog('viewFile');
    }, []);

    // ─── Error Handler ──────────────────────────────────────────────────────
    const handleError = useCallback((msg: string) => {
        showToast('error', msg);
    }, [showToast]);

    // ─── Launch App ─────────────────────────────────────────────────────────
    const handleLaunch = (appId: string) => openCapability(appId as any);

    // ─── Toolbar Button Style ───────────────────────────────────────────────
    const toolbarBtnStyle: React.CSSProperties = {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 15,
        padding: '4px 8px',
        borderRadius: 6,
        color: 'var(--nx-text-secondary)',
        transition: 'background 0.15s ease',
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nx-surface-panel)',
            color: 'var(--nx-text-primary)',
            fontFamily: 'var(--nx-font-system)',
            position: 'relative',
        }}>
            {/* ─── Toolbar ────────────────────────────────────────────── */}
            <div style={{
                height: 40,
                borderBottom: '1px solid var(--nx-border-divider)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--nx-space-4)',
                gap: 'var(--nx-space-2)',
                background: 'var(--nx-surface-toolbar)',
                backdropFilter: 'blur(10px)',
            }}>
                {/* Home */}
                <button onClick={() => setCurrentPath('user://')} style={toolbarBtnStyle} title="Home">
                    🏠
                </button>

                {/* Path Display */}
                <div style={{
                    fontSize: 13,
                    color: 'var(--nx-text-secondary)',
                    background: 'var(--nx-surface-input)',
                    padding: 'var(--nx-space-1) var(--nx-space-3)',
                    borderRadius: 'var(--nx-radius-sm)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {currentPath}
                </div>

                {/* VFS Actions (only in VFS mode) */}
                {vfsMode && (
                    <>
                        <button onClick={handleNewFolder} style={toolbarBtnStyle} title="New Folder">
                            📁+
                        </button>
                        <button onClick={handleNewFile} style={toolbarBtnStyle} title="New File">
                            📄+
                        </button>
                    </>
                )}

                {/* Refresh */}
                <button onClick={handleRefresh} style={toolbarBtnStyle} title="Refresh">
                    🔄
                </button>
            </div>

            {/* ─── Body (Sidebar + MainList) ──────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar currentPath={currentPath} onNavigate={setCurrentPath} />
                <MainList
                    key={refreshKey}
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                    onLaunchApp={handleLaunch}
                    onError={handleError}
                    onReadFile={handleReadFile}
                    vfsAdapter={adapter}
                />
            </div>

            {/* ─── Toast ──────────────────────────────────────────────── */}
            <Toast toast={toast} onDismiss={dismissToast} />

            {/* ─── Dialogs ────────────────────────────────────────────── */}
            {dialog === 'newFolder' && (
                <DialogOverlay onClose={() => setDialog('none')}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>📁 New Folder</h3>
                    <input
                        autoFocus
                        value={dialogInput}
                        onChange={e => setDialogInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitNewFolder()}
                        placeholder="Folder name..."
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--nx-border-divider)',
                            borderRadius: 8,
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        <button onClick={() => setDialog('none')} style={{ ...toolbarBtnStyle, background: 'var(--nx-surface-input)' }}>Cancel</button>
                        <button onClick={submitNewFolder} style={{ ...toolbarBtnStyle, background: 'var(--nx-accent, #007AFF)', color: '#fff', fontWeight: 600 }}>Create</button>
                    </div>
                </DialogOverlay>
            )}

            {dialog === 'newFile' && (
                <DialogOverlay onClose={() => setDialog('none')}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>📄 New File</h3>
                    <input
                        autoFocus
                        value={dialogInput}
                        onChange={e => setDialogInput(e.target.value)}
                        placeholder="File name (e.g. notes.txt)..."
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--nx-border-divider)',
                            borderRadius: 8,
                            fontSize: 14,
                            outline: 'none',
                            marginBottom: 8,
                            boxSizing: 'border-box',
                        }}
                    />
                    <textarea
                        value={dialogContent}
                        onChange={e => setDialogContent(e.target.value)}
                        placeholder="File content (optional)..."
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--nx-border-divider)',
                            borderRadius: 8,
                            fontSize: 13,
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'var(--nx-font-mono, monospace)',
                            boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                        <button onClick={() => setDialog('none')} style={{ ...toolbarBtnStyle, background: 'var(--nx-surface-input)' }}>Cancel</button>
                        <button onClick={submitNewFile} style={{ ...toolbarBtnStyle, background: 'var(--nx-accent, #007AFF)', color: '#fff', fontWeight: 600 }}>Create</button>
                    </div>
                </DialogOverlay>
            )}

            {dialog === 'viewFile' && viewingFile && (
                <DialogOverlay onClose={() => setDialog('none')}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>
                        📄 {viewingFile.meta.name}
                    </h3>
                    <div style={{ fontSize: 11, color: 'var(--nx-text-tertiary)', marginBottom: 8 }}>
                        {viewingFile.meta.path} · {viewingFile.meta.size} bytes
                    </div>
                    <pre style={{
                        background: 'var(--nx-surface-input, #f5f5f5)',
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'var(--nx-font-mono, monospace)',
                        maxHeight: 300,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                    }}>
                        {viewingFile.content || '(empty file)'}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <button onClick={() => setDialog('none')} style={{ ...toolbarBtnStyle, background: 'var(--nx-surface-input)' }}>Close</button>
                    </div>
                </DialogOverlay>
            )}
        </div>
    );
}

// OS Registry Metadata
export const EXPLORER_APP_ID = 'system.explorer';
export const EXPLORER_APP_META = {
    id: EXPLORER_APP_ID,
    title: 'Finder',
    icon: '🗂️',
    width: 800,
    height: 500
};
