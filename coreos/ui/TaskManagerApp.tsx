/**
 * Phase 15B.4: Task Manager App
 * 
 * OS-level process visibility and management.
 * Admin-only access, Intent-only operations.
 * 
 * Features:
 * - Process list with auto-refresh (LOCAL + SERVER combined)
 * - Terminate/Force Quit (via dispatchProcessIntent)
 * - Confirm dialog for dangerous actions
 * - Audit correlation display
 * 
 * Phase 15B.3: Now uses useProcessManager for client-side Worker state
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessDescriptor {
    pid: string;
    appId: string;
    state: 'RUNNING' | 'SUSPENDED' | 'TERMINATED' | 'CRASHED';
    startedAt: number;
    ownerId?: string;
    cpuTime?: number;
    memoryMB?: number;
    lastHeartbeat?: number;
    source?: 'local' | 'server'; // Phase 15B.3: Track data source
}

interface ProcessIntentResult {
    success: boolean;
    action: string;
    pid?: string;
    decision?: { outcome: 'ALLOW' | 'DENY'; reason?: string };
    opId?: string;
    traceId?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tokens (matching Ops Center design)
// ═══════════════════════════════════════════════════════════════════════════

const tokens = {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#111111',
    bgCard: '#1a1a1a',
    bgAccent: '#1e293b',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    border: '#27272a',
    accent: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    cyan: '#06b6d4',
    radius: 8,
};

// ═══════════════════════════════════════════════════════════════════════════
// API Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

async function fetchProcessesFromServer(): Promise<{ success: boolean; processes: ProcessDescriptor[]; error?: string }> {
    try {
        const res = await fetch('/api/platform/process-registry');
        const data = await res.json();
        if (data.success) {
            return { success: true, processes: (data.processes || []).map((p: ProcessDescriptor) => ({ ...p, source: 'server' as const })) };
        }
        return { success: false, processes: [], error: data.error };
    } catch {
        return { success: false, processes: [], error: 'Network error' };
    }
}

async function dispatchProcessIntent(
    action: string,
    pid?: string,
    options?: { appId: string; entryPoint: string }
): Promise<ProcessIntentResult> {
    const traceId = `TM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    try {
        const res = await fetch('/api/platform/process-intents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
            body: JSON.stringify({ action, pid, options }),
        });
        return res.json();
    } catch {
        return { success: false, action, error: 'Network error' };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ProcessManager Wrapper (Client-side only)
// ═══════════════════════════════════════════════════════════════════════════

let processManagerInstance: any = null;

function getLocalProcessManager(): any {
    if (typeof window === 'undefined') return null;
    if (!processManagerInstance) {
        try {
            const { ProcessManager } = require('@/lib/process/ProcessManager');
            processManagerInstance = ProcessManager.getInstance();
        } catch {
            return null;
        }
    }
    return processManagerInstance;
}

function getLocalProcesses(): ProcessDescriptor[] {
    const pm = getLocalProcessManager();
    if (!pm) return [];
    return pm.list().map((p: ProcessDescriptor) => ({ ...p, source: 'local' as const }));
}

// Merge server and local processes (local takes priority for real-time state)
function mergeProcesses(serverProcs: ProcessDescriptor[], localProcs: ProcessDescriptor[]): ProcessDescriptor[] {
    const merged = new Map<string, ProcessDescriptor>();

    for (const proc of serverProcs) {
        merged.set(proc.pid, proc);
    }

    for (const proc of localProcs) {
        const existing = merged.get(proc.pid);
        if (existing) {
            // Local has real-time state, merge and mark as LOCAL
            merged.set(proc.pid, { ...existing, ...proc, source: 'local' });
        } else {
            merged.set(proc.pid, proc);
        }
    }

    return Array.from(merged.values());
}

// ═══════════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════════

const StateIcon: React.FC<{ state: string }> = ({ state }) => {
    switch (state) {
        case 'RUNNING': return <span style={{ color: tokens.success }}>●</span>;
        case 'SUSPENDED': return <span style={{ color: tokens.warning }}>●</span>;
        case 'TERMINATED': return <span style={{ color: tokens.textSecondary }}>●</span>;
        case 'CRASHED': return <span style={{ color: tokens.error }}>●</span>;
        default: return <span>●</span>;
    }
};

const SourceBadge: React.FC<{ source?: 'local' | 'server' }> = ({ source }) => {
    if (source === 'local') {
        return <span style={{ fontSize: 9, background: tokens.cyan + '44', color: tokens.cyan, padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>LOCAL</span>;
    }
    return <span style={{ fontSize: 9, background: tokens.warning + '44', color: tokens.warning, padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>SERVER</span>;
};

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                background: tokens.bgCard, padding: 24, borderRadius: tokens.radius,
                border: `1px solid ${tokens.border}`, maxWidth: 400, width: '90%',
            }}>
                <h3 style={{ margin: '0 0 12px', color: tokens.warning }}>{title}</h3>
                <p style={{ color: tokens.textSecondary, marginBottom: 20 }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        padding: '8px 16px', background: tokens.bgSecondary, border: `1px solid ${tokens.border}`,
                        color: tokens.textPrimary, borderRadius: 6, cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '8px 16px', background: tokens.error, border: 'none',
                        color: 'white', borderRadius: 6, cursor: 'pointer',
                    }}>Force Quit</button>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component (WIRED to local ProcessManager + server fallback)
// ═══════════════════════════════════════════════════════════════════════════

export const TaskManagerApp: React.FC = () => {
    const [processes, setProcesses] = useState<ProcessDescriptor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshIntervalState] = useState(2000);
    const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [selectedProcess, setSelectedProcess] = useState<ProcessDescriptor | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; pid: string; appId: string }>({ isOpen: false, pid: '', appId: '' });
    const [hasLocalPM, setHasLocalPM] = useState(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Check if local ProcessManager is available
    useEffect(() => {
        const pm = getLocalProcessManager();
        setHasLocalPM(!!pm);

        if (pm) {
            // Subscribe to local ProcessManager updates for reactive UI
            unsubscribeRef.current = pm.subscribe((updatedProcs: ProcessDescriptor[]) => {
                const localProcs = updatedProcs.map(p => ({ ...p, source: 'local' as const }));
                setProcesses(prev => mergeProcesses(prev.filter(p => p.source === 'server'), localProcs));
            });
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    const refresh = useCallback(async () => {
        // Get local processes (real-time Worker state)
        const localProcs = getLocalProcesses();

        // Get server processes
        const serverResult = await fetchProcessesFromServer();

        if (serverResult.success || localProcs.length > 0) {
            const merged = mergeProcesses(serverResult.processes, localProcs);
            setProcesses(merged);
            setError(null);
        } else {
            setError(serverResult.error || 'Failed to fetch');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(refresh, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, refresh]);

    const handleTerminate = async (pid: string) => {
        const result = await dispatchProcessIntent('os.process.terminate', pid);
        if (result.success) {
            setActionResult({ type: 'success', message: `Terminated ${pid}` });
            refresh();
        } else {
            setActionResult({ type: 'error', message: result.error || result.decision?.reason || 'Failed' });
        }
        setTimeout(() => setActionResult(null), 3000);
    };

    const handleForceQuit = async (pid: string) => {
        const result = await dispatchProcessIntent('os.process.forceQuit', pid);
        if (result.success) {
            setActionResult({ type: 'success', message: `Force quit ${pid}` });
            refresh();
        } else {
            setActionResult({ type: 'error', message: result.error || result.decision?.reason || 'Failed' });
        }
        setConfirmDialog({ isOpen: false, pid: '', appId: '' });
        setTimeout(() => setActionResult(null), 3000);
    };

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString();
    };

    const formatUptime = (startedAt: number) => {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    return (
        <div style={{ background: tokens.bgPrimary, borderRadius: tokens.radius, border: `1px solid ${tokens.border}`, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: 16, background: tokens.bgSecondary, borderBottom: `1px solid ${tokens.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧠</span>
                    <span style={{ fontWeight: 600, color: tokens.textPrimary }}>Task Manager</span>
                    <span style={{ color: tokens.textSecondary, fontSize: 12 }}>({processes.length} processes)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                        <span style={{ color: tokens.textSecondary, fontSize: 12 }}>Auto</span>
                    </label>
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshIntervalState(Number(e.target.value))}
                        style={{ background: tokens.bgCard, color: tokens.textPrimary, border: `1px solid ${tokens.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 12 }}
                    >
                        <option value={2000}>2s</option>
                        <option value={5000}>5s</option>
                        <option value={10000}>10s</option>
                    </select>
                    <button onClick={refresh} style={{ padding: '4px 12px', background: tokens.accent, border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Action Result */}
            {actionResult && (
                <div style={{ padding: 12, background: actionResult.type === 'success' ? tokens.success + '22' : tokens.error + '22', borderBottom: `1px solid ${tokens.border}` }}>
                    <span style={{ color: actionResult.type === 'success' ? tokens.success : tokens.error }}>
                        {actionResult.type === 'success' ? '✅' : '❌'} {actionResult.message}
                    </span>
                </div>
            )}

            {/* Table */}
            <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: tokens.bgSecondary, borderBottom: `1px solid ${tokens.border}` }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>State</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>PID</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>App</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>Uptime</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>Started</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', color: tokens.textSecondary, fontWeight: 500 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: tokens.textSecondary }}>Loading...</td></tr>
                        )}
                        {error && (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: tokens.error }}>{error}</td></tr>
                        )}
                        {!loading && !error && processes.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: tokens.textSecondary }}>No processes running</td></tr>
                        )}
                        {processes.map((proc) => (
                            <tr key={proc.pid} style={{ borderBottom: `1px solid ${tokens.border}`, cursor: 'pointer' }} onClick={() => setSelectedProcess(proc)}>
                                <td style={{ padding: '10px 12px' }}><StateIcon state={proc.state} /> {proc.state}</td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: tokens.textSecondary }}>{proc.pid}</td>
                                <td style={{ padding: '10px 12px', color: tokens.textPrimary }}>{proc.appId} <SourceBadge source={proc.source} /></td>
                                <td style={{ padding: '10px 12px', color: tokens.textSecondary }}>{formatUptime(proc.startedAt)}</td>
                                <td style={{ padding: '10px 12px', color: tokens.textSecondary, fontSize: 11 }}>{formatTime(proc.startedAt)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleTerminate(proc.pid); }}
                                        style={{ padding: '4px 8px', background: tokens.bgCard, border: `1px solid ${tokens.border}`, color: tokens.textPrimary, borderRadius: 4, cursor: 'pointer', marginRight: 6, fontSize: 11 }}
                                        disabled={proc.state !== 'RUNNING'}
                                    >
                                        Stop
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, pid: proc.pid, appId: proc.appId }); }}
                                        style={{ padding: '4px 8px', background: tokens.error, border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                                    >
                                        Force Quit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Process Detail Drawer */}
            {selectedProcess && (
                <div style={{ padding: 16, background: tokens.bgCard, borderTop: `1px solid ${tokens.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, color: tokens.textPrimary }}>Process Details</span>
                        <button onClick={() => setSelectedProcess(null)} style={{ background: 'none', border: 'none', color: tokens.textSecondary, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 13 }}>
                        <span style={{ color: tokens.textSecondary }}>PID:</span>
                        <span style={{ fontFamily: 'monospace', color: tokens.textPrimary }}>{selectedProcess.pid}</span>
                        <span style={{ color: tokens.textSecondary }}>App ID:</span>
                        <span style={{ color: tokens.textPrimary }}>{selectedProcess.appId}</span>
                        <span style={{ color: tokens.textSecondary }}>State:</span>
                        <span style={{ color: tokens.textPrimary }}><StateIcon state={selectedProcess.state} /> {selectedProcess.state}</span>
                        <span style={{ color: tokens.textSecondary }}>Owner:</span>
                        <span style={{ color: tokens.textPrimary }}>{selectedProcess.ownerId || 'unknown'}</span>
                        <span style={{ color: tokens.textSecondary }}>Started:</span>
                        <span style={{ color: tokens.textPrimary }}>{new Date(selectedProcess.startedAt).toLocaleString()}</span>
                        <span style={{ color: tokens.textSecondary }}>Audit Filter:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: tokens.accent }}>pid:{selectedProcess.pid}</span>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="⚠️ Force Quit Process"
                message={`Are you sure you want to force quit "${confirmDialog.appId}" (${confirmDialog.pid})? This will immediately terminate the process without cleanup.`}
                onConfirm={() => handleForceQuit(confirmDialog.pid)}
                onCancel={() => setConfirmDialog({ isOpen: false, pid: '', appId: '' })}
            />
        </div>
    );
};

export default TaskManagerApp;
