/**
 * API Route — Uninstall Dev Package (Phase 25, Dev-only)
 * POST /api/os/dev/uninstall-package
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { id } = body as { id?: string };

        if (!id || typeof id !== 'string') {
            return NextResponse.json({
                status: 'ERROR',
                module: 'dev-package-uninstall',
                error: 'Missing "id" field',
            }, { status: 400 });
        }

        const { uninstallPackage } = await import(
            '@/coreos/dev/packages/packageLoader'
        );

        const result = uninstallPackage(id);
        if (!result.success) {
            return NextResponse.json({
                status: 'ERROR',
                module: 'dev-package-uninstall',
                error: result.error,
            }, { status: 400 });
        }

        return NextResponse.json({
            status: 'OK',
            module: 'dev-package-uninstall',
            phase: 25,
            event: 'dev.package.uninstalled',
            removedId: id,
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            module: 'dev-package-uninstall',
            error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
