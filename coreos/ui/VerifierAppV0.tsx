
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFileSystem } from '../../lib/filesystem/FileSystemProvider';
import { FileSystemError, FsError } from '../../lib/filesystem/types';

interface TestResult {
    gateId: string;
    description: string;
    status: 'PASS' | 'FAIL';
    traceId: string;
    latency: number;
    error?: string;
}

const STORAGE_KEY = 'verifier_state_v4';

// Generate a unique trace for this test run (not using sessionStorage)
function generateTestTrace(): string {
    return `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const VerifierAppV0 = () => {
    const fs = useFileSystem();

    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [phase, setPhase] = useState<'15A.1' | '15A.2'>('15A.2');
    const [logs, setLogs] = useState<string[]>([]);

    // Use ref to ensure we don't lose state during async operations
    const testTraceRef = useRef<string>('');

    const log = (msg: string) => {
        const timestamp = new Date().toISOString().slice(11, 19);
        console.log(`[Verifier] ${msg}`);
        setLogs(prev => [...prev, `${timestamp} ${msg}`]);
    };

    const addResult = (result: TestResult) => {
        log(`${result.gateId}: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
        setResults(prev => [...prev, result]);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INLINE INTENT DISPATCHER (Bypass sessionStorage trace issue)
    // ═══════════════════════════════════════════════════════════════════════════
    const callFsIntent = async (
        action: string,
        path: string,
        content?: string,
        traceId?: string
    ): Promise<any> => {
        const scheme = path.startsWith('system://') ? 'system'
            : path.startsWith('temp://') ? 'temp' : 'user';

        const useTrace = traceId || testTraceRef.current;

        const response = await fetch('/api/platform/fs-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': useTrace,
            },
            body: JSON.stringify({
                action,
                meta: { path, scheme },
                content,
            }),
        });

        const data = await response.json();
        return { ...data, httpStatus: response.status };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Auto-Resume after reload
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const resumeTests = async () => {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) return;

            try {
                const state = JSON.parse(savedState);
                if (state.pending === 'G1') {
                    log('Resuming G1 after reload...');
                    testTraceRef.current = state.traceBase;
                    setIsRunning(true);
                    setPhase(state.phase || '15A.1');
                    await verifyG1PostReload(state);
                }
            } catch (e) {
                log('Error resuming: ' + e);
                localStorage.removeItem(STORAGE_KEY);
            }
        };
        resumeTests();
    }, [fs]);

    const runTests = async () => {
        // Generate fresh trace for this entire test run
        testTraceRef.current = generateTestTrace();
        log(`Starting test suite with trace: ${testTraceRef.current}`);

        setIsRunning(true);
        setResults([]);
        setLogs([]);
        await runG1PreReload();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Scheme Isolation (Pre-Reload)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG1PreReload = async () => {
        const traceId = `${testTraceRef.current}-G1`;
        log('G1: Pre-reload setup...');

        try {
            await fs.writeFile('user://verify_persist.txt', 'PERSISTENT_DATA', { create: true });
            await fs.writeFile('temp://verify_volatile.txt', 'VOLATILE_DATA', { create: true });

            const state = {
                pending: 'G1',
                phase,
                traceBase: testTraceRef.current,
                startTime: Date.now(),
                expected: {
                    userPath: 'user://verify_persist.txt',
                    tempPath: 'temp://verify_volatile.txt',
                    userValue: 'PERSISTENT_DATA'
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

            setIsReloading(true);
            log('Triggering reload in 1s...');
            setTimeout(() => window.location.reload(), 1000);

        } catch (e: any) {
            addResult({
                gateId: 'G1',
                description: 'Scheme Isolation (Pre-check)',
                status: 'FAIL',
                traceId,
                latency: 0,
                error: e.message
            });
            setIsRunning(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Scheme Isolation (Post-Reload)
    // ═══════════════════════════════════════════════════════════════════════════
    const verifyG1PostReload = async (state: any) => {
        const traceId = `${state.traceBase}-G1`;
        const start = performance.now();
        log('G1: Post-reload verification...');

        try {
            const userContent = await (await fs.readFile(state.expected.userPath)).text();
            if (userContent !== state.expected.userValue) {
                throw new Error('User data mismatch');
            }

            let tempExists = false;
            try {
                await fs.readFile(state.expected.tempPath);
                tempExists = true;
            } catch { }

            if (tempExists) {
                throw new Error('Volatile data persisted after reload!');
            }

            addResult({
                gateId: 'G1',
                description: 'Scheme Isolation (Persistence)',
                status: 'PASS',
                traceId,
                latency: Math.round(performance.now() - start + (Date.now() - state.startTime))
            });
        } catch (e: any) {
            addResult({
                gateId: 'G1',
                description: 'Scheme Isolation (Persistence)',
                status: 'FAIL',
                traceId,
                latency: 0,
                error: e.message
            });
        }

        localStorage.removeItem(STORAGE_KEY);

        // IMPORTANT: Continue to next gate
        await runG2(state.traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G2: System Read-Only (Local FS)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG2 = async (traceBase: string) => {
        const traceId = `${traceBase}-G2`;
        const start = performance.now();
        log('G2: Testing system:// read-only (local FS)...');

        try {
            // Test 1: Write should fail
            try {
                await fs.writeFile('system://hack.txt', 'HACK');
                throw new Error('System write succeeded unexpectedly');
            } catch (e: any) {
                if ((e as FsError).code !== FileSystemError.accessDenied) {
                    throw new Error(`Wrong error code: ${(e as FsError).code || e.message}`);
                }
            }

            // Test 2: Delete should fail
            try {
                await fs.deleteFile('system://logs/test.log');
                throw new Error('System delete succeeded unexpectedly');
            } catch (e: any) {
                if ((e as FsError).code !== FileSystemError.accessDenied) {
                    throw new Error(`Wrong error code: ${(e as FsError).code || e.message}`);
                }
            }

            addResult({
                gateId: 'G2',
                description: 'System Read-Only Enforcement (Local)',
                status: 'PASS',
                traceId,
                latency: Math.round(performance.now() - start)
            });
        } catch (e: any) {
            addResult({
                gateId: 'G2',
                description: 'System Read-Only Enforcement (Local)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            });
        }

        // Continue based on phase
        if (phase === '15A.2') {
            await runG6(traceBase);
        } else {
            log('Test suite complete (15A.1 mode).');
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

        let g6Passed = false;

        try {
            const result = await callFsIntent('os.fs.write', 'user://g6_test.txt', 'G6_DATA', traceId);
            log(`G6 response: success=${result.success}, opId=${result.opId}, traceId=${result.traceId}`);

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
                throw new Error(`Decision not ALLOW: ${JSON.stringify(result.decision)}`);
            }

            addResult({
                gateId: 'G6',
                description: 'Intent-only Enforcement (API)',
                status: 'PASS',
                traceId: result.traceId,
                latency: Math.round(performance.now() - start)
            });
            g6Passed = true;
        } catch (e: any) {
            addResult({
                gateId: 'G6',
                description: 'Intent-only Enforcement (API)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            });
        }

        // ALWAYS continue to G7
        log('Continuing to G7...');
        await runG7(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G7: Policy DENY (system:// via API)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG7 = async (traceBase: string) => {
        const traceId = `${traceBase}-G7`;
        const start = performance.now();
        log('G7: Policy DENY for system:// via API...');

        try {
            const result = await callFsIntent('os.fs.write', 'system://hack.txt', 'HACK', traceId);
            log(`G7 response: success=${result.success}, httpStatus=${result.httpStatus}, decision=${JSON.stringify(result.decision)}`);

            // MUST be denied
            if (result.success === true) {
                throw new Error('System write via API SUCCEEDED (should be DENIED)');
            }

            // Check decision exists
            if (!result.decision) {
                throw new Error(`No decision in response: ${JSON.stringify(result)}`);
            }

            // Check outcome is DENY
            if (result.decision.outcome !== 'DENY') {
                throw new Error(`Decision is ${result.decision.outcome}, expected DENY`);
            }

            // Check errorCode
            if (result.decision.errorCode !== FileSystemError.accessDenied) {
                throw new Error(`ErrorCode is ${result.decision.errorCode}, expected ${FileSystemError.accessDenied}`);
            }

            addResult({
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'PASS',
                traceId: result.traceId || traceId,
                latency: Math.round(performance.now() - start)
            });
        } catch (e: any) {
            addResult({
                gateId: 'G7',
                description: 'Policy DENY (system:// via API)',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            });
        }

        // ALWAYS continue to G8
        log('Continuing to G8...');
        await runG8(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G8: Trace Correlation + Audit Verification
    // ═══════════════════════════════════════════════════════════════════════════
    const runG8 = async (traceBase: string) => {
        const traceId = `${traceBase}-G8`;
        const start = performance.now();
        log('G8: Trace Correlation + Audit...');

        try {
            // Step 1: Write via intent API
            const writeResult = await callFsIntent('os.fs.write', 'user://g8_audit.txt', 'AUDIT_TEST', traceId);
            log(`G8 write: opId=${writeResult.opId}, traceId=${writeResult.traceId}`);

            if (!writeResult.opId) {
                throw new Error('No opId in write response');
            }
            if (!writeResult.traceId) {
                throw new Error('No traceId in write response');
            }

            // Step 2: Verify opId format (traceId:action:path)
            const expectedOpIdPrefix = `${writeResult.traceId}:os.fs.write:`;
            if (!writeResult.opId.startsWith(expectedOpIdPrefix)) {
                throw new Error(`opId format incorrect: ${writeResult.opId}, expected prefix: ${expectedOpIdPrefix}`);
            }

            // Step 3: Lookup audit record
            const lookupResponse = await fetch(`/api/platform/audit-lookup?opId=${encodeURIComponent(writeResult.opId)}`);
            const lookupData = await lookupResponse.json();
            log(`G8 audit lookup: found=${lookupData.found}, count=${lookupData.count}`);

            if (!lookupData.success) {
                throw new Error(`Audit lookup failed: ${JSON.stringify(lookupData)}`);
            }
            if (!lookupData.found || lookupData.count === 0) {
                throw new Error(`Audit record not found for opId: ${writeResult.opId}`);
            }

            const audit = lookupData.records[0];

            // Step 4: Verify required fields
            const required = ['capability', 'path', 'scheme', 'decision', 'result', 'traceId', 'opId'];
            const missing = required.filter(f => !audit[f]);
            if (missing.length > 0) {
                throw new Error(`Audit missing fields: ${missing.join(', ')}`);
            }

            // Step 5: Verify trace correlation
            if (audit.traceId !== writeResult.traceId) {
                throw new Error(`TraceId mismatch: audit=${audit.traceId}, response=${writeResult.traceId}`);
            }

            addResult({
                gateId: 'G8',
                description: 'Trace Correlation + Audit',
                status: 'PASS',
                traceId: writeResult.traceId,
                latency: Math.round(performance.now() - start)
            });
        } catch (e: any) {
            addResult({
                gateId: 'G8',
                description: 'Trace Correlation + Audit',
                status: 'FAIL',
                traceId,
                latency: Math.round(performance.now() - start),
                error: e.message
            });
        }

        log('===== TEST SUITE COMPLETE =====');
        setIsRunning(false);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Export Evidence
    // ═══════════════════════════════════════════════════════════════════════════
    const exportEvidence = () => {
        const md = `
# Phase ${phase} Verification Evidence
**Date**: ${new Date().toLocaleString()}
**Environment**: Production
**Test Trace**: ${testTraceRef.current}

## Gate Results
| Gate | Status | Trace ID | Latency (ms) | Note |
|------|--------|----------|--------------|------|
${results.map(r => `| ${r.gateId} | ${r.status} ${r.status === 'PASS' ? '✅' : '❌'} | ${r.traceId} | ${r.latency} | ${r.error || '-'} |`).join('\n')}

**Verified By**: VerifierAppV0.4 (Automated ${phase} Test)
`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence_${phase.replace('.', '')}_${Date.now()}.md`;
        a.click();
    };

    return (
        <div style={{ padding: 20, background: '#111', color: '#eee', borderRadius: 8, fontFamily: 'monospace', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>🧪 VerifierApp v0.4 (Phase 15A.2 Complete)</h3>

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
                <div style={{ padding: 20, background: '#eab308', color: '#000', fontWeight: 'bold', borderRadius: 4 }}>
                    ⚠️ RELOADING FOR G1 PERSISTENCE CHECK...
                </div>
            )}

            <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 4, opacity: isRunning ? 0.5 : 1 }}
                >
                    {isRunning ? '⏳ Running...' : '▶ Start Suite (Will Reload)'}
                </button>
                <button
                    onClick={exportEvidence}
                    disabled={results.length === 0}
                    style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 4, opacity: results.length === 0 ? 0.5 : 1 }}
                >
                    ⬇ Export Evidence
                </button>
            </div>

            {/* Results Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Gate</th>
                        <th style={{ padding: 8 }}>Status</th>
                        <th style={{ padding: 8 }}>Trace</th>
                        <th style={{ padding: 8 }}>Error</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length === 0 && !isRunning && (
                        <tr>
                            <td colSpan={4} style={{ padding: 16, color: '#888', textAlign: 'center' }}>
                                No results yet. Click "Start Suite" to begin.
                            </td>
                        </tr>
                    )}
                    {results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: 8, fontWeight: 'bold' }}>{r.gateId}</td>
                            <td style={{ padding: 8, color: r.status === 'PASS' ? '#4ade80' : '#f87171' }}>
                                {r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
                            </td>
                            <td style={{ padding: 8, fontSize: 10, color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.traceId}
                            </td>
                            <td style={{ padding: 8, color: '#f87171', fontSize: 11 }}>{r.error || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Debug Logs */}
            {logs.length > 0 && (
                <div style={{ marginTop: 20, padding: 10, background: '#000', borderRadius: 4, fontSize: 11, maxHeight: 250, overflow: 'auto' }}>
                    <div style={{ color: '#666', marginBottom: 5, fontWeight: 'bold' }}>📋 Debug Logs ({logs.length}):</div>
                    {logs.map((l, i) => (
                        <div key={i} style={{ color: l.includes('FAIL') ? '#f87171' : l.includes('PASS') ? '#4ade80' : '#aaa', fontFamily: 'monospace' }}>
                            {l}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
