/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/reaper (Phase 31.6)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Triggers stuck job reaping. Called by scheduler or cron.
 * Finds PROCESSING jobs with expired leases and recovers them.
 */

import { NextResponse } from 'next/server';
import { reapStuckJobs } from '@/coreos/jobs/reaper';
import { jobLogger } from '@/coreos/jobs/job-logger';

export async function POST() {
    try {
        const result = await reapStuckJobs();

        return NextResponse.json({
            reaper: 'completed',
            found: result.found,
            retried: result.retried,
            deadLettered: result.deadLettered,
            jobs: result.jobs,
            timestamp: Date.now(),
        });
    } catch (error: any) {
        jobLogger.error('job.reaper_run', {
            error: { code: 'REAPER_ERROR', message: error.message },
        });
        return NextResponse.json(
            { error: 'Reaper failed', details: error.message },
            { status: 500 },
        );
    }
}
