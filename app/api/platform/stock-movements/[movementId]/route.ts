import { NextResponse } from 'next/server';

/**
 * TEMPORARY DISABLED HANDLER
 * 
 * Legacy Firebase-dependent routes disabled to unblock TC-1.2 Payload CMS build.
 * Webpack cannot resolve '@/lib/firebase' collection exports.
 * 
 * TODO: Re-enable after TC-1.2 lock-in; fix webpack path/exports.
 */

export const runtime = 'nodejs';

const DISABLED_RESPONSE = {
    ok: false,
    code: 'LEGACY_ROUTE_DISABLED',
    reason: 'Temporarily disabled to unblock TC-1.2 Payload CMS build. Legacy Firebase exports unresolved under webpack.',
    todo: "Re-enable after TC-1.2 lock-in; fix webpack path/exports for '@/lib/firebase' collections.",
};

export async function GET() {
    return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

export async function POST() {
    return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

export async function PUT() {
    return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

export async function PATCH() {
    return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}

export async function DELETE() {
    return NextResponse.json(DISABLED_RESPONSE, { status: 503 });
}
