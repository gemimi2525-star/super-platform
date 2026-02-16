/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/claim (Phase 31)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Called by Go worker to atomically claim the next pending job.
 * Returns the job envelope (ticket + payload) if a job is available.
 *
 * Phase 31 additions:
 * - Idempotency guard: re-claim by same worker returns existing envelope
 * - Structured lifecycle logging
 *
 * Body: { workerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { claimNextJob } from '@/coreos/jobs/queue';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';
import type { JobQueueRecord } from '@/coreos/jobs/types';
import { jobLogger } from '@/coreos/jobs/job-logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workerId } = body;

        if (!workerId || typeof workerId !== 'string') {
            return NextResponse.json(
                { error: 'workerId is required' },
                { status: 400 },
            );
        }

        // ─── Idempotency Guard (Phase 31.2) ───
        // If this worker already has a PROCESSING job, return it instead of claiming another
        const db = getAdminFirestore();
        const existingQuery = await db
            .collection(COLLECTION_JOB_QUEUE)
            .where('status', '==', 'PROCESSING')
            .where('workerId', '==', workerId)
            .limit(1)
            .get();

        if (!existingQuery.empty) {
            const existing = existingQuery.docs[0].data() as JobQueueRecord;
            jobLogger.log('job.claim_idempotent', {
                jobId: existingQuery.docs[0].id,
                traceId: existing.ticket?.traceId,
                workerId,
                note: 'Worker already has an active job — returning existing',
            });
            return NextResponse.json({
                job: {
                    ticket: existing.ticket,
                    payload: existing.payload,
                    version: existing.version,
                    attempts: existing.attempts ?? 1,
                    maxAttempts: existing.maxAttempts ?? 3,
                },
                idempotent: true,
            });
        }

        const envelope = await claimNextJob(workerId);

        if (!envelope) {
            return NextResponse.json({ job: null }, { status: 200 });
        }

        jobLogger.log('job.claimed', {
            jobId: envelope.ticket.jobId,
            traceId: envelope.ticket.traceId,
            workerId,
            jobType: envelope.ticket.jobType,
            attempt: envelope.attempts,
            maxAttempts: envelope.maxAttempts,
        });

        return NextResponse.json({
            job: {
                ticket: envelope.ticket,
                payload: envelope.payload,
                version: envelope.version,
                attempts: envelope.attempts,
                maxAttempts: envelope.maxAttempts,
            },
        });

    } catch (error: any) {
        console.error('[API/jobs/claim] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
