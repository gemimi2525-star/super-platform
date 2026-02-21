/**
 * API Route — Install Dev Package (Phase 25, Dev-only)
 * POST /api/os/dev/install-package
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const body = await request.json();

        const { validatePackage, installPackage } = await import(
            '@/coreos/dev/packages/packageLoader'
        );

        // Validate first
        const validation = validatePackage(body);
        if (!validation.valid) {
            return NextResponse.json({
                status: 'ERROR',
                module: 'dev-package-install',
                phase: 25,
                errors: validation.errors,
                warnings: validation.warnings,
            }, { status: 400 });
        }

        // Install
        const result = await installPackage(body);
        if (!result.success) {
            return NextResponse.json({
                status: 'ERROR',
                module: 'dev-package-install',
                phase: 25,
                errors: result.errors,
            }, { status: 400 });
        }

        return NextResponse.json({
            status: 'OK',
            module: 'dev-package-install',
            phase: 25,
            event: 'dev.package.installed',
            argsHash: result.installed?.argsHash,
            package: {
                id: result.installed?.id,
                version: result.installed?.version,
                installedAt: result.installed?.installedAt,
            },
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            module: 'dev-package-install',
            error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
