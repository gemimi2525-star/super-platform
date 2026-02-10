/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES APP UI (Phase 16A — First VFS Consumer)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A notes application that uses VFS via AppVFSAdapter.
 * Demonstrates:
 * - READ files from user:// via adapter
 * - Permission badge display
 * - Audit trace with appId
 * 
 * @module apps/core.notes/ui
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppVFSAdapter } from '@/coreos/vfs/app-adapter';
import type { VFSMetadata } from '@/lib/vfs/types';
import type { AppPermissionSet } from '@/coreos/vfs/permission-matrix';

// ─── Types ────────────────────────────────────────────────────────────────

interface NotesUIProps {
    userId?: string;
    onClose?: () => void;
}

interface NoteFile {
    metadata: VFSMetadata;
    content?: string;
}

// ─── Notes UI Component ──────────────────────────────────────────────────

export function NotesUI({ userId = 'default-user', onClose }: NotesUIProps) {
    const [adapter] = useState(() => new AppVFSAdapter('core.notes', userId));
    const [permissions, setPermissions] = useState<AppPermissionSet | null>(null);
    const [files, setFiles] = useState<VFSMetadata[]>([]);
    const [selectedFile, setSelectedFile] = useState<NoteFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState('user://');

    // ─── Initialize ─────────────────────────────────────────────────────

    useEffect(() => {
        setPermissions(adapter.getPermissions());
        loadFiles(currentPath);
    }, []);

    // ─── VFS Operations ─────────────────────────────────────────────────

    const loadFiles = useCallback(async (path: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const items = await adapter.list(path);
            setFiles(items);
            setCurrentPath(path);
        } catch (err: any) {
            console.error('[Notes] Failed to list files:', err);
            setError(err.message || 'Failed to load files');
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    }, [adapter]);

    const readFile = useCallback(async (file: VFSMetadata) => {
        if (file.type === 'folder' || file.type === 'directory') {
            loadFiles(file.path);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await adapter.read(file.path);
            const content = new TextDecoder().decode(data);
            setSelectedFile({ metadata: file, content });
        } catch (err: any) {
            console.error('[Notes] Failed to read file:', err);
            setError(err.message || 'Failed to read file');
        } finally {
            setIsLoading(false);
        }
    }, [adapter, loadFiles]);

    const createNote = useCallback(async () => {
        setError(null);
        setSuccessMsg(null);
        const filename = `p16a1-notes-write.txt`;
        const content = 'Phase 16A.1 runtime write verification';
        const path = `user://${filename}`;
        try {
            console.info('[Notes] Creating note:', path);
            await adapter.write(path, content);
            setSuccessMsg(`✅ Created: ${filename}`);
            // Reload file list to show new file
            await loadFiles(currentPath);
        } catch (err: any) {
            console.error('[Notes] Failed to create note:', err);
            setError(err.message || 'Failed to create note');
        }
    }, [adapter, currentPath, loadFiles]);

    const testSystemAccess = useCallback(async () => {
        setError(null);
        setSuccessMsg(null);
        try {
            console.info('[Notes] Testing system:// access (expect DENY)...');
            await adapter.list('system://');
            // Should NOT reach here
            setError('⚠️ UNEXPECTED: system:// access was ALLOWED (should be DENIED)');
        } catch (err: any) {
            console.info('[Notes] system:// access correctly DENIED:', err.message);
            setSuccessMsg(`🛡️ system:// DENIED correctly: ${err.message}`);
        }
    }, [adapter]);

    const goUp = useCallback(() => {
        const parts = currentPath.replace(/\/$/, '').split('/');
        if (parts.length > 3) { // user:// is minimum
            parts.pop();
            loadFiles(parts.join('/'));
        } else {
            loadFiles('user://');
        }
    }, [currentPath, loadFiles]);

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            color: '#e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 20 }}>📝</span>
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Notes</span>

                {/* Permission Badge */}
                {permissions && (
                    <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 500,
                        background: permissions.readOnly
                            ? 'rgba(255,193,7,0.2)'
                            : 'rgba(76,175,80,0.2)',
                        color: permissions.readOnly ? '#ffc107' : '#4caf50',
                        border: `1px solid ${permissions.readOnly ? 'rgba(255,193,7,0.3)' : 'rgba(76,175,80,0.3)'}`,
                    }}>
                        {permissions.readOnly ? '🔒 Read-Only' : '✏️ Read/Write'}
                    </span>
                )}

                {/* Scheme badge */}
                {permissions && (
                    <span style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        background: 'rgba(100,149,237,0.2)',
                        color: '#6495ed',
                        border: '1px solid rgba(100,149,237,0.3)',
                    }}>
                        {permissions.schemes.join(', ')}://
                    </span>
                )}
            </div>

            {/* Path Bar */}
            <div style={{
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                flexShrink: 0,
            }}>
                <button
                    onClick={goUp}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 4,
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: 12,
                    }}
                >
                    ⬆ Up
                </button>
                <span style={{ opacity: 0.7, fontFamily: 'monospace' }}>{currentPath}</span>
                <button
                    onClick={() => loadFiles(currentPath)}
                    style={{
                        marginLeft: 'auto',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 4,
                        color: '#e0e0e0',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: 12,
                    }}
                >
                    🔄 Refresh
                </button>
                <button
                    onClick={createNote}
                    title="Create p16a1-notes-write.txt in user://"
                    style={{
                        background: 'rgba(76,175,80,0.2)',
                        border: '1px solid rgba(76,175,80,0.3)',
                        borderRadius: 4,
                        color: '#4caf50',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: 12,
                    }}
                >
                    ✏️ New Note
                </button>
                <button
                    onClick={testSystemAccess}
                    title="Test system:// access (expect DENY)"
                    style={{
                        background: 'rgba(244,67,54,0.2)',
                        border: '1px solid rgba(244,67,54,0.3)',
                        borderRadius: 4,
                        color: '#ef5350',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: 12,
                    }}
                >
                    🧪 Test system://
                </button>
            </div>

            {/* Success Message */}
            {successMsg && (
                <div style={{
                    padding: '8px 16px',
                    background: 'rgba(76,175,80,0.15)',
                    border: '1px solid rgba(76,175,80,0.3)',
                    color: '#66bb6a',
                    fontSize: 13,
                    flexShrink: 0,
                }}>
                    {successMsg}
                </div>
            )}

            {/* Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
            }}>
                {/* File List Panel */}
                <div style={{
                    width: selectedFile ? '40%' : '100%',
                    borderRight: selectedFile ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    overflowY: 'auto',
                    transition: 'width 0.2s ease',
                }}>
                    {isLoading && !files.length && (
                        <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>
                            ⏳ Loading...
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: 16,
                            margin: 12,
                            background: 'rgba(244,67,54,0.15)',
                            border: '1px solid rgba(244,67,54,0.3)',
                            borderRadius: 8,
                            color: '#ef5350',
                            fontSize: 13,
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    {files.length === 0 && !isLoading && !error && (
                        <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>
                            📂 No files found
                        </div>
                    )}

                    {files.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => readFile(file)}
                            style={{
                                padding: '10px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: selectedFile?.metadata.id === file.id
                                    ? 'rgba(100,149,237,0.15)'
                                    : 'transparent',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (selectedFile?.metadata.id !== file.id) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedFile?.metadata.id !== file.id) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: 16 }}>
                                {file.type === 'folder' || file.type === 'directory' ? '📁' : '📄'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.5 }}>
                                    {file.type === 'file' && file.size != null
                                        ? `${file.size} bytes`
                                        : file.type}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content Viewer Panel */}
                {selectedFile && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {/* File header */}
                        <div style={{
                            padding: '10px 16px',
                            background: 'rgba(0,0,0,0.2)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 14 }}>📄</span>
                            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                                {selectedFile.metadata.name}
                            </span>
                            <button
                                onClick={() => setSelectedFile(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 4,
                                    color: '#e0e0e0',
                                    cursor: 'pointer',
                                    padding: '2px 8px',
                                    fontSize: 12,
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* File content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: 16,
                        }}>
                            <pre style={{
                                margin: 0,
                                fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
                                fontSize: 13,
                                lineHeight: 1.6,
                                color: '#d4d4d4',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}>
                                {selectedFile.content ?? '(No content)'}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div style={{
                padding: '6px 16px',
                background: 'rgba(0,0,0,0.3)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 11,
                opacity: 0.7,
                flexShrink: 0,
            }}>
                <span>📝 Notes — Phase 16A</span>
                <span>|</span>
                <span>appId: core.notes</span>
                <span>|</span>
                <span>{files.length} items</span>
                {selectedFile && (
                    <>
                        <span>|</span>
                        <span>Viewing: {selectedFile.metadata.name}</span>
                    </>
                )}
            </div>
        </div>
    );
}

export default NotesUI;
