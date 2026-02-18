'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS Maintenance View — Ops Tab (Phase 37B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ops UI card for VFS duplicate detection and conflict management.
 * Runs client-side scans via OPFS driver and displays results.
 *
 * Features:
 * - Run Scan button → triggers scanForDuplicates()
 * - Results table with duplicate groups
 * - Per-group actions (Ignore)
 * - Export markdown report
 * - Conflict summary badge
 *
 * @module coreos/ops/ui/VFSMaintenanceView
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { scanForDuplicates, formatScanReport } from '@/coreos/vfs/maintenance/duplicateScan';
import { getConflictStore } from '@/coreos/vfs/maintenance/conflictStore';
import type { ScanResult, DuplicateGroup } from '@/coreos/vfs/maintenance/duplicateScan';
import type { ConflictSummary } from '@/coreos/vfs/maintenance/conflictStore';
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

    // Subscribe to conflict store
    useEffect(() => {
        const store = getConflictStore();
        setConflictSummary(store.getSummary());
        return store.subscribe(setConflictSummary);
    }, []);

    // Run scan
    const handleScan = useCallback(async () => {
        setScanning(true);
        setError(null);

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
                // Non-blocking — scan result is already displayed locally
            }
        } catch (err: any) {
            setError(err?.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    }, []);

    // Export report
    const handleExport = useCallback(() => {
        if (!scanResult) return;
        const report = formatScanReport(scanResult);
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vfs-duplicate-report-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [scanResult]);

    // Ignore a duplicate group
    const handleIgnore = useCallback((group: DuplicateGroup) => {
        const store = getConflictStore();
        const conflicts = store.list({ status: 'OPEN' });
        const match = conflicts.find(c => c.canonicalKey === group.canonicalKey);
        if (match) {
            store.resolve(match.id, 'IGNORED');
        }
    }, []);

    return (
        <div style={s.container}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>📂 VFS Duplicate Report</h2>
                    <p style={s.subtitle}>Phase 37B — Naming Conflict Detection</p>
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
                        <div style={s.groupList}>
                            {scanResult.duplicateGroups.map((group, i) => (
                                <div key={group.canonicalKey} style={s.groupCard}>
                                    <div style={s.groupHeader}>
                                        <span style={s.groupTitle}>
                                            ⚠️ "{group.normalizedName}" ({group.entries.length} entries)
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
                    )}
                </div>
            )}

            {/* Empty State */}
            {!scanResult && !scanning && !error && (
                <div style={s.emptyState}>
                    Click "Run Scan" to check for duplicate file/folder names in your VFS.
                </div>
            )}
        </div>
    );
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
};
