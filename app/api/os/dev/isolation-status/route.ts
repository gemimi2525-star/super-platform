/**
 * API Route — Isolation Status (Phase 26, Dev-only)
 * GET /api/os/dev/isolation-status
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { useIsolationRegistry } = await import('@/coreos/dev/isolation/registry');
    const capabilities = useIsolationRegistry.getState().capabilities;

    return NextResponse.json({
        status: 'OK',
        module: 'isolation-status',
        phase: 26,
        total: capabilities.length,
        capabilities: capabilities.map(c => ({
            capabilityId: c.capabilityId,
            state: c.state,
            trustLevel: c.trustLevel,
            permissions: c.permissions,
            throttleCount: c.throttleCount,
            denyCount: c.denyCount,
            lastActivity: c.lastActivity,
        })),
    });
}
