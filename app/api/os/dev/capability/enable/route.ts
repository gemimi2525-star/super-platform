/**
 * API Route — Enable Capability (Phase 26, Dev-only)
 * POST /api/os/dev/capability/enable
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
        const result = useIsolationRegistry.getState().transitionState(id, 'enable');

        if (!result.allowed) {
            return NextResponse.json({
                status: 'ERROR', module: 'dev-capability-enable',
                error: result.reason,
            }, { status: 400 });
        }

        return NextResponse.json({
            status: 'OK', module: 'dev-capability-enable', phase: 26,
            event: 'dev.capability.enabled', capabilityId: id,
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR', error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
