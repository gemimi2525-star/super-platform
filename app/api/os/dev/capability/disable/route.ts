/**
 * API Route — Disable Capability (Phase 26, Dev-only)
 * POST /api/os/dev/capability/disable
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const { id } = (await request.json()) as { id?: string };
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ status: 'ERROR', error: 'Missing "id"' }, { status: 400 });
        }

        const { useIsolationRegistry } = await import('@/coreos/dev/isolation/registry');
        const result = useIsolationRegistry.getState().transitionState(id, 'disable');

        if (!result.allowed) {
            return NextResponse.json({
                status: 'ERROR', module: 'dev-capability-disable',
                error: result.reason,
            }, { status: 400 });
        }

        return NextResponse.json({
            status: 'OK', module: 'dev-capability-disable', phase: 26,
            event: 'dev.capability.disabled', capabilityId: id,
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR', error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
