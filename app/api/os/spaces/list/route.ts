/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Route — List Spaces (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * GET /api/os/spaces/list
 * Returns module metadata and integrity information.
 */

import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    const integrity = getIntegrity();

    return NextResponse.json({
        status: 'OK',
        module: 'virtual-spaces',
        phase: 20.5,
        integrity,
    });
}
