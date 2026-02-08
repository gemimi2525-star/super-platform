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

    return NextResponse.json({
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
        buildTime: BUILD_TIME,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        version,
    }, {
        headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
    });
}
