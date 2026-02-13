/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/enqueue (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Creates a signed JobTicket and enqueues it to Firestore.
 * Protected: requires valid session + policy decision reference.
 *
 * Body:
 * {
 *   jobType: "scheduler.tick" | "index.build" | "webhook.process",
 *   payload: { ... },
 *   policyDecisionId: string,
 *   scope?: string[],
 *   traceId?: string,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { JobType } from '@/coreos/jobs/types';
import { JOB_TYPES, DEFAULT_TICKET_TTL_MS } from '@/coreos/jobs/types';
import { signTicket, computePayloadHash, canonicalJSON } from '@/coreos/jobs/signer';
import { enqueueJob } from '@/coreos/jobs/queue';
import { incrementCounter } from '@/coreos/ops/metrics';
import { validateNonceUnique } from '@/coreos/jobs/validator';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        // ─── Parse body ───
        const body = await request.json();
        const { jobType, payload, policyDecisionId, scope, traceId, maxAttempts } = body;

        // ─── Validate required fields ───
        if (!jobType || !JOB_TYPES.includes(jobType as JobType)) {
            return NextResponse.json(
                { error: `Invalid jobType. Must be one of: ${JOB_TYPES.join(', ')}` },
                { status: 400 },
            );
        }

        if (!policyDecisionId) {
            return NextResponse.json(
                { error: 'policyDecisionId is required' },
                { status: 400 },
            );
        }

        if (!payload || typeof payload !== 'object') {
            return NextResponse.json(
                { error: 'payload must be a non-null object' },
                { status: 400 },
            );
        }

        // ─── Build canonical payload ───
        const canonicalPayload = canonicalJSON(payload);
        const payloadHash = computePayloadHash(canonicalPayload);

        // ─── Generate ticket fields ───
        const now = Date.now();
        const jobId = randomUUID();
        const nonce = randomUUID();
        const jobTraceId = traceId || `trace-${randomUUID()}`;

        // ─── Check nonce uniqueness (anti-replay) ───
        const db = getAdminFirestore();
        const nonceCheck = await validateNonceUnique(nonce, db);
        if (!nonceCheck.valid) {
            return NextResponse.json(
                { error: nonceCheck.error, code: nonceCheck.code },
                { status: 409 },
            );
        }

        // ─── Sign ticket ───
        const ticket = signTicket({
            jobId,
            jobType: jobType as JobType,
            actorId: 'system', // TODO: extract from session when auth is wired
            scope: scope || ['execute'],
            policyDecisionId,
            requestedAt: now,
            expiresAt: now + DEFAULT_TICKET_TTL_MS,
            payloadHash,
            nonce,
            traceId: jobTraceId,
        });

        // ─── Enqueue ───
        await enqueueJob({
            ticket,
            payload: canonicalPayload,
            version: '1.0',
        }, maxAttempts ? Number(maxAttempts) : undefined);

        incrementCounter('jobs_total', { jobType: jobType as string });

        console.log(`[API/jobs/enqueue] Job enqueued: ${jobId} (${jobType}) trace=${jobTraceId}`);

        // DEBUG: log public key for cross-verification with Go worker
        try {
            const { exportPublicKeyBase64 } = await import('@/coreos/jobs/signer');
            const pubKeyB64 = exportPublicKeyBase64();
            console.log(`[API/jobs/enqueue] DEBUG — Public key (base64): ${pubKeyB64}`);
        } catch (e) {
            console.log('[API/jobs/enqueue] DEBUG — Could not export public key');
        }

        return NextResponse.json({
            jobId,
            status: 'PENDING',
            traceId: jobTraceId,
            expiresAt: ticket.expiresAt,
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API/jobs/enqueue] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
