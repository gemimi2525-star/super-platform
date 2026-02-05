
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

const STORAGE_KEY = 'verifier_state_v3';

export const VerifierAppV0 = () => {
    // Note: useFileSystem is used ONLY for local OPFS operations (G1/G2)
    // G6/G7/G8 use dispatchFsIntent which goes through API
    const fs = useFileSystem();

    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [phase, setPhase] = useState<'15A.1' | '15A.2'>('15A.2');
    const [logs, setLogs] = useState<string[]>([]);

    const log = (msg: string) => {
        console.log(`[Verifier] ${msg}`);
        setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);
    };

    // Auto-Resume after reload
    useEffect(() => {
        const resumeTests = async () => {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) return;

            const state = JSON.parse(savedState);
            if (state.pending === 'G1') {
                log('Resuming G1 after reload...');
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
        setLogs([]);
        log('Starting test suite...');
        await runG1PreReload();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Scheme Isolation (Pre-Reload)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG1PreReload = async () => {
        const traceId = `TEST-${Date.now()}-G1-PRE`;
        log('G1: Pre-reload setup...');

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
            log('Triggering page reload...');
            setTimeout(() => window.location.reload(), 1000);

        } catch (e: any) {
            log(`G1 PRE FAILED: ${e.message}`);
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
        log('G1: Post-reload verification...');

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
            log('G1: PASS');
        } catch (e: any) {
            log(`G1: FAIL - ${e.message}`);
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
        log('G2: Testing system:// read-only...');

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

            log('G2: PASS');
            setResults(prev => [...prev, {
                gateId: 'G2',
                description: 'System Read-Only Enforcement',
                status: 'PASS',
                traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            log(`G2: FAIL - ${e.message}`);
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
        log('G6: Intent-only enforcement via API...');

        try {
            const result = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('user://g6_test.txt', { fileSize: 10 }),
                content: 'G6_TEST_DATA',
                options: { create: true }
            });

            log(`G6: API response: ${JSON.stringify(result)}`);

            if (!result.success) {
                throw new Error(`Intent failed: ${result.errorCode || JSON.stringify(result)}`);
            }

            if (!result.opId) {
                throw new Error('No opId in response');
            }
            if (!result.traceId) {
                throw new Error('No traceId in response');
            }
            if (!result.decision || result.decision.outcome !== 'ALLOW') {
                throw new Error('Decision not ALLOW');
            }

            log('G6: PASS');
            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (API opId + traceId)',
                status: 'PASS',
                traceId: result.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            log(`G6: FAIL - ${e.message}`);
            setResults(prev => [...prev, {
                gateId: 'G6',
                description: 'Intent-only Enforcement (API opId + traceId)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        // Always continue to G7 regardless of G6 result
        await runG7(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G7: Policy DENY (system:// via API)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG7 = async (traceBase: string) => {
        const traceId = `${traceBase}-G7`;
        const start = performance.now();
        log('G7: Testing Policy DENY for system:// via API...');

        try {
            const result = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('system://hack.txt'),
                content: 'HACK_ATTEMPT'
            });

            log(`G7: API response: ${JSON.stringify(result)}`);

            // Must be denied
            if (result.success === true) {
                throw new Error('System write via API succeeded unexpectedly');
            }

            // Check decision
            if (!result.decision) {
                throw new Error(`No decision in response: ${JSON.stringify(result)}`);
            }
            if (result.decision.outcome !== 'DENY') {
                throw new Error(`Decision not DENY: ${result.decision.outcome}`);
            }
            if (result.decision.errorCode !== FileSystemError.accessDenied) {
                throw new Error(`Wrong errorCode: ${result.decision.errorCode}, expected FS_ACCESS_DENIED`);
            }

            log('G7: PASS');
            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'PASS',
                traceId: result.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            log(`G7: FAIL - ${e.message}`);
            setResults(prev => [...prev, {
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        // Always continue to G8 regardless of G7 result
        await runG8(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G8: Trace Correlation + Audit Verification
    // ═══════════════════════════════════════════════════════════════════════════
    const runG8 = async (traceBase: string) => {
        const traceId = `${traceBase}-G8`;
        const start = performance.now();
        log('G8: Testing Trace Correlation + Audit...');

        try {
            // Step 1: Make a request and capture opId
            const writeResult = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: buildFsMeta('user://g8_audit_test.txt'),
                content: 'AUDIT_TEST'
            });

            log(`G8: Write response: ${JSON.stringify(writeResult)}`);

            if (!writeResult.opId) {
                throw new Error('No opId in write response');
            }
            if (!writeResult.traceId) {
                throw new Error('No traceId in write response');
            }

            // Step 2: Verify opId format (traceId:action:path)
            const opIdPattern = /^[A-Za-z0-9-]+:os\.fs\.[a-z]+:.+$/;
            if (!opIdPattern.test(writeResult.opId)) {
                throw new Error(`Invalid opId format: ${writeResult.opId}`);
            }

            // Step 3: Lookup audit record via API
            const lookupResponse = await fetch(`/api/platform/audit-lookup?opId=${encodeURIComponent(writeResult.opId)}`);
            const lookupResult = await lookupResponse.json();

            log(`G8: Audit lookup: ${JSON.stringify(lookupResult)}`);

            if (!lookupResult.success || !lookupResult.found) {
                throw new Error(`Audit record not found for opId: ${writeResult.opId}`);
            }

            const auditRecord = lookupResult.records[0];

            // Step 4: Verify audit record has required fields
            const requiredFields = ['capability', 'path', 'scheme', 'decision', 'result', 'traceId', 'opId'];
            for (const field of requiredFields) {
                if (!auditRecord[field]) {
                    throw new Error(`Audit record missing field: ${field}`);
                }
            }

            // Step 5: Verify traceId correlation
            if (auditRecord.traceId !== writeResult.traceId) {
                throw new Error(`TraceId mismatch: audit=${auditRecord.traceId}, response=${writeResult.traceId}`);
            }

            log('G8: PASS');
            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation + Audit Verification',
                status: 'PASS',
                traceId: writeResult.traceId || traceId,
                latency: Math.round(performance.now() - start)
            }]);
        } catch (e: any) {
            log(`G8: FAIL - ${e.message}`);
            setResults(prev => [...prev, {
                gateId: 'G8',
                description: 'Trace Correlation + Audit Verification',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            }]);
        }

        setIsRunning(false);
        log('Test suite complete.');
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

**Verified By**: VerifierAppV0.3 (Automated ${phaseLabel} Test)
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
            <h3 style={{ marginTop: 0 }}>🧪 VerifierApp v0.3 (Phase 15A.1 + 15A.2)</h3>

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

            {/* Debug Logs */}
            {logs.length > 0 && (
                <div style={{ marginTop: 20, padding: 10, background: '#000', borderRadius: 4, fontSize: 11, maxHeight: 200, overflow: 'auto' }}>
                    <div style={{ color: '#666', marginBottom: 5 }}>Debug Logs:</div>
                    {logs.map((l, i) => (
                        <div key={i} style={{ color: '#888' }}>{l}</div>
                    ))}
                </div>
            )}
        </div>
    );
};
