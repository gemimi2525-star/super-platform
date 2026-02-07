// Phase 15B.2: Task Manager V2
// 
// Extended Task Manager with Suspend/Resume/Priority controls.
// New component - DOES NOT modify frozen TaskManagerApp.tsx
// */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ProcessDescriptorV2, ProcessPriority, ProcessStateV2 } from '@/lib/process-v2/types';
import { suspendProcess, resumeProcess, setPriority, dispatchProcessIntentV2 } from '@/lib/process-v2/dispatchProcessIntentV2';
import { useWindows } from '@/governance/synapse';

type ProcessSource = 'LOCAL' | 'RUNTIME' | 'CLIENT';

interface EnhancedProcess extends ProcessDescriptorV2 {
    source: ProcessSource;
    runtimeMetadata?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// Design Tokens (from NEXUS)
// ═══════════════════════════════════════════════════════════════════════════

const tokens = {
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgCard: '#2d2d2d',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#3e3e42',
    accent: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
};

// ═══════════════════════════════════════════════════════════════════════════
// State Icons
// ═══════════════════════════════════════════════════════════════════════════

function StateIcon({ state }: { state: ProcessStateV2 }) {
    switch (state) {
        case 'RUNNING': return <span style={{ color: tokens.success }}>●</span>;
        case 'SUSPENDED': return <span style={{ color: tokens.warning }}>◐</span>;
        case 'TERMINATED': return <span style={{ color: tokens.textSecondary }}>○</span>;
        case 'CRASHED': return <span style={{ color: tokens.error }}>✕</span>;
    }
}

function PriorityBadge({ priority }: { priority: ProcessPriority }) {
    const colors: Record<ProcessPriority, string> = {
        low: '#6b7280',
        normal: tokens.accent,
        high: tokens.warning,
        realtime: tokens.purple,
    };
    return (
        <span style={{
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 10,
            background: colors[priority] + '22',
            color: colors[priority],
            fontWeight: 600,
            textTransform: 'uppercase',
        }}>
            {priority}
        </span>
    );
}

function SourceBadge({ source }: { source: ProcessSource }) {
    let color = tokens.textSecondary;
    if (source === 'RUNTIME') color = tokens.purple;
    if (source === 'CLIENT') color = tokens.cyan;

    return (
        <span style={{
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 9,
            background: color + '22',
            color: color,
            border: `1px solid ${color}44`,
            marginRight: 6
        }}>
            {source}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function TaskManagerV2() {
    const windows = useWindows();
    const [serverProcesses, setServerProcesses] = useState<EnhancedProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchProcesses = useCallback(async () => {
        try {
            // 1. Fetch Local Processes (Phase 15B)
            const localRes = await fetch('/api/platform/process-intents-v2', { method: 'GET' });
            const localData = localRes.ok ? await localRes.json() : { processes: [] };

            // 2. Fetch Runtime Registry (Phase 16/17)
            const registryRes = await fetch('/api/platform/process-registry', { method: 'GET' });
            const registryData = registryRes.ok ? await registryRes.json() : { processes: [] };

            // 3. Merge Lists
            const localProcs: EnhancedProcess[] = (localData.processes || []).map((p: ProcessDescriptorV2) => ({
                ...p,
                source: 'LOCAL'
            }));

            // Registry processes might duplicate local ones if we unify them later,
            // but for now treat them as distinct sources unless PID matches.
            const registryProcs: EnhancedProcess[] = (registryData.processes || []).map((p: any) => ({
                pid: p.pid,
                appId: p.appId,
                state: p.state,
                priority: p.priority || 'normal',
                startedAt: new Date(p.startedAt).getTime(),
                source: 'RUNTIME',
                runtimeMetadata: p.metadata
            }));

            // Combine, preferring RUNTIME info if collision (though PIDs should be unique per prefix)
            // Local PIDs: "proc-*" or numeric
            // Runtime PIDs: "runtime-*"
            const merged = [...localProcs, ...registryProcs];

            // Dedupe by PID just in case
            const unique = Array.from(new Map(merged.map(p => [p.pid, p])).values());

            setServerProcesses(unique);
            setError(null);
        } catch (err) {
            console.error('Task Manager fetch error:', err);
            // Don't show error to user if it's just auth failure on empty backend, 
            // as we want to show Client processes at least.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProcesses();
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchProcesses, 2000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoRefresh, fetchProcesses]);

    // Derived state: Combine server and client processes
    const processes = useMemo(() => {
        const clientProcs: EnhancedProcess[] = windows.map(w => ({
            pid: `win-${w.id.substring(0, 8)}`,
            appId: w.title,
            state: w.state === 'minimized' ? 'SUSPENDED' : 'RUNNING',
            priority: 'normal',
            startedAt: 0, // Not tracked for windows
            resumeCount: 0,
            source: 'CLIENT',
            runtimeMetadata: { windowId: w.id }
        }));

        // Combine server and client
        // Create a map to dedupe if needed (unlikely to have collision between win-* and server pids)
        const all = [...serverProcesses, ...clientProcs];

        return all.sort((a, b) => {
            // Sort by state (RUNNING first), then source, then appId
            if (a.state !== b.state) return a.state === 'RUNNING' ? -1 : 1;
            return a.appId.localeCompare(b.appId);
        });
    }, [serverProcesses, windows]);

    const handleSuspend = async (pid: string) => {
        const traceId = `tm2-${Date.now()}`;
        // Only support server processes for now
        if (pid.startsWith('win-')) {
            setActionResult({ type: 'error', message: 'Cannot suspend client windows yet' });
            return;
        }

        const result = await suspendProcess(pid, 'Manual suspend from Task Manager V2', traceId);
        if (result.success) {
            setActionResult({ type: 'success', message: `Suspended ${pid}` });
        } else {
            setActionResult({ type: 'error', message: result.error || 'Suspend failed' });
        }
        fetchProcesses();
    };

    const handleResume = async (pid: string) => {
        const traceId = `tm2-${Date.now()}`;
        if (pid.startsWith('win-')) {
            setActionResult({ type: 'error', message: 'Cannot resume client windows yet' });
            return;
        }

        const result = await resumeProcess(pid, traceId);
        if (result.success) {
            setActionResult({ type: 'success', message: `Resumed ${pid}` });
        } else {
            setActionResult({ type: 'error', message: result.error || 'Resume failed' });
        }
        fetchProcesses();
    };

    const handleSetPriority = async (pid: string, priority: ProcessPriority) => {
        const traceId = `tm2-${Date.now()}`;
        if (pid.startsWith('win-')) {
            setActionResult({ type: 'error', message: 'Cannot set priority for client windows' });
            return;
        }

        const result = await setPriority(pid, priority, traceId);
        if (result.success) {
            setActionResult({ type: 'success', message: `Priority set to ${priority}` });
        } else {
            setActionResult({ type: 'error', message: result.error || 'Set priority failed' });
        }
        fetchProcesses();
    };

    const handleForceQuit = async (pid: string) => {
        const traceId = `tm2-${Date.now()}`;
        if (pid.startsWith('win-')) {
            // Find window ID from PID
            // For now, we don't have direct window close access here without injecting another hook 
            // or dispatching an intent that Synapse handles.
            // Assumption: 'os.process.forceQuit' might handle it if we map it?
            // For MVP, just show error.
            setActionResult({ type: 'error', message: 'Use window controls to close' });
            return;
        }

        const result = await dispatchProcessIntentV2({ action: 'os.process.forceQuit', pid }, traceId);
        if (result.success) {
            setActionResult({ type: 'success', message: `Force quit ${pid}` });
        } else {
            setActionResult({ type: 'error', message: result.error || 'Force quit failed' });
        }
        fetchProcesses();
    };

    const formatUptime = (startedAt: number) => {
        if (startedAt === 0) return '-';
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    return (
        <div style={{ background: tokens.bgPrimary, color: tokens.textPrimary, borderRadius: 8, overflow: 'hidden', border: `1px solid ${tokens.border}` }}>
            {/* Header */}
            <div style={{ padding: 16, borderBottom: `1px solid ${tokens.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧠</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Task Manager V2</h3>
                    <span style={{ padding: '2px 8px', background: tokens.purple + '22', color: tokens.purple, borderRadius: 4, fontSize: 10, fontWeight: 600 }}>17.1</span>
                    <span style={{ color: tokens.textSecondary, fontSize: 12 }}>({processes.length} processes)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                        <span style={{ color: tokens.textSecondary, fontSize: 12 }}>Auto</span>
                    </label>
                    <button onClick={fetchProcesses} style={{ padding: '4px 12px', background: tokens.accent, border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
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
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>Priority</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: tokens.textSecondary, fontWeight: 500 }}>Uptime</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', color: tokens.textSecondary, fontWeight: 500 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && processes.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: tokens.textSecondary }}>Loading...</td></tr>
                        )}
                        {!loading && processes.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: tokens.textSecondary }}>No processes running</td></tr>
                        )}
                        {processes.map((proc) => (
                            <tr key={proc.pid} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                                <td style={{ padding: '10px 12px' }}><StateIcon state={proc.state} /> {proc.state}</td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: tokens.textSecondary }}>{proc.pid}</td>
                                <td style={{ padding: '10px 12px', color: tokens.textPrimary }}>
                                    <SourceBadge source={proc.source} />
                                    {proc.appId}
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                    <select
                                        value={proc.priority}
                                        onChange={(e) => handleSetPriority(proc.pid, e.target.value as ProcessPriority)}
                                        disabled={proc.state === 'TERMINATED' || proc.state === 'CRASHED' || proc.source === 'CLIENT'}
                                        style={{ background: proc.source === 'CLIENT' ? tokens.bgSecondary : tokens.bgCard, color: proc.source === 'CLIENT' ? tokens.textSecondary : tokens.textPrimary, border: `1px solid ${tokens.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="realtime">Realtime</option>
                                    </select>
                                </td>
                                <td style={{ padding: '10px 12px', color: tokens.textSecondary }}>{formatUptime(proc.startedAt)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    {proc.state === 'RUNNING' && (
                                        <button
                                            onClick={() => handleSuspend(proc.pid)}
                                            style={{ padding: '4px 8px', background: proc.source === 'CLIENT' ? tokens.bgSecondary : tokens.warning, border: 'none', color: proc.source === 'CLIENT' ? tokens.textSecondary : 'white', borderRadius: 4, cursor: proc.source === 'CLIENT' ? 'default' : 'pointer', marginRight: 6, fontSize: 11 }}
                                            disabled={proc.source === 'CLIENT'}
                                        >
                                            ⏸ Suspend
                                        </button>
                                    )}
                                    {proc.state === 'SUSPENDED' && (
                                        <button
                                            onClick={() => handleResume(proc.pid)}
                                            style={{ padding: '4px 8px', background: proc.source === 'CLIENT' ? tokens.bgSecondary : tokens.success, border: 'none', color: proc.source === 'CLIENT' ? tokens.textSecondary : 'white', borderRadius: 4, cursor: proc.source === 'CLIENT' ? 'default' : 'pointer', marginRight: 6, fontSize: 11 }}
                                            disabled={proc.source === 'CLIENT'}
                                        >
                                            ▶ Resume
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleForceQuit(proc.pid)}
                                        style={{ padding: '4px 8px', background: proc.source === 'CLIENT' ? tokens.bgSecondary : tokens.error, border: 'none', color: proc.source === 'CLIENT' ? tokens.textSecondary : 'white', borderRadius: 4, cursor: proc.source === 'CLIENT' ? 'default' : 'pointer', fontSize: 11 }}
                                        disabled={proc.state === 'TERMINATED' || proc.source === 'CLIENT'}
                                    >
                                        Force Quit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ padding: 12, borderTop: `1px solid ${tokens.border}`, display: 'flex', gap: 16, fontSize: 11, color: tokens.textSecondary }}>
                <span><span style={{ color: tokens.success }}>●</span> Running</span>
                <span><span style={{ color: tokens.warning }}>◐</span> Suspended</span>
                <span><span style={{ color: tokens.textSecondary }}>○</span> Terminated</span>
                <span><span style={{ color: tokens.error }}>✕</span> Crashed</span>
            </div>
        </div>
    );
}

export default TaskManagerV2;
