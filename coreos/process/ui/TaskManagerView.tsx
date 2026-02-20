/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TASK MANAGER — UI View (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shows all OS processes with state/priority controls.
 * Uses NEXUS design tokens. Reads from process-store.
 *
 * @module coreos/process/ui/TaskManagerView
 * @version 1.0.0 (Phase 15B)
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useProcessStore } from '../process-store';
import type { ProcessRecord, ProcessState, ProcessTransitionAction } from '../types';

// ─── State Badge ────────────────────────────────────────────────────────

function StateBadge({ state }: { state: ProcessState }) {
    const colors: Record<ProcessState, { bg: string; text: string; label: string }> = {
        RUNNING: { bg: 'rgba(52, 199, 89, 0.15)', text: '#34c759', label: '● Running' },
        BACKGROUND: { bg: 'rgba(0, 122, 255, 0.15)', text: '#007aff', label: '◐ Background' },
        SUSPENDED: { bg: 'rgba(255, 159, 10, 0.15)', text: '#ff9f0a', label: '⏸ Suspended' },
        TERMINATED: { bg: 'rgba(142, 142, 147, 0.15)', text: '#8e8e93', label: '⏹ Terminated' },
    };
    const c = colors[state];

    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: 'var(--nx-radius-sm, 6px)',
            background: c.bg,
            color: c.text,
            fontSize: 'var(--nx-text-caption, 11px)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            {c.label}
        </span>
    );
}

// ─── Action Button ──────────────────────────────────────────────────────

function ActionBtn({
    label,
    icon,
    onClick,
    disabled = false,
    danger = false,
}: {
    label: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            style={{
                padding: '3px 8px',
                borderRadius: 'var(--nx-radius-sm, 6px)',
                border: '1px solid var(--nx-border-divider, rgba(255,255,255,0.08))',
                background: danger
                    ? 'rgba(255, 59, 48, 0.1)'
                    : 'var(--nx-surface-input, rgba(255,255,255,0.05))',
                color: danger
                    ? '#ff3b30'
                    : disabled
                        ? 'var(--nx-text-disabled, #555)'
                        : 'var(--nx-text-secondary, #aaa)',
                fontSize: 'var(--nx-text-caption, 11px)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'background 0.15s ease',
                whiteSpace: 'nowrap',
            }}
        >
            {icon} {label}
        </button>
    );
}

// ─── Priority Control ────────────────────────────────────────────────────

