/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE — Build Info (Phase 39)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Public read-only endpoint returning build metadata.
 * Used to verify which commit/version is currently deployed.
 * 
 * @module app/api/build-info/route
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Build-time constants (captured at build time)
const BUILD_TIME = new Date().toISOString();

export async function GET() {
    // Read version from package.json
    let version = 'unknown';
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        version = pkg.version || 'unknown';
    } catch {
        // Ignore
    }

    const commit = process.env.VERCEL_GIT_COMMIT_SHA || null;
    const branch = process.env.VERCEL_GIT_COMMIT_REF || null;
    const shaResolved = !!commit;

    const response: Record<string, unknown> = {
        commit: commit ?? 'local',
        branch: branch ?? 'local',
        buildTime: BUILD_TIME,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        version,
        shaResolved,
    };

    if (!shaResolved) {
        response._warning = 'ENV_SHA_NOT_EXPOSED: Enable "Automatically expose System Environment Variables" in Vercel Settings and redeploy.';
    }

    return NextResponse.json(response, {
        headers: {
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
            'Surrogate-Control': 'no-store',
        },
    });
}
