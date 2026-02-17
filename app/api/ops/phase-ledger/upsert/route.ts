/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/ops/phase-ledger/upsert — Write Phase Snapshot (Phase 34.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-only endpoint protected by HMAC-SHA256 + replay protection.
 * Called by CI workflows to record deployment snapshots.
 *
 * Security (3-layer):
 *   1. HMAC-SHA256 over "timestamp.nonce.rawBody"
 *   2. Timestamp window ±5 minutes
 *   3. Nonce replay guard (Firestore-backed)
 *
 * Required headers:
 *   - X-OPS-SIGNATURE (HMAC hex)
 *   - X-OPS-TIMESTAMP (unix ms)
 *   - X-OPS-NONCE (random hex ≥32 chars)
 *
 * Phase 34.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
    COLLECTION_PHASE_LEDGER,
    generateDocId,
    validateUpsertPayload,
} from '@/coreos/ops/phaseLedger/types';
import type { PhaseLedgerSnapshot } from '@/coreos/ops/phaseLedger/types';
import {
    extractHeaders,
    buildSignatureBase,
    verifyLedgerSignature,
    validateTimestamp,
    validateNonce,
    COLLECTION_NONCES,
    NONCE_TTL_MS,
    ERR_MISSING_SIGNATURE,
    ERR_MISSING_TIMESTAMP,
    ERR_MISSING_NONCE,
    ERR_INVALID_NONCE,
    ERR_TIMESTAMP_SKEW,
    ERR_REPLAY,
    ERR_INVALID_SIGNATURE,
} from '@/coreos/ops/phaseLedger/signer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // ── Read raw body ────────────────────────────────────────────────
        const rawBody = await req.text();

        // ── Extract security headers ─────────────────────────────────────
        const { signature, timestamp, nonce } = extractHeaders(req.headers);

        if (!signature) {
            return NextResponse.json(
                { ok: false, error: 'Missing X-OPS-SIGNATURE header', code: ERR_MISSING_SIGNATURE },
                { status: 401 },
            );
        }
        if (!timestamp) {
            return NextResponse.json(
                { ok: false, error: 'Missing X-OPS-TIMESTAMP header', code: ERR_MISSING_TIMESTAMP },
                { status: 401 },
            );
        }
        if (!nonce) {
            return NextResponse.json(
                { ok: false, error: 'Missing X-OPS-NONCE header', code: ERR_MISSING_NONCE },
                { status: 401 },
            );
        }

        // ── Validate nonce format ────────────────────────────────────────
        if (!validateNonce(nonce)) {
            return NextResponse.json(
                { ok: false, error: 'Invalid nonce format (require hex ≥32 chars)', code: ERR_INVALID_NONCE },
                { status: 400 },
            );
        }

        // ── Validate timestamp window (±5 min) ──────────────────────────
        const timestampMs = parseInt(timestamp, 10);
        if (!validateTimestamp(timestampMs)) {
            console.warn(`[API/ops/phase-ledger/upsert] Timestamp skew: ts=${timestamp}, now=${Date.now()}`);
            return NextResponse.json(
                { ok: false, error: 'Timestamp outside allowed window (±5 minutes)', code: ERR_TIMESTAMP_SKEW },
                { status: 403 },
            );
        }

        // ── Verify HMAC signature ────────────────────────────────────────
        const base = buildSignatureBase(timestamp, nonce, rawBody);
        if (!verifyLedgerSignature(base, signature)) {
            console.warn('[API/ops/phase-ledger/upsert] Invalid HMAC signature');
            return NextResponse.json(
                { ok: false, error: 'Invalid signature', code: ERR_INVALID_SIGNATURE },
                { status: 403 },
            );
        }

        // ── Nonce replay guard ───────────────────────────────────────────
        const db = getAdminFirestore();
        const nonceRef = db.collection(COLLECTION_NONCES).doc(nonce);
        const nonceDoc = await nonceRef.get();

        if (nonceDoc.exists) {
            console.warn(`[API/ops/phase-ledger/upsert] Nonce replay detected: ${nonce.slice(0, 16)}…`);
            return NextResponse.json(
                { ok: false, error: 'Nonce already used (replay detected)', code: ERR_REPLAY },
                { status: 403 },
            );
        }

        // Store nonce with TTL
        const expiresAt = new Date(Date.now() + NONCE_TTL_MS);
        await nonceRef.set({
            nonce,
            timestamp: timestampMs,
            expiresAt,
            createdAt: FieldValue.serverTimestamp(),
        });

        // ── Parse and validate payload ───────────────────────────────────
        let payload: unknown;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { ok: false, error: 'Invalid JSON body' },
                { status: 400 },
            );
        }

        const validation = validateUpsertPayload(payload);
        if (!validation.valid) {
            return NextResponse.json(
                { ok: false, error: validation.error },
                { status: 400 },
            );
        }

        const data = validation.data;
        const commitShort = data.commit.substring(0, 7);

        // ── Build Firestore document ─────────────────────────────────────
        const docId = generateDocId(data.phaseId, data.environment, commitShort);
        const doc: PhaseLedgerSnapshot = {
            phaseId: data.phaseId,
            commit: data.commit,
            commitShort,
            tag: data.tag,
            version: data.version,
            environment: data.environment,
            integrity: data.integrity,
            buildInfo: data.buildInfo,
            ledger: data.ledger ?? undefined,
            evidence: data.evidence ?? undefined,
            createdAt: FieldValue.serverTimestamp(),
        };

        // ── Upsert to Firestore ──────────────────────────────────────────
        await db.collection(COLLECTION_PHASE_LEDGER).doc(docId).set(doc, { merge: true });

        console.log(
            `[API/ops/phase-ledger/upsert] Written: ${docId} (phase=${data.phaseId}, env=${data.environment})`,
        );

        return NextResponse.json({
            ok: true,
            data: { docId, phaseId: data.phaseId, environment: data.environment },
        });
    } catch (err: unknown) {
        console.error('[API/ops/phase-ledger/upsert] Error:', err);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}
