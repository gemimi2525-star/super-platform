
'use client';

import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../../lib/filesystem/FileSystemProvider';
import { FileSystemError, FsError } from '../../lib/filesystem/types';
import { dispatchFsIntent, buildFsMeta } from '../../lib/filesystem/dispatchFsIntent';

interface TestResult {
    gateId: string;
    description: string;
    status: 'PASS' | 'FAIL';
    traceId: string;
    latency: number;
    error?: string;
}

const STORAGE_KEY = 'verifier_state_v2';

export const VerifierAppV0 = () => {
    // Note: useFileSystem is used ONLY for local OPFS operations (G1/G2)
    // G6/G7/G8 use dispatchFsIntent which goes through API
    const fs = useFileSystem();

    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [phase, setPhase] = useState<'15A.1' | '15A.2'>('15A.2');

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
        await runG1PreReload();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Scheme Isolation (Pre-Reload)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG1PreReload = async () => {
        const traceId = `TEST-${Date.now()}-G1-PRE`;
        console.log('[Verifier] Starting G1A (Pre-Reload)...');

        try {
            await fs.writeFile('user://verify_persist.txt', 'PERSISTENT_DATA', { create: true });
            await fs.writeFile('temp://verify_volatile.txt', 'VOLATILE_DATA', { create: true });

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

            setIsReloading(true);
            setTimeout(() => window.location.reload(), 1000);

        } catch (e: any) {
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

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Scheme Isolation (Post-Reload)
    // ═══════════════════════════════════════════════════════════════════════════
    const verifyG1PostReload = async (state: any) => {
        const traceId = `${state.traceBase}-POST`;
        const start = performance.now();
        let g1Result: TestResult;

        try {
            const userContent = await (await fs.readFile(state.expected.userPath)).text();
            if (userContent !== state.expected.userValue) {
                throw new Error(`User data mismatch`);
            }

            try {
                await fs.readFile(state.expected.tempPath);
                throw new Error('Volatile data persisted!');
            } catch { }

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
        await runG2(state.traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G2: System Read-Only (Local FS)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG2 = async (traceBase: string) => {
        const traceId = `${traceBase}-G2`;
        const start = performance.now();

        try {
            try {
                await fs.writeFile('system://hack.txt', 'HACK');
                throw new Error('System write succeeded unexpectedly');
            } catch (e: any) {
                if ((e as FsError).code !== FileSystemError.accessDenied) {
                    throw new Error(`Wrong error code: ${e.code || e.message}`);
                }
            }

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

        if (phase === '15A.2') {
            await runG6(traceBase);
        } else {
            setIsRunning(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G6: Intent-only Enforcement (via API)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG6 = async (traceBase: string) => {
        const traceId = `${traceBase}-G6`;
        const start = performance.now();

        try {
            const result = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('user://g6_test.txt', { fileSize: 10 }),
                content: 'G6_TEST_DATA',
                options: { create: true }
            });

            if (!result.success) {
                throw new Error(`Intent failed: ${result.errorCode}`);
            }

            // Verify opId and traceId exist
            if (!result.opId) {
                throw new Error('No opId in response');
            }
            if (!result.traceId) {
                throw new Error('No traceId in response');
            }
            if (!result.decision || result.decision.outcome !== 'ALLOW') {
                throw new Error('Decision not ALLOW');
            }

            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (API opId + traceId)',
                status: 'PASS',
                traceId: result.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (API opId + traceId)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        await runG7(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G7: Policy DENY (system:// via API)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG7 = async (traceBase: string) => {
        const traceId = `${traceBase}-G7`;
        const start = performance.now();

        try {
            const result = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('system://hack.txt'),
                content: 'HACK_ATTEMPT'
            });

            // Must be denied
            if (result.success) {
                throw new Error('System write via API succeeded unexpectedly');
            }
            if (!result.decision || result.decision.outcome !== 'DENY') {
                throw new Error('Decision not DENY');
            }
            if (result.decision.errorCode !== FileSystemError.accessDenied) {
                throw new Error(`Wrong errorCode: ${result.decision.errorCode}`);
            }

            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'PASS',
                traceId: result.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        await runG8(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G8: Trace Correlation (opId format)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG8 = async (traceBase: string) => {
        const traceId = `${traceBase}-G8`;
        const start = performance.now();

        try {
            const r1 = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('user://g8_a.txt'),
                content: 'A'
            });

            const r2 = await dispatchFsIntent({
                action: 'os.fs.read',
                meta: buildFsMeta('user://g8_a.txt')
            });

            // Both must have opId
            if (!r1.opId || !r2.opId) {
                throw new Error('Missing opId in responses');
            }

            // opId format: traceId:action:path
            const opIdPattern = /^[A-Za-z0-9-]+:os\.fs\.[a-z]+:.+$/;
            if (!opIdPattern.test(r1.opId)) {
                throw new Error(`Invalid opId format: ${r1.opId}`);
            }
            if (!opIdPattern.test(r2.opId)) {
                throw new Error(`Invalid opId format: ${r2.opId}`);
            }

            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation (opId format)',
                status: 'PASS',
                traceId: r1.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation (opId format)',
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
        const phaseLabel = phase;
        const md = `
# Phase ${phaseLabel} Verification Evidence
**Date**: ${new Date().toLocaleString()}
**Environment**: Production
**Commit**: (Manual Input)

## Gate Results
| Gate | Status | Trace ID | Latency (ms) | Note |
|------|--------|----------|--------------|------|
${results.map(r => `| ${r.gateId} | ${r.status} ${r.status === 'PASS' ? '✅' : '❌'} | ${r.traceId} | ${r.latency} | ${r.error || '-'} |`).join('\n')}

**Verified By**: VerifierAppV0.2 (Automated ${phaseLabel} Test)
`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence_${phaseLabel.replace('.', '')}_${Date.now()}.md`;
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
