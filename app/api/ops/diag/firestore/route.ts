/**
 * Firestore Diagnostic Endpoint — Phase 27C.8b
 *
 * Performs a single lightweight Firestore operation to reveal the actual
 * error code when quota/permissions/rate-limits block normal API routes.
 *
 * GET /api/ops/diag/firestore → { ok, errorCode, grpcStatus, ... }
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const t0 = Date.now();
    try {
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Minimal Firestore read — 1 single doc from a tiny collection
        // Uses a non-existent doc to minimise actual data transfer
        const docRef = db.collection('_healthcheck').doc('ping');
        const snap = await docRef.get();

        const latencyMs = Date.now() - t0;

        return NextResponse.json({
            ok: true,
            exists: snap.exists,
            latencyMs,
            projectId: process.env.FIREBASE_PROJECT_ID || '(env missing)',
            phase: '27C.8b',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        const latencyMs = Date.now() - t0;

        // Extract as much structured info as possible
        const grpcCode = error?.code ?? null;               // e.g. 8 = RESOURCE_EXHAUSTED
        const grpcStatus = error?.details ?? error?.metadata?.internalRepr?.get?.('grpc-status') ?? null;
        const errorMessage = error?.message ?? String(error);

        // Classify
        let kind: string = 'UNKNOWN';
        if (grpcCode === 8 || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            kind = errorMessage.includes('per minute') || errorMessage.includes('rate')
                ? 'RATE_LIMIT'
                : 'DAILY_QUOTA';
        } else if (grpcCode === 7 || errorMessage.includes('PERMISSION_DENIED')) {
            kind = 'PERMISSION';
        } else if (grpcCode === 14 || errorMessage.includes('UNAVAILABLE')) {
            kind = 'UNAVAILABLE';
        } else if (grpcCode === 16 || errorMessage.includes('UNAUTHENTICATED')) {
            kind = 'UNAUTHENTICATED';
        }

        console.error(`[Diag:Firestore] ${kind} — code=${grpcCode} msg=${errorMessage}`);

        return NextResponse.json({
            ok: false,
            kind,
            grpcCode,
            grpcStatus,
            errorMessage,
            latencyMs,
            projectId: process.env.FIREBASE_PROJECT_ID || '(env missing)',
            phase: '27C.8b',
            timestamp: new Date().toISOString(),
        }, { status: 503 });
    }
}
