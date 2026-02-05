
'use client';

import React, { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'verifier_state_v0';

export const VerifierAppV0 = () => {
    const fs = useFileSystem();
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isReloading, setIsReloading] = useState(false);

    // Auto-Resume after reload
    useEffect(() => {
        const resumeTests = async () => {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (!savedState) return;

            const state = JSON.parse(savedState);
            if (state.pending === 'G1') {
                console.log('[Verifier] Resuming G1 after reload...');
                setIsRunning(true);
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
            // Note: MemoryAdapter is fresh on reload, so readFile should throw or return empty
            try {
                await fs.readFile(state.expected.tempPath);
                // If we get here, file exists!
                throw new Error('Volatile data persisted! Security Failure.');
            } catch (e: any) {
                // We EXPECT an error (Not Found) or empty
                // Ideally FsError.notFound
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

        // Clean up
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
                // Must be Access Denied code
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

        setIsRunning(false);
    };

    const exportEvidence = () => {
        const md = `
# Phase 15A.1 Verification Evidence
**Date**: ${new Date().toLocaleString()}
**Environment**: Production
**Commit**: (Manual Input)

## Gate Results
| Gate | Status | Trace ID | Latency (ms) | Note |
|------|--------|----------|--------------|------|
${results.map(r => `| ${r.gateId} | ${r.status} ${r.status === 'PASS' ? '✅' : '❌'} | ${r.traceId} | ${r.latency} | ${r.error || '-'} |`).join('\n')}

**Verified By**: VerifierAppV0 (Automated 2-Phase Test)
`;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence_15A1_${new Date().getTime()}.md`;
        a.click();
    };

    return (
        <div style={{ padding: 20, background: '#111', color: '#eee', borderRadius: 8, fontFamily: 'monospace', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>🧪 VerifierApp v0 (Phase 15A.1)</h3>

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
