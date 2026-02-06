
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

const STORAGE_KEY = 'verifier_state_v5';

function generateTestTrace(): string {
    return `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

type Phase = '15A.1' | '15A.2' | '15A.3';

export const VerifierAppV0 = () => {
    const fs = useFileSystem();

    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [phase, setPhase] = useState<Phase>('15A.3');
    const [logs, setLogs] = useState<string[]>([]);
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
    // INLINE API DISPATCHERS
    // ═══════════════════════════════════════════════════════════════════════════
    const callFsIntent = async (action: string, path: string, content?: string, traceId?: string): Promise<any> => {
        const scheme = path.startsWith('system://') ? 'system' : path.startsWith('temp://') ? 'temp' : 'user';
        const useTrace = traceId || testTraceRef.current;
        const response = await fetch('/api/platform/fs-intents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-trace-id': useTrace },
            body: JSON.stringify({ action, meta: { path, scheme }, content }),
        });
        const data = await response.json();
        return { ...data, httpStatus: response.status };
    };

    const callFsSecurity = async (policy: 'soft_lock' | 'clear', openHandlesBefore: number, traceId?: string): Promise<any> => {
        const useTrace = traceId || testTraceRef.current;
        const response = await fetch('/api/platform/fs-security', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-trace-id': useTrace },
            body: JSON.stringify({ action: `os.fs.logout.${policy}`, openHandlesBefore }),
        });
        return response.json();
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
        testTraceRef.current = generateTestTrace();
        log(`Starting ${phase} suite with trace: ${testTraceRef.current}`);
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
                pending: 'G1', phase, traceBase: testTraceRef.current, startTime: Date.now(),
                expected: { userPath: 'user://verify_persist.txt', tempPath: 'temp://verify_volatile.txt', userValue: 'PERSISTENT_DATA' }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setIsReloading(true);
            log('Triggering reload in 1s...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (e: any) {
            addResult({ gateId: 'G1', description: 'Setup', status: 'FAIL', traceId, latency: 0, error: e.message });
            setIsRunning(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G1: Post-Reload
    // ═══════════════════════════════════════════════════════════════════════════
    const verifyG1PostReload = async (state: any) => {
        const traceId = `${state.traceBase}-G1`;
        const start = performance.now();
        log('G1: Post-reload verification...');
        try {
            const userContent = await (await fs.readFile(state.expected.userPath)).text();
            if (userContent !== state.expected.userValue) throw new Error('User data mismatch');
            let tempExists = false;
            try { await fs.readFile(state.expected.tempPath); tempExists = true; } catch { }
            if (tempExists) throw new Error('Volatile data persisted!');
            addResult({ gateId: 'G1', description: 'Scheme Isolation', status: 'PASS', traceId, latency: Math.round(performance.now() - start + (Date.now() - state.startTime)) });
        } catch (e: any) {
            addResult({ gateId: 'G1', description: 'Scheme Isolation', status: 'FAIL', traceId, latency: 0, error: e.message });
        }
        localStorage.removeItem(STORAGE_KEY);
        await runG2(state.traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G2: System Read-Only (Local)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG2 = async (traceBase: string) => {
        const traceId = `${traceBase}-G2`;
        const start = performance.now();
        log('G2: System read-only...');
        try {
            try { await fs.writeFile('system://hack.txt', 'HACK'); throw new Error('System write succeeded'); }
            catch (e: any) { if ((e as FsError).code !== FileSystemError.accessDenied) throw new Error(`Wrong error: ${(e as FsError).code || e.message}`); }
            addResult({ gateId: 'G2', description: 'System Read-Only', status: 'PASS', traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G2', description: 'System Read-Only', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        if (phase === '15A.1') { setIsRunning(false); return; }
        await runG6(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G6: Intent-only Enforcement
    // ═══════════════════════════════════════════════════════════════════════════
    const runG6 = async (traceBase: string) => {
        const traceId = `${traceBase}-G6`;
        const start = performance.now();
        log('G6: Intent-only via API...');
        try {
            const result = await callFsIntent('os.fs.write', 'user://g6_test.txt', 'G6_DATA', traceId);
            log(`G6: success=${result.success}, opId=${result.opId}`);
            if (!result.success) throw new Error(`Intent failed: ${result.errorCode}`);
            if (!result.opId || !result.traceId) throw new Error('Missing opId/traceId');
            if (result.decision?.outcome !== 'ALLOW') throw new Error('Decision not ALLOW');
            addResult({ gateId: 'G6', description: 'Intent-only', status: 'PASS', traceId: result.traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G6', description: 'Intent-only', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        log('Continuing to G7...');
        await runG7(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G7: Policy DENY (system://)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG7 = async (traceBase: string) => {
        const traceId = `${traceBase}-G7`;
        const start = performance.now();
        log('G7: Policy DENY...');
        try {
            const result = await callFsIntent('os.fs.write', 'system://hack.txt', 'HACK', traceId);
            log(`G7: success=${result.success}, outcome=${result.decision?.outcome}`);
            if (result.success === true) throw new Error('System write succeeded');
            if (!result.decision) throw new Error('No decision');
            if (result.decision.outcome !== 'DENY') throw new Error(`Decision: ${result.decision.outcome}`);
            if (result.decision.errorCode !== FileSystemError.accessDenied) throw new Error(`Wrong errorCode: ${result.decision.errorCode}`);
            addResult({ gateId: 'G7', description: 'Policy DENY', status: 'PASS', traceId: result.traceId || traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G7', description: 'Policy DENY', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        log('Continuing to G8...');
        await runG8(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G8: Trace + Audit
    // ═══════════════════════════════════════════════════════════════════════════
    const runG8 = async (traceBase: string) => {
        const traceId = `${traceBase}-G8`;
        const start = performance.now();
        log('G8: Trace + Audit...');
        try {
            const writeResult = await callFsIntent('os.fs.write', 'user://g8_audit.txt', 'AUDIT_TEST', traceId);
            log(`G8: opId=${writeResult.opId}`);
            if (!writeResult.opId || !writeResult.traceId) throw new Error('Missing opId/traceId');
            const expectedPrefix = `${writeResult.traceId}:os.fs.write:`;
            if (!writeResult.opId.startsWith(expectedPrefix)) throw new Error(`Bad opId format: ${writeResult.opId}`);
            const lookup = await (await fetch(`/api/platform/audit-lookup?opId=${encodeURIComponent(writeResult.opId)}`)).json();
            log(`G8: audit found=${lookup.found}`);
            if (!lookup.success || !lookup.found) throw new Error('Audit not found');
            const audit = lookup.records[0];
            const required = ['capability', 'path', 'scheme', 'decision', 'result', 'traceId', 'opId'];
            const missing = required.filter(f => !audit[f]);
            if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(',')}`);
            addResult({ gateId: 'G8', description: 'Trace + Audit', status: 'PASS', traceId: writeResult.traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G8', description: 'Trace + Audit', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        if (phase === '15A.2') { log('===== 15A.2 COMPLETE ====='); setIsRunning(false); return; }
        log('Continuing to G9...');
        await runG9(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G9: Handle Leak Protection (15A.3)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG9 = async (traceBase: string) => {
        const traceId = `${traceBase}-G9`;
        const start = performance.now();
        log('G9: Handle Leak Protection...');
        try {
            // Open some handles first
            const handlesBefore = fs.getOpenHandleCount();
            log(`G9: Handles before open: ${handlesBefore}`);

            // Open handles via service
            await fs.openHandle('user://test_handle1.txt', 'r');
            await fs.openHandle('user://test_handle2.txt', 'w');
            const handlesAfterOpen = fs.getOpenHandleCount();
            log(`G9: Handles after open: ${handlesAfterOpen}`);

            if (handlesAfterOpen < 2) throw new Error(`Expected 2+ handles, got ${handlesAfterOpen}`);

            // Call logout security API (SOFT_LOCK)
            const secResult = await callFsSecurity('soft_lock', handlesAfterOpen, traceId);
            log(`G9: Security result: ${JSON.stringify(secResult)}`);

            if (!secResult.success) throw new Error(`Security API failed: ${secResult.error}`);

            // Execute local lock to close handles
            const lockResult = fs.lock();
            log(`G9: Closed ${lockResult} handles via lock()`);

            const handlesAfterLock = fs.getOpenHandleCount();
            log(`G9: Handles after lock: ${handlesAfterLock}`);

            if (handlesAfterLock !== 0) throw new Error(`Handle leak! ${handlesAfterLock} handles still open`);

            addResult({ gateId: 'G9', description: 'Handle Leak Protection', status: 'PASS', traceId: secResult.traceId || traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G9', description: 'Handle Leak Protection', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        log('Continuing to G10...');
        await runG10(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G10: Soft Lock Enforcement (15A.3)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG10 = async (traceBase: string) => {
        const traceId = `${traceBase}-G10`;
        const start = performance.now();
        log('G10: Soft Lock Enforcement...');
        try {
            // Ensure FS is locked (from G9)
            const state = fs.getSystemState();
            log(`G10: System state = ${state}`);

            if (state !== 'LOCKED') {
                log('G10: Locking FS for test...');
                fs.lock();
            }

            // Try to write - should throw FS_AUTH_REQUIRED
            try {
                await fs.writeFile('user://should_fail.txt', 'FAIL');
                throw new Error('Write succeeded unexpectedly');
            } catch (e: any) {
                const err = e as FsError;
                log(`G10: Write error = ${err.code}`);
                if (err.code !== FileSystemError.authRequired) {
                    throw new Error(`Wrong error: ${err.code}, expected FS_AUTH_REQUIRED`);
                }
            }

            // Try to read - should throw FS_AUTH_REQUIRED
            try {
                await fs.readFile('user://any.txt');
                throw new Error('Read succeeded unexpectedly');
            } catch (e: any) {
                const err = e as FsError;
                if (err.code !== FileSystemError.authRequired) {
                    throw new Error(`Wrong error on read: ${err.code}`);
                }
            }

            // Try to open handle - should throw FS_AUTH_REQUIRED
            try {
                await fs.openHandle('user://blocked.txt', 'r');
                throw new Error('openHandle succeeded unexpectedly');
            } catch (e: any) {
                const err = e as FsError;
                if (err.code !== FileSystemError.authRequired) {
                    throw new Error(`Wrong error on openHandle: ${err.code}`);
                }
            }

            addResult({ gateId: 'G10', description: 'Soft Lock Enforcement', status: 'PASS', traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G10', description: 'Soft Lock Enforcement', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }
        log('Continuing to G11...');
        await runG11(traceBase);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // G11: Clear Policy Wipe (15A.3)
    // ═══════════════════════════════════════════════════════════════════════════
    const runG11 = async (traceBase: string) => {
        const traceId = `${traceBase}-G11`;
        const start = performance.now();
        log('G11: Clear Policy Wipe...');
        try {
            // Unlock first to write test data
            fs.unlock();
            log('G11: Unlocked FS');

            // Write test files
            await fs.writeFile('user://g11_wipe_me.txt', 'TO_WIPE', { create: true });
            await fs.writeFile('temp://g11_temp.txt', 'TEMP_DATA', { create: true });
            log('G11: Test files written');

            // Verify they exist
            const existsBefore = await fs.exists('user://g11_wipe_me.txt');
            if (!existsBefore) throw new Error('Test file not created');

            // Call CLEAR policy via API
            const secResult = await callFsSecurity('clear', 0, traceId);
            log(`G11: Security result: ${JSON.stringify(secResult)}`);

            if (!secResult.success) throw new Error(`Security API failed: ${secResult.error}`);
            if (secResult.policy !== 'CLEAR') throw new Error(`Wrong policy: ${secResult.policy}`);

            // Execute local wipe
            const wipeResult = await fs.logoutPolicy('CLEAR');
            log(`G11: Wipe result: ${JSON.stringify(wipeResult)}`);

            // Verify user:// is empty
            fs.unlock(); // Need to unlock to check
            const existsAfter = await fs.exists('user://g11_wipe_me.txt');
            if (existsAfter) throw new Error('User file still exists after CLEAR');

            // Try to read - should get NOT_FOUND
            try {
                await fs.readFile('user://g11_wipe_me.txt');
                throw new Error('Read succeeded after wipe');
            } catch (e: any) {
                const err = e as FsError;
                if (err.code !== FileSystemError.notFound) {
                    throw new Error(`Wrong error after wipe: ${err.code}, expected FS_NOT_FOUND`);
                }
            }

            addResult({ gateId: 'G11', description: 'Clear Policy Wipe', status: 'PASS', traceId: secResult.traceId || traceId, latency: Math.round(performance.now() - start) });
        } catch (e: any) {
            addResult({ gateId: 'G11', description: 'Clear Policy Wipe', status: 'FAIL', traceId, latency: Math.round(performance.now() - start), error: e.message });
        }

        log('===== 15A.3 COMPLETE =====');
        setIsRunning(false);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Export Evidence
    // ═══════════════════════════════════════════════════════════════════════════
    const exportEvidence = () => {
        const gateRange = phase === '15A.1' ? 'G1-G2' : phase === '15A.2' ? 'G1-G8' : 'G1-G11';
        const md = `
# Phase ${phase} Verification Evidence
**Date**: ${new Date().toLocaleString()}
**Environment**: Production
**Test Trace**: ${testTraceRef.current}

## Gate Results
| Gate | Status | Trace ID | Latency (ms) | Note |
|------|--------|----------|--------------|------|
${results.map(r => `| ${r.gateId} | ${r.status} ${r.status === 'PASS' ? '✅' : '❌'} | ${r.traceId} | ${r.latency} | ${r.error || '-'} |`).join('\n')}

**Verified By**: VerifierAppV0.5 (Automated ${phase} Test — ${gateRange})
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
            <h3 style={{ marginTop: 0 }}>🧪 VerifierApp v0.5 (Phase 15A.3)</h3>

            {/* Phase Selector */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                {(['15A.1', '15A.2', '15A.3'] as Phase[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setPhase(p)}
                        style={{
                            padding: '6px 12px',
                            background: phase === p ? (p === '15A.3' ? '#f97316' : p === '15A.2' ? '#8b5cf6' : '#3b82f6') : '#333',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            borderRadius: 4
                        }}
                    >
                        {p} ({p === '15A.1' ? 'G1-G2' : p === '15A.2' ? 'G1-G8' : 'G1-G11'})
                    </button>
                ))}
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
                            <td style={{ padding: 8, fontSize: 10, color: '#888', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.traceId}
                            </td>
                            <td style={{ padding: 8, color: '#f87171', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.error || '-'}</td>
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
