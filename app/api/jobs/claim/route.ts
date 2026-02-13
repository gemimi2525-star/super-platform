/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/claim (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Called by Go worker to atomically claim the next pending job.
 * Returns the job envelope (ticket + payload) if a job is available.
 *
 * Body: { workerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { claimNextJob } from '@/coreos/jobs/queue';

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

        const envelope = await claimNextJob(workerId);

        if (!envelope) {
            return NextResponse.json({ job: null }, { status: 200 });
        }

        console.log(`[API/jobs/claim] Job claimed: ${envelope.ticket.jobId} → ${workerId}`);

        return NextResponse.json({
            job: {
                ticket: envelope.ticket,
                payload: envelope.payload,
                version: envelope.version,
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
