/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Integrity Helper — getIntegrity() (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pure function assembling all integrity checks into a single response.
 * No sensitive data, no PII, no stack traces in output.
 *
 * Checks:
 *   1. Firebase (Firestore probe — read + write ops/integrity-probe)
 *   2. Auth mode (REAL required for production)
 *   3. Governance (SYNAPSE kernel freeze + hash — TODO)
 *   4. Build (commit SHA + locked tag)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
            kernelFrozen: boolean | 'unknown';
            hashValid: boolean | 'unknown';
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

function checkGovernance(): {
    kernelFrozen: boolean | 'unknown';
    hashValid: boolean | 'unknown';
    ok: boolean;
    errorCode?: string;
} {
    // TODO: Wire into SYNAPSE governance module when kernel freeze
    // and hash chain validation helpers become available.
    // Currently no governance helpers exist in the codebase.
    return {
        kernelFrozen: 'unknown',
        hashValid: 'unknown',
        ok: false,
        errorCode: 'GOVERNANCE_UNKNOWN',
    };
}

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

    // Locked tag — hard-coded from the latest release
    const lockedTag = 'v0.29';

    if (!sha) {
        return { sha: null, lockedTag, ok: false, errorCode: 'BUILD_SHA_MISSING' };
    }

    return { sha, lockedTag, ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════

export async function getIntegrity(): Promise<IntegrityResult> {
    const errorCodes: string[] = [];

    // Run all checks (Firebase is async, rest are sync)
    const [firebaseResult, authResult, govResult, buildResult] = await Promise.all([
        probeFirebase(),
        Promise.resolve(detectAuthMode()),
        Promise.resolve(checkGovernance()),
        Promise.resolve(checkBuild()),
    ]);

    // Collect error codes
    if (firebaseResult.errorCode) errorCodes.push(firebaseResult.errorCode);
    if (authResult.errorCode) errorCodes.push(authResult.errorCode);
    if (govResult.errorCode) errorCodes.push(govResult.errorCode);
    if (buildResult.errorCode) errorCodes.push(buildResult.errorCode);

    // Overall status — OK only if ALL checks pass
    const allOk = firebaseResult.ok && authResult.ok && govResult.ok && buildResult.ok;
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
        phase: '29',
        version: 'v0.29',
    };
}
