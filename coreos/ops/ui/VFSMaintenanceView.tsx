'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS Maintenance View — Ops Tab (Phase 37B + 37C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ops UI card for VFS duplicate detection, conflict management,
 * and deterministic auto-remediation.
 *
 * Features:
 * - Run Scan → triggers scanForDuplicates()
 * - Results table with duplicate groups
 * - Per-group actions (Ignore)
 * - Export markdown report
 * - ⚡ Generate Plan → deterministic remediation preview (Phase 37C)
 * - 🚀 Apply Plan → two-step confirmation + execution (Phase 37C)
 * - 📋 Export Plan → markdown export (Phase 37C)
 *
 * @module coreos/ops/ui/VFSMaintenanceView
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { scanForDuplicates, formatScanReport } from '@/coreos/vfs/maintenance/duplicateScan';
import { getConflictStore } from '@/coreos/vfs/maintenance/conflictStore';
import { generatePlan, formatPlanReport } from '@/coreos/vfs/maintenance/remediationPlan';
import type { ScanResult, DuplicateGroup } from '@/coreos/vfs/maintenance/duplicateScan';
import type { ConflictSummary } from '@/coreos/vfs/maintenance/conflictStore';
import type { RemediationPlan, RemediationAction } from '@/coreos/vfs/maintenance/remediationPlan';
import { getDriver } from '@/lib/vfs/driver';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VFSMaintenanceView({ compact }: { compact?: boolean }) {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [conflictSummary, setConflictSummary] = useState<ConflictSummary>({
        open: 0, resolved: 0, ignored: 0, total: 0,
    });
    const [error, setError] = useState<string | null>(null);

    // Phase 37C state
    const [plan, setPlan] = useState<RemediationPlan | null>(null);
    const [generating, setGenerating] = useState(false);
    const [applying, setApplying] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [applyResult, setApplyResult] = useState<string | null>(null);

    // Subscribe to conflict store
    useEffect(() => {
        const store = getConflictStore();
        setConflictSummary(store.getSummary());
        return store.subscribe(setConflictSummary);
    }, []);

    // ─── Run Scan ───────────────────────────────────────────────────────

    const handleScan = useCallback(async () => {
        setScanning(true);
        setError(null);
        setPlan(null);
        setApplyResult(null);

        try {
            const driver = getDriver();
            const available = await driver.isAvailable();

            if (!available) {
                setError('VFS Driver not available (SSR or unsupported browser)');
                return;
            }

            const result = await scanForDuplicates(driver, 'user://');
            setScanResult(result);

            // Create conflict records from scan
            if (result.duplicateGroups.length > 0) {
                const store = getConflictStore();
                const added = store.addFromScan(
                    result.duplicateGroups.map(g => ({
                        parentPath: g.parentPath,
                        canonicalKey: g.canonicalKey,
                        entries: g.entries.map(e => e.name),
                    })),
                );
                console.info(`[VFS:Maintenance] Added ${added} new conflict records`);
            }

            // Submit to API (best-effort)
            try {
                await fetch('/api/ops/vfs-duplicates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result),
                });
            } catch {
                // Non-blocking
            }
        } catch (err: any) {
            setError(err?.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    }, []);

    // ─── Export Scan Report ─────────────────────────────────────────────

    const handleExport = useCallback(() => {
        if (!scanResult) return;
        const report = formatScanReport(scanResult);
        downloadText(report, `vfs-duplicate-report-${Date.now()}.md`);
    }, [scanResult]);

    // ─── Ignore Group ───────────────────────────────────────────────────

    const handleIgnore = useCallback((group: DuplicateGroup) => {
        const store = getConflictStore();
        const conflicts = store.list({ status: 'OPEN' });
        const match = conflicts.find(c => c.canonicalKey === group.canonicalKey);
        if (match) {
            store.resolve(match.id, 'IGNORED');
        }
    }, []);

    // ─── Generate Plan (Phase 37C) ──────────────────────────────────────

    const handleGeneratePlan = useCallback(async () => {
        if (!scanResult) return;
        setGenerating(true);
        setError(null);
        setApplyResult(null);

        try {
            const newPlan = generatePlan(scanResult);
            setPlan(newPlan);

            // Store plan on server (best-effort)
            try {
                await fetch('/api/ops/vfs-remediate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'plan', plan: newPlan }),
                });
            } catch {
                // Non-blocking
            }
        } catch (err: any) {
            setError(err?.message || 'Plan generation failed');
        } finally {
            setGenerating(false);
        }
    }, [scanResult]);

    // ─── Apply Plan (Phase 37C) ─────────────────────────────────────────

    const handleApplyStart = useCallback(() => {
        setShowConfirm(true);
        setConfirmText('');
    }, []);

    const handleApplyCancel = useCallback(() => {
        setShowConfirm(false);
        setConfirmText('');
    }, []);

    const handleApplyConfirm = useCallback(async () => {
        if (!plan || confirmText !== 'APPLY') return;
        setApplying(true);
        setShowConfirm(false);
        setError(null);

        try {
            const driver = getDriver();
            const available = await driver.isAvailable();
            if (!available) {
                setError('VFS Driver not available');
                return;
            }

            let completed = 0;
            let failed = 0;
            const renameActions = plan.actions.filter(a => a.type === 'RENAME');

            for (const action of renameActions) {
                try {
                    if (action.newName && typeof driver.rename === 'function') {
                        await driver.rename(action.originalPath, action.newName);
                        completed++;
                    } else {
                        // Driver doesn't support rename — log and continue
                        console.warn(`[VFS:Remediation] Rename not available for: ${action.originalPath}`);
                        failed++;
                    }
                } catch (err: any) {
                    console.error(`[VFS:Remediation] Step failed: ${action.originalPath}`, err);
                    failed++;
                    // Continue — don't halt on single failure
                }
            }

            // Mark plan as applied on server
            try {
                await fetch('/api/ops/vfs-remediate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'apply', planId: plan.planId }),
                });
            } catch {
                // Non-blocking
            }

            // Update conflict store
            const store = getConflictStore();
            for (const action of renameActions) {
                const conflicts = store.list({ status: 'OPEN' });
                const match = conflicts.find(c => c.canonicalKey === action.canonicalKey);
                if (match) {
                    store.resolve(match.id, 'RENAMED');
                }
            }

            setApplyResult(
                `✅ Remediation complete: ${completed} renamed, ${failed} failed` +
                (failed > 0 ? ' (check console for details)' : ''),
            );
        } catch (err: any) {
            setError(err?.message || 'Apply failed');
        } finally {
            setApplying(false);
            setConfirmText('');
        }
    }, [plan, confirmText]);

    // ─── Export Plan ────────────────────────────────────────────────────

    const handleExportPlan = useCallback(() => {
        if (!plan) return;
        const report = formatPlanReport(plan);
        downloadText(report, `vfs-remediation-plan-${Date.now()}.md`);
    }, [plan]);

    // ═══════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════

    return (
        <div style={s.container}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>📂 VFS Duplicate Report</h2>
                    <p style={s.subtitle}>Phase 37C — Naming Conflict Detection + Remediation</p>
                </div>
                {conflictSummary.open > 0 && (
                    <span style={s.badge}>{conflictSummary.open} open</span>
                )}
            </div>

            {/* Conflict Summary */}
            <div style={s.summaryRow}>
                <div style={s.summaryCard}>
                    <div style={s.summaryValue}>{conflictSummary.open}</div>
                    <div style={s.summaryLabel}>Open</div>
                </div>
                <div style={s.summaryCard}>
                    <div style={s.summaryValue}>{conflictSummary.resolved}</div>
                    <div style={s.summaryLabel}>Resolved</div>
                </div>
                <div style={s.summaryCard}>
                    <div style={s.summaryValue}>{conflictSummary.ignored}</div>
                    <div style={s.summaryLabel}>Ignored</div>
                </div>
                <div style={s.summaryCard}>
                    <div style={s.summaryValue}>{conflictSummary.total}</div>
                    <div style={s.summaryLabel}>Total</div>
                </div>
            </div>

            {/* Actions */}
            <div style={s.actions}>
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    style={{
                        ...s.btn,
                        ...s.btnPrimary,
                        opacity: scanning ? 0.6 : 1,
                    }}
                >
                    {scanning ? '🔍 Scanning...' : '🔍 Run Scan'}
                </button>
                {scanResult && (
                    <button onClick={handleExport} style={{ ...s.btn, ...s.btnSecondary }}>
                        📋 Export Report
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={s.error}>⚠️ {error}</div>
            )}

            {/* Scan Result */}
            {scanResult && (
                <div style={s.resultSection}>
                    <div style={s.resultMeta}>
                        Scanned {scanResult.scannedDirs} dirs • {scanResult.totalEntries} entries •
                        {' '}{scanResult.duplicateGroups.length} duplicate group(s)
                        {' '}• {new Date(scanResult.timestamp).toLocaleTimeString()}
                    </div>

                    {scanResult.duplicateGroups.length === 0 ? (
                        <div style={s.clean}>✅ No duplicates found</div>
                    ) : (
                        <>
                            <div style={s.groupList}>
                                {scanResult.duplicateGroups.map((group) => (
                                    <div key={group.canonicalKey} style={s.groupCard}>
                                        <div style={s.groupHeader}>
                                            <span style={s.groupTitle}>
                                                ⚠️ &quot;{group.normalizedName}&quot; ({group.entries.length} entries)
                                            </span>
                                            <button
                                                onClick={() => handleIgnore(group)}
                                                style={s.ignoreBtn}
                                            >
                                                Ignore
                                            </button>
                                        </div>
                                        <div style={s.groupMeta}>
                                            Parent: {group.parentPath}
                                        </div>
                                        <div style={s.entryList}>
                                            {group.entries.map((entry, j) => (
                                                <div key={j} style={s.entryItem}>
                                                    <span>{entry.type === 'folder' ? '📁' : '📄'}</span>
                                                    <span style={s.entryName}>{entry.name}</span>
                                                    <span style={s.entrySize}>{entry.size}b</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ═══════════ Phase 37C: Remediation ═══════════ */}
                            <div style={s.remediationSection}>
                                <h3 style={s.remTitle}>⚡ Remediation Engine (Phase 37C)</h3>

                                <div style={s.actions}>
                                    <button
                                        onClick={handleGeneratePlan}
                                        disabled={generating}
                                        style={{
                                            ...s.btn,
                                            ...s.btnWarning,
                                            opacity: generating ? 0.6 : 1,
                                        }}
                                    >
                                        {generating ? '⏳ Generating...' : '⚡ Generate Plan'}
                                    </button>
                                    {plan && (
                                        <>
                                            <button
                                                onClick={handleApplyStart}
                                                disabled={applying || plan.summary.renames === 0}
                                                style={{
                                                    ...s.btn,
                                                    ...s.btnDanger,
                                                    opacity: (applying || plan.summary.renames === 0) ? 0.4 : 1,
                                                }}
                                            >
                                                {applying ? '🔄 Applying...' : '🚀 Apply Plan'}
                                            </button>
                                            <button onClick={handleExportPlan} style={{ ...s.btn, ...s.btnSecondary }}>
                                                📋 Export Plan
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Plan Preview */}
                                {plan && (
                                    <div style={s.planPreview}>
                                        <div style={s.planMeta}>
                                            Plan <code>{plan.planId}</code> •{' '}
                                            {plan.summary.keeps} keep, {plan.summary.renames} rename, {plan.summary.skips} skip
                                        </div>
                                        <div style={s.planTable}>
                                            <div style={s.planRow}>
                                                <span style={{ ...s.planCell, ...s.planHeader }}>Type</span>
                                                <span style={{ ...s.planCell, ...s.planHeader, flex: 2 }}>Original</span>
                                                <span style={{ ...s.planCell, ...s.planHeader, flex: 2 }}>→ New Name</span>
                                            </div>
                                            {plan.actions.map((action, i) => (
                                                <div key={i} style={{
                                                    ...s.planRow,
                                                    background: action.type === 'KEEP'
                                                        ? 'rgba(34, 197, 94, 0.06)'
                                                        : action.type === 'RENAME'
                                                            ? 'rgba(234, 179, 8, 0.06)'
                                                            : 'rgba(255,255,255,0.02)',
                                                }}>
                                                    <span style={s.planCell}>
                                                        <span style={{
                                                            ...s.actionBadge,
                                                            background: action.type === 'KEEP'
                                                                ? 'rgba(34, 197, 94, 0.2)'
                                                                : action.type === 'RENAME'
                                                                    ? 'rgba(234, 179, 8, 0.2)'
                                                                    : 'rgba(148, 163, 184, 0.2)',
                                                            color: action.type === 'KEEP'
                                                                ? '#4ade80'
                                                                : action.type === 'RENAME'
                                                                    ? '#fbbf24'
                                                                    : '#94a3b8',
                                                        }}>
                                                            {action.type}
                                                        </span>
                                                    </span>
                                                    <span style={{ ...s.planCell, flex: 2, fontFamily: 'monospace', fontSize: 11 }}>
                                                        {action.originalName}
                                                    </span>
                                                    <span style={{ ...s.planCell, flex: 2, fontFamily: 'monospace', fontSize: 11 }}>
                                                        {action.type === 'RENAME' ? action.newName : action.type === 'SKIP' ? `(${action.reason})` : '—'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Two-Step Confirm Dialog */}
                                {showConfirm && (
                                    <div style={s.confirmOverlay}>
                                        <div style={s.confirmBox}>
                                            <h4 style={s.confirmTitle}>⚠️ Confirm Remediation Apply</h4>
                                            <p style={s.confirmText}>
                                                This will rename <strong>{plan?.summary.renames || 0}</strong> files/folders.
                                                This action is <strong>non-destructive</strong> (no data is deleted).
                                            </p>
                                            <p style={s.confirmText}>
                                                Type <code>APPLY</code> to confirm:
                                            </p>
                                            <input
                                                type="text"
                                                value={confirmText}
                                                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                                                placeholder="Type APPLY"
                                                style={s.confirmInput}
                                                autoFocus
                                            />
                                            <div style={s.confirmActions}>
                                                <button
                                                    onClick={handleApplyConfirm}
                                                    disabled={confirmText !== 'APPLY'}
                                                    style={{
                                                        ...s.btn,
                                                        ...s.btnDanger,
                                                        opacity: confirmText !== 'APPLY' ? 0.4 : 1,
                                                    }}
                                                >
                                                    🚀 Execute Remediation
                                                </button>
                                                <button onClick={handleApplyCancel} style={{ ...s.btn, ...s.btnSecondary }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Apply Result */}
                                {applyResult && (
                                    <div style={s.applyResult}>{applyResult}</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!scanResult && !scanning && !error && (
                <div style={s.emptyState}>
                    Click &quot;Run Scan&quot; to check for duplicate file/folder names in your VFS.
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 18,
        fontWeight: 700,
        margin: 0,
        color: '#e2e8f0',
    },
    subtitle: {
        fontSize: 11,
        color: '#94a3b8',
        margin: '2px 0 0',
        letterSpacing: 0.5,
    },
    badge: {
        background: 'rgba(234, 179, 8, 0.2)',
        color: '#fbbf24',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: 8,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
    },
    summaryRow: {
        display: 'flex',
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '10px 14px',
        textAlign: 'center' as const,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'monospace',
        color: '#a5b4fc',
    },
    summaryLabel: {
        fontSize: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    actions: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap' as const,
    },
    btn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
    },
    btnSecondary: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.8)',
    },
    btnWarning: {
        background: 'linear-gradient(135deg, #d97706, #f59e0b)',
        color: '#fff',
    },
    btnDanger: {
        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
        color: '#fff',
    },
    error: {
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 8,
        padding: '8px 14px',
        color: '#fca5a5',
        fontSize: 13,
    },
    resultSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    resultMeta: {
        fontSize: 12,
        color: '#94a3b8',
    },
    clean: {
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        borderRadius: 10,
        padding: '14px 20px',
        color: '#4ade80',
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'center' as const,
    },
    groupList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    groupCard: {
        background: 'rgba(234, 179, 8, 0.06)',
        border: '1px solid rgba(234, 179, 8, 0.2)',
        borderRadius: 10,
        padding: 14,
    },
    groupHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: 600,
        color: '#fbbf24',
    },
    ignoreBtn: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 6,
        padding: '3px 10px',
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
    },
    groupMeta: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 8,
    },
    entryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    entryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#e2e8f0',
        padding: '3px 8px',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: 6,
    },
    entryName: {
        flex: 1,
        fontFamily: '"SF Mono", Monaco, monospace',
    },
    entrySize: {
        fontSize: 10,
        color: '#94a3b8',
    },
    emptyState: {
        color: '#64748b',
        fontSize: 13,
        textAlign: 'center' as const,
        padding: '30px 20px',
    },

    // ─── Phase 37C Styles ───────────────────────────────────────────
    remediationSection: {
        marginTop: 16,
        padding: 16,
        background: 'rgba(217, 119, 6, 0.04)',
        border: '1px solid rgba(217, 119, 6, 0.15)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    remTitle: {
        fontSize: 15,
        fontWeight: 700,
        margin: 0,
        color: '#fbbf24',
    },
    planPreview: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    planMeta: {
        fontSize: 11,
        color: '#94a3b8',
    },
    planTable: {
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    planRow: {
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '6px 10px',
        alignItems: 'center',
    },
    planCell: {
        flex: 1,
        fontSize: 12,
        color: '#e2e8f0',
    },
    planHeader: {
        fontWeight: 700,
        fontSize: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: '#94a3b8',
    },
    actionBadge: {
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
    },
    confirmOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    confirmBox: {
        background: '#1e293b',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 16,
        padding: 28,
        maxWidth: 420,
        width: '90%',
    },
    confirmTitle: {
        fontSize: 16,
        fontWeight: 700,
        color: '#fca5a5',
        margin: '0 0 12px',
    },
    confirmText: {
        fontSize: 13,
        color: '#cbd5e1',
        margin: '0 0 10px',
        lineHeight: 1.5,
    },
    confirmInput: {
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 14,
        fontFamily: 'monospace',
        marginBottom: 16,
        outline: 'none',
        boxSizing: 'border-box' as const,
    },
    confirmActions: {
        display: 'flex',
        gap: 10,
    },
    applyResult: {
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        borderRadius: 8,
        padding: '10px 16px',
        color: '#4ade80',
        fontSize: 13,
        fontWeight: 600,
    },
};