function PriorityControl({ value, onChange, disabled }: {
    value: number;
    onChange: (v: number) => void;
    disabled: boolean;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            style={{
                padding: '2px 4px',
                borderRadius: 'var(--nx-radius-sm, 6px)',
                border: '1px solid var(--nx-border-divider, rgba(255,255,255,0.08))',
                background: 'var(--nx-surface-input, rgba(255,255,255,0.05))',
                color: 'var(--nx-text-secondary, #aaa)',
                fontSize: 'var(--nx-text-caption, 11px)',
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <option value={0}>0 (Low)</option>
            <option value={25}>25</option>
            <option value={50}>50 (Normal)</option>
            <option value={75}>75</option>
            <option value={100}>100 (High)</option>
        </select>
    );
}

// ─── Process Row ────────────────────────────────────────────────────────

function ProcessRow({ proc }: { proc: ProcessRecord }) {
    const transition = useProcessStore(s => s.transition);
    const setPriority = useProcessStore(s => s.setPriority);

    const isActive = proc.state !== 'TERMINATED';
    const isRunning = proc.state === 'RUNNING';
    const isBackground = proc.state === 'BACKGROUND';
    const isSuspended = proc.state === 'SUSPENDED';

    const getActions = (): { action: ProcessTransitionAction; label: string; icon: string; danger?: boolean }[] => {
        const actions: { action: ProcessTransitionAction; label: string; icon: string; danger?: boolean }[] = [];
        if (isRunning) actions.push({ action: 'background', label: 'Background', icon: '◐' });
        if (isBackground || isSuspended) actions.push({ action: 'resume', label: 'Resume', icon: '▶' });
        if (isRunning || isBackground) actions.push({ action: 'suspend', label: 'Suspend', icon: '⏸' });
        if (isActive) actions.push({ action: 'terminate', label: 'Kill', icon: '⏹', danger: true });
        return actions;
    };

    return (
        <tr style={{
            borderBottom: '1px solid var(--nx-border-divider, rgba(255,255,255,0.06))',
        }}>
            <td style={tdStyle}>
                <span style={{ fontFamily: 'var(--nx-font-mono, monospace)', fontSize: 10, color: 'var(--nx-text-disabled, #666)' }}>
                    {proc.pid.slice(-8)}
                </span>
            </td>
            <td style={tdStyle}>{proc.title}</td>
            <td style={tdStyle}>
                <span style={{ fontSize: 11, color: 'var(--nx-text-disabled, #888)' }}>{proc.appId}</span>
            </td>
            <td style={tdStyle}><StateBadge state={proc.state} /></td>
            <td style={tdStyle}>
                <PriorityControl
                    value={proc.priority}
                    onChange={(v) => setPriority(proc.pid, v, 'user_adjust')}
                    disabled={!isActive}
                />
            </td>
            <td style={tdStyle}>
                <div style={{ display: 'flex', gap: 4 }}>
                    {getActions().map(a => (
                        <ActionBtn
                            key={a.action}
                            label={a.label}
                            icon={a.icon}
                            onClick={() => transition(proc.pid, a.action, `user:${a.label.toLowerCase()}`)}
                            danger={a.danger}
                        />
                    ))}
                </div>
            </td>
        </tr>
    );
}

const tdStyle: React.CSSProperties = {
    padding: '6px 10px',
    verticalAlign: 'middle',
    fontSize: 'var(--nx-text-caption, 12px)',
    color: 'var(--nx-text-primary, #e0e0e0)',
};

const thStyle: React.CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    color: 'var(--nx-text-secondary, #888)',
    borderBottom: '1px solid var(--nx-border-divider, rgba(255,255,255,0.1))',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: 10,
};

// ─── Filter Tabs ────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'terminated';

function FilterTab({ label, active, count, onClick }: {
    label: string;
    active: boolean;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '4px 12px',
                borderRadius: 'var(--nx-radius-sm, 6px)',
                border: 'none',
                background: active ? 'rgba(0, 122, 255, 0.2)' : 'transparent',
                color: active ? '#007aff' : 'var(--nx-text-disabled, #888)',
                fontSize: 'var(--nx-text-caption, 11px)',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
            }}
        >
            {label} ({count})
        </button>
    );
}

// ─── Main View ──────────────────────────────────────────────────────────

export function TaskManagerView() {
    const processes = useProcessStore(s => s.listAll());
    const [filter, setFilter] = useState<FilterType>('active');

    const filtered = useMemo(() => {
        switch (filter) {
            case 'active': return processes.filter(p => p.state !== 'TERMINATED');
            case 'terminated': return processes.filter(p => p.state === 'TERMINATED');
            default: return processes;
        }
    }, [processes, filter]);

    const counts = useMemo(() => ({
        all: processes.length,
        active: processes.filter(p => p.state !== 'TERMINATED').length,
        terminated: processes.filter(p => p.state === 'TERMINATED').length,
    }), [processes]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
            color: 'var(--nx-text-primary, #e0e0e0)',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--nx-border-divider, rgba(255,255,255,0.08))',
            }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    <FilterTab label="Active" active={filter === 'active'} count={counts.active} onClick={() => setFilter('active')} />
                    <FilterTab label="All" active={filter === 'all'} count={counts.all} onClick={() => setFilter('all')} />
                    <FilterTab label="History" active={filter === 'terminated'} count={counts.terminated} onClick={() => setFilter('terminated')} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--nx-text-disabled, #666)' }}>
                    Phase 15B
                </span>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
                {filtered.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--nx-text-disabled, #555)',
                        fontSize: 'var(--nx-text-body, 13px)',
                    }}>
                        {filter === 'active' ? '📊 No active processes' : '📋 No process history'}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>PID</th>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>App</th>
                                <th style={thStyle}>State</th>
                                <th style={thStyle}>Priority</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <ProcessRow key={p.pid} proc={p} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '6px 12px',
                borderTop: '1px solid var(--nx-border-divider, rgba(255,255,255,0.06))',
                fontSize: 10,
                color: 'var(--nx-text-disabled, #666)',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <span>Task Manager — Phase 15B</span>
                <span>{counts.active} active · {counts.terminated} terminated</span>
            </div>
        </div>
    );
}
