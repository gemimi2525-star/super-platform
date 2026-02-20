/**
 * API — GET /api/os/desktop/shortcuts/list (Phase 19.5)
 * Returns desktop shortcut module metadata + integrity.
 */
import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    try {
        const integrity = await getIntegrity();
        return NextResponse.json({
            status: 'OK',
            module: 'desktop-shortcuts',
            phase: 19.5,
            integrity: {
                sha: integrity.checks.build.sha,
                lockedTag: integrity.checks.build.lockedTag,
            },
        });
    } catch (error: any) {
        console.error('[API/os/desktop/shortcuts/list] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
