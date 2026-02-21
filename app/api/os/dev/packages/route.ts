/**
 * API Route — List Installed Dev Packages (Phase 25, Dev-only)
 * GET /api/os/dev/packages
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { usePackageStore } = await import('@/coreos/dev/packages/store');
    const packages = usePackageStore.getState().packages;

    return NextResponse.json({
        status: 'OK',
        module: 'dev-packages',
        phase: 25,
        total: packages.length,
        packages: packages.map(p => ({
            id: p.id,
            version: p.version,
            title: p.ui.title,
            icon: p.ui.icon,
            trustLevel: p.manifest.trustLevel,
            installedAt: p.installedAt,
            argsHash: p.argsHash,
        })),
    });
}
