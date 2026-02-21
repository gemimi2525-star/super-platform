/**
 * API Route — Manifest Validator (Phase 24, Dev-only)
 * GET /api/os/dev/validate-manifest
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { validateAllDeep } = await import('@/coreos/dev/validator/manifestValidator');
    const report = validateAllDeep();

    return NextResponse.json({
        status: 'OK',
        module: 'manifest-validator',
        phase: 24,
        report,
    });
}
