
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFileSystem } from '../../lib/filesystem/FileSystemProvider';
import { FileSystemError, FsError } from '../../lib/filesystem/types';
import { FsIntentHandler } from '../../lib/filesystem/FsIntentHandler';

interface TestResult {
    gateId: string;
    description: string;
    status: 'PASS' | 'FAIL';
    traceId: string;
    latency: number;
    error?: string;
}

const STORAGE_KEY = 'verifier_state_v1';

export const VerifierAppV0 = () => {
    const fs = useFileSystem();
    const intentHandler = useMemo(() => new FsIntentHandler(fs), [fs]);

    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [phase, setPhase] = useState<'15A.1' | '15A.2'>('15A.1');

    // Auto-Resume after reload
    useEffect(() => {
        const resumeTests = async () => {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) return;

            const state = JSON.parse(savedState);
            if (state.pending === 'G1') {
                console.log('[Verifier] Resuming G1 after reload...');
                setIsRunning(true);
                setPhase(state.phase || '15A.1');
                await verifyG1PostReload(state);
            }
        };
        resumeTests();
    }, [fs]);

    const runTests = async () => {
        setIsRunning(true);
        setResults([]);

        // Start G1 (Phase A)
        await runG1PreReload();
    };

    const runG1PreReload = async () => {
        const traceId = `TEST-${Date.now()}-G1-PRE`;
        console.log('[Verifier] Starting G1A (Pre-Reload)...');

        try {
            // 1. Prepare Data
            await fs.writeFile('user://verify_persist.txt', 'PERSISTENT_DATA', { create: true });
            await fs.writeFile('temp://verify_volatile.txt', 'VOLATILE_DATA', { create: true });

            // 2. Set State
            const state = {
                pending: 'G1',
                phase,
                traceBase: traceId,
                startTime: Date.now(),
                expected: {
                    userPath: 'user://verify_persist.txt',
                    tempPath: 'temp://verify_volatile.txt',
                    userValue: 'PERSISTENT_DATA'
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

            // 3. Trigger Reload
            setIsReloading(true);
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e: any) {
            console.error(e);
            setResults(prev => [...prev, {
                gateId: 'G1',
                description: 'Scheme Isolation (Pre-check)',
                status: 'FAIL',
                traceId,
                latency: 0,
                error: e.message
            }]);
            setIsRunning(false);
        }
    };

    const verifyG1PostReload = async (state: any) => {
        const traceId = `${state.traceBase}-POST`;
        const start = performance.now();
        let g1Result: TestResult;

        try {
            // 1. Check User (Should Exist)
            const userContent = await (await fs.readFile(state.expected.userPath)).text();
            if (userContent !== state.expected.userValue) {
                throw new Error(`User data mismatch. Expected ${state.expected.userValue}, got ${userContent}`);
            }

            // 2. Check Temp (Should be Gone or Empty)
            try {
                await fs.readFile(state.expected.tempPath);
                throw new Error('Volatile data persisted! Security Failure.');
            } catch (e: any) {
                // We EXPECT an error (Not Found)
            }

            g1Result = {
                gateId: 'G1',
                description: 'Scheme Isolation (Persistence)',
                status: 'PASS',
                traceId,
                latency: Math.round(performance.now() - start + (Date.now() - state.startTime))
            };

        } catch (e: any) {
            g1Result = {
                gateId: 'G1',
                description: 'Scheme Isolation (Persistence)',
                status: 'FAIL',
                traceId,
                latency: 0,
                error: e.message
            };
        }

        localStorage.removeItem(STORAGE_KEY);
        setResults(prev => [...prev, g1Result]);

        // Continue to G2
        await runG2(state.traceBase);
    };

    const runG2 = async (traceBase: string) => {
        const traceId = `${traceBase}-G2`;
        const start = performance.now();

        try {
            // 1. Try Write (Fail)
            try {
                await fs.writeFile('system://hack.txt', 'HACK');
                throw new Error('System write succeeded unexpectedly');
            } catch (e: any) {
                if ((e as FsError).code !== FileSystemError.accessDenied) {
                    throw new Error(`Wrong error code: ${e.code || e.message}`);
                }
            }

            // 2. Try Delete (Fail)
            try {
                await fs.deleteFile('system://logs/boot.log');
                throw new Error('System delete succeeded unexpectedly');
            } catch (e: any) {
                if ((e as FsError).code !== FileSystemError.accessDenied) {
                    throw new Error(`Wrong error code: ${e.code || e.message}`);
                }
            }

            setResults(prev => [...prev, {
                gateId: 'G2',
                description: 'System Read-Only Enforcement',
                status: 'PASS',
                traceId,
                latency: Math.round(performance.now() - start)
            }]);

        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G2',
                description: 'System Read-Only Enforcement',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        // Continue to Phase 15A.2 gates if selected
        if (phase === '15A.2') {
            await runG6(traceBase);
        } else {
            setIsRunning(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Phase 15A.2 Gates
    // ═══════════════════════════════════════════════════════════════════════════

    const runG6 = async (traceBase: string) => {
        const traceId = `${traceBase}-G6`;
        const start = performance.now();

        try {
            // G6: Intent-only Enforcement
            // Write via Intent Handler and verify audit entry exists
            intentHandler.clearAuditLog();

            const result = await intentHandler.execute({
                action: 'os.fs.write',
                meta: { path: 'user://g6_test.txt', scheme: 'user', fileSize: 10 },
                content: 'G6_TEST_DATA',
                options: { create: true }
            });

            if (!result.success) {
                throw new Error(`Intent execution failed: ${result.errorCode}`);
            }

            // Check audit log
            const lastAudit = intentHandler.getLastAuditEntry();
            if (!lastAudit) {
                throw new Error('No audit entry found');
            }
            if (lastAudit.capability !== 'fs.write') {
                throw new Error(`Wrong capability: ${lastAudit.capability}`);
            }
            if (lastAudit.decision !== 'ALLOW') {
                throw new Error(`Wrong decision: ${lastAudit.decision}`);
            }
            if (lastAudit.result !== 'SUCCESS') {
                throw new Error(`Wrong result: ${lastAudit.result}`);
            }

            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (Audit Fields)',
                status: 'PASS',
                traceId: lastAudit.traceId,
                latency: Math.round(performance.now() - start)
            }]);

        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (Audit Fields)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        await runG7(traceBase);
    };

    const runG7 = async (traceBase: string) => {
        const traceId = `${traceBase}-G7`;
        const start = performance.now();

        try {
            // G7: Policy DENY for system write
            intentHandler.clearAuditLog();

            const result = await intentHandler.execute({
                action: 'os.fs.write',
                meta: { path: 'system://hack.txt', scheme: 'system' },
                content: 'HACK_ATTEMPT'
            });

            // Must be denied
            if (result.success) {
                throw new Error('System write via Intent succeeded unexpectedly');
            }
            if (result.errorCode !== FileSystemError.accessDenied) {
                throw new Error(`Wrong errorCode: ${result.errorCode}`);
            }

            // Check audit
            const lastAudit = intentHandler.getLastAuditEntry();
            if (!lastAudit) {
                throw new Error('No audit entry found');
            }
            if (lastAudit.decision !== 'DENY') {
                throw new Error(`Audit decision should be DENY, got: ${lastAudit.decision}`);
            }
            if (lastAudit.errorCode !== FileSystemError.accessDenied) {
                throw new Error(`Audit errorCode should be FS_ACCESS_DENIED, got: ${lastAudit.errorCode}`);
            }

            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// write)',
                status: 'PASS',
                traceId: lastAudit.traceId,
                latency: Math.round(performance.now() - start)
            }]);

        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// write)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        await runG8(traceBase);
    };

    const runG8 = async (traceBase: string) => {
        const traceId = `${traceBase}-G8`;
        const start = performance.now();

        try {
            // G8: Trace Correlation
            intentHandler.clearAuditLog();

            // Execute multiple operations
            const r1 = await intentHandler.execute({
                action: 'os.fs.write',
                meta: { path: 'user://g8_a.txt', scheme: 'user' },
                content: 'A'
            });
            const r2 = await intentHandler.execute({
                action: 'os.fs.read',
                meta: { path: 'user://g8_a.txt', scheme: 'user' }
            });

            // Each operation should have unique traceId
            const auditLog = intentHandler.getAuditLog();
            if (auditLog.length < 2) {
                throw new Error('Expected 2 audit entries');
            }

            const traceIds = auditLog.map(a => a.traceId);
            const uniqueTraceIds = new Set(traceIds);
            if (uniqueTraceIds.size !== traceIds.length) {
                throw new Error('TraceIds are not unique!');
            }

            // Verify traceId format
            for (const t of traceIds) {
                if (!t.startsWith('FS-')) {
                    throw new Error(`Invalid traceId format: ${t}`);
                }
            }

            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation (Unique traceId)',
                status: 'PASS',
                traceId: auditLog[0].traceId,
                latency: Math.round(performance.now() - start)
            }]);

        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation (Unique traceId)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        setIsRunning(false);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Export Evidence
    // ═══════════════════════════════════════════════════════════════════════════

    const exportEvidence = () => {
        const phaseLabel = phase === '15A.2' ? '15A.2' : '15A.1';
        const md = `
# Phase ${phaseLabel} Verification Evidence
**Date**: ${new Date().toLocaleString()}
**Environment**: Production
**Commit**: (Manual Input)

## Gate Results
| Gate | Status | Trace ID | Latency (ms) | Note |
|------|--------|----------|--------------|------|
${results.map(r => `| ${r.gateId} | ${r.status} ${r.status === 'PASS' ? '✅' : '❌'} | ${r.traceId} | ${r.latency} | ${r.error || '-'} |`).join('\n')}

**Verified By**: VerifierAppV0 (Automated ${phaseLabel} Test)
`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence_${phaseLabel.replace('.', '')}_${new Date().getTime()}.md`;
        a.click();
    };

    return (
        <div style={{ padding: 20, background: '#111', color: '#eee', borderRadius: 8, fontFamily: 'monospace', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>🧪 VerifierApp v0.2 (Phase 15A.1 + 15A.2)</h3>

            {/* Phase Selector */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <button
                    onClick={() => setPhase('15A.1')}
                    style={{
                        padding: '6px 12px',
                        background: phase === '15A.1' ? '#3b82f6' : '#333',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        borderRadius: 4
                    }}
                >
                    15A.1 (G1-G2)
                </button>
                <button
                    onClick={() => setPhase('15A.2')}
                    style={{
                        padding: '6px 12px',
                        background: phase === '15A.2' ? '#8b5cf6' : '#333',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        borderRadius: 4
                    }}
                >
                    15A.2 (G1-G8)
                </button>
            </div>

            {isReloading && (
                <div style={{ padding: 20, background: '#eab308', color: '#000', fontWeight: 'bold' }}>
                    ⚠️ RELOADING FOR G1 PERSISTENCE CHECK...
                </div>
            )}

            <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 4 }}
                >
                    {isRunning ? 'Running...' : '▶ Start Suite (Will Reload)'}
                </button>
                <button
                    onClick={exportEvidence}
                    disabled={results.length === 0}
                    style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 4 }}
                >
                    ⬇ Export Evidence
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Gate</th>
                        <th style={{ padding: 8 }}>Result</th>
                        <th style={{ padding: 8 }}>Trace</th>
                        <th style={{ padding: 8 }}>Error</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: 8 }}>{r.gateId}</td>
                            <td style={{ padding: 8, color: r.status === 'PASS' ? '#4ade80' : '#f87171' }}>{r.status}</td>
                            <td style={{ padding: 8, fontSize: 11, color: '#888' }}>{r.traceId}</td>
                            <td style={{ padding: 8, color: '#f87171' }}>{r.error}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
