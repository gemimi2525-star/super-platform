/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/worker/health (Phase 22A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Simple health check endpoint for monitoring.
 * Returns server status, environment, and timestamp.
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        env: process.env.NODE_ENV ?? 'unknown',
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? 'dev',
        timeISO: new Date().toISOString(),
    });
}
