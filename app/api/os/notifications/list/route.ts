/**
 * API — GET /api/os/notifications/list (Phase 18)
 * Returns notification metadata + integrity info.
 */
import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    try {
        const integrity = await getIntegrity();
        return NextResponse.json({
            status: 'OK',
            module: 'notification-center',
            phase: 18,
            integrity: { sha: integrity.checks.build.sha, lockedTag: integrity.checks.build.lockedTag },
        });
    } catch (error: any) {
        console.error('[API/os/notifications/list] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
