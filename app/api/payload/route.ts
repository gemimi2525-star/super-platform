import { NextResponse } from 'next/server';

/**
 * Payload CMS API Route (Placeholder)
 * 
 * Will be properly configured in TC-1.2 Phase 2 after build baseline is established.
 */

export const runtime = 'nodejs';

export async function GET() {
    return NextResponse.json({
        ok: false,
        code: 'PAYLOAD_NOT_YET_CONFIGURED',
        message: 'Payload CMS will be configured in TC-1.2 Phase 2',
    }, { status: 503 });
}

export async function POST() {
    return NextResponse.json({
        ok: false,
        code: 'PAYLOAD_NOT_YET_CONFIGURED',
        message: 'Payload CMS will be configured in TC-1.2 Phase 2',
    }, { status: 503 });
}
