/**
 * API Route — Get Accessibility Module Metadata (Phase 22)
 * GET /api/os/accessibility/get
 */
import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    const integrity = getIntegrity();
    return NextResponse.json({
        status: 'OK',
        module: 'accessibility',
        phase: 22,
        integrity,
    });
}
