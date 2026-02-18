/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Integrity Helper — getIntegrity() (Phase 29 → 30)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pure function assembling all integrity checks into a single response.
 * No sensitive data, no PII, no stack traces in output.
 *
 * Checks:
 *   1. Firebase (Firestore probe — read + write ops/integrity-probe)
 *   2. Auth mode (REAL required for production)
 *   3. Governance (SYNAPSE kernel freeze + hash chain — Phase 32.5)
 *   4. Build (commit SHA + locked tag)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkGovernance } from './checkGovernance';
import { getFailInjection } from './failInjection';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// VERSION SOURCE (single source of truth from package.json)
// ═══════════════════════════════════════════════════════════════════════════

let _cachedVersion = '';
function getPackageVersion(): string {
    if (_cachedVersion) return _cachedVersion;
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        _cachedVersion = pkg.version || '0.32.1';
    } catch {
        _cachedVersion = '0.32.1';
    }
    return _cachedVersion;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface IntegrityResult {
    status: 'OK' | 'DEGRADED';
    checks: {
        firebase: {
            ok: boolean;
            latencyMs: number;
            mode: 'firestore' | 'rtdb' | 'unknown';
        };
        auth: {
            mode: 'REAL' | 'MOCK' | 'unknown';
            ok: boolean;
        };
        governance: {
            kernelFrozen: boolean;
            hashValid: boolean;
            ok: boolean;
        };
        build: {
            sha: string | null;
            lockedTag: string | null;
            ok: boolean;
        };
    };
    errorCodes: string[];
    ts: string;
    phase: string;
    version: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE PROBE
// ═══════════════════════════════════════════════════════════════════════════

async function probeFirebase(): Promise<{
    ok: boolean;
    latencyMs: number;
    mode: 'firestore' | 'rtdb' | 'unknown';
    errorCode?: string;
}> {
    const t0 = Date.now();
    try {
        const db = getAdminFirestore();

        // Safe read
        await db.collection('ops').doc('integrity-probe').get();

        // Safe write — only server timestamp
        await db.collection('ops').doc('integrity-probe').set(
            { lastIntegrityCheckAt: FieldValue.serverTimestamp() },
            { merge: true },
        );

        return {
            ok: true,
            latencyMs: Date.now() - t0,
            mode: 'firestore',
        };
    } catch (err: any) {
        const latencyMs = Date.now() - t0;
        const code = err?.code ?? '';
        const msg = err?.message ?? '';

        if (code === 7 || msg.includes('PERMISSION_DENIED')) {
            return { ok: false, latencyMs, mode: 'firestore', errorCode: 'FIREBASE_PERMISSION_DENIED' };
        }

        return { ok: false, latencyMs, mode: 'firestore', errorCode: 'FIREBASE_UNREACHABLE' };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MODE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function detectAuthMode(): { mode: 'REAL' | 'MOCK' | 'unknown'; ok: boolean; errorCode?: string } {
    const isAdminConfigured = !!(
        process.env.FIREBASE_PROJECT_ID ||
        process.env.FIREBASE_SERVICE_ACCOUNT
    );

    const isDev = process.env.NODE_ENV === 'development';
    const isBypass = isDev && process.env.AUTH_DEV_BYPASS === 'true';

    if (isBypass) {
        return { mode: 'MOCK', ok: false, errorCode: 'AUTH_NOT_REAL' };
    }

    if (isAdminConfigured) {
        return { mode: 'REAL', ok: true };
    }

    return { mode: 'unknown', ok: false, errorCode: 'AUTH_MODE_UNKNOWN' };
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE / SYNAPSE CHECK
// ═══════════════════════════════════════════════════════════════════════════

// Governance check — see lib/ops/integrity/checkGovernance.ts (Phase 32.5)

// ═══════════════════════════════════════════════════════════════════════════
// BUILD SHA + RELEASE LOCK
// ═══════════════════════════════════════════════════════════════════════════

function checkBuild(): {
    sha: string | null;
    lockedTag: string | null;
    ok: boolean;
    errorCode?: string;
} {
    // Attempt build SHA
    const sha =
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
        null;

    // Locked tag — derived from package.json (single source of truth)
    const lockedTag = `v${getPackageVersion()}`;

    if (!sha) {
        // Phase 36A: Dev-mode clarity — don't mark DEGRADED in local dev
        const isVercelEnv = !!process.env.VERCEL_ENV;
        if (!isVercelEnv) {
            // Local dev: SHA not applicable, not a real problem
            return { sha: 'local', lockedTag, ok: true, errorCode: 'DEV_SHA_NOT_APPLICABLE' };
        }
        // Production/Preview: SHA missing is a real problem
        return { sha: null, lockedTag, ok: false, errorCode: 'ENV_SHA_NOT_EXPOSED' };
    }

    return { sha, lockedTag, ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════

export async function getIntegrity(): Promise<IntegrityResult> {
    const errorCodes: string[] = [];
    const injection = getFailInjection();

    // Run all checks (Firebase is async, rest are sync)
    const [firebaseResult, authResult, govResult, buildResult] = await Promise.all([
        probeFirebase(),
        Promise.resolve(detectAuthMode()),
        Promise.resolve(checkGovernance()),
        Promise.resolve(checkBuild()),
    ]);

    // ── Phase 33A: Fail Injection Overrides ───────────────────────────
    if (injection.active) {
        if (injection.failKernelFrozen) {
            govResult.kernelFrozen = false;
            govResult.ok = false;
            govResult.errorCode = 'INJECTED_KERNEL_NOT_FROZEN';
        }
        if (injection.failHashChain) {
            govResult.hashValid = false;
            govResult.ok = false;
            govResult.errorCode = 'INJECTED_HASH_CHAIN_BROKEN';
        }
    }

    // Collect error codes
    if (firebaseResult.errorCode) errorCodes.push(firebaseResult.errorCode);
    if (authResult.errorCode) errorCodes.push(authResult.errorCode);
    if (govResult.errorCode) errorCodes.push(govResult.errorCode);
    if (buildResult.errorCode) errorCodes.push(buildResult.errorCode);

    // Overall status — OK only if ALL checks pass
    let allOk = firebaseResult.ok && authResult.ok && govResult.ok && buildResult.ok;

    // Phase 33A: FAIL_INTEGRITY=1 forces DEGRADED regardless
    if (injection.failIntegrity) {
        allOk = false;
        if (!errorCodes.includes('INJECTED_INTEGRITY_FAIL')) {
            errorCodes.push('INJECTED_INTEGRITY_FAIL');
        }
    }

    const status = allOk ? 'OK' : 'DEGRADED';

    return {
        status,
        checks: {
            firebase: {
                ok: firebaseResult.ok,
                latencyMs: firebaseResult.latencyMs,
                mode: firebaseResult.mode,
            },
            auth: {
                mode: authResult.mode,
                ok: authResult.ok,
            },
            governance: {
                kernelFrozen: govResult.kernelFrozen,
                hashValid: govResult.hashValid,
                ok: govResult.ok,
            },
            build: {
                sha: buildResult.sha,
                lockedTag: buildResult.lockedTag,
                ok: buildResult.ok,
            },
        },
        errorCodes,
        ts: new Date().toISOString(),
        phase: '36',
        version: `v${getPackageVersion()}`,
    };
}
