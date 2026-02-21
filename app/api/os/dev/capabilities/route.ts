/**
 * API Route — Capabilities List (Phase 24, Dev-only)
 * GET /api/os/dev/capabilities
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { APP_MANIFESTS } = await import('@/components/os-shell/apps/manifest');
    const { appRegistry } = await import('@/components/os-shell/apps/registry');

    const capabilities = Object.entries(APP_MANIFESTS).map(([id, m]) => ({
        appId: id,
        name: m.name,
        icon: m.icon,
        category: m.category,
        requiredRole: m.requiredRole,
        singleInstance: m.singleInstance,
        showInDock: m.showInDock,
        hasComponent: !!appRegistry[id],
    }));

    return NextResponse.json({
        status: 'OK',
        module: 'dev-capabilities',
        phase: 24,
        total: capabilities.length,
        capabilities,
    });
}
