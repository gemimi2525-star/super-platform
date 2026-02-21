/**
 * API Route — Get Appearance Module Metadata (Phase 21)
 * GET /api/os/appearance/get
 */
import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    const integrity = getIntegrity();
    return NextResponse.json({
        status: 'OK',
        module: 'appearance-manager',
        phase: 21,
        integrity,
    });
}
