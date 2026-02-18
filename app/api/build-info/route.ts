/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE — Build Info (Phase 35A — Access Controlled)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Build metadata endpoint with enterprise access control.
 *   - Owner/Admin: full response (commit, version, branch, buildTime)
 *   - Public: redacted response (environment + shaResolved only)
 * 
 * @module app/api/build-info/route
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkOpsAccess } from '@/lib/auth/opsAccessPolicy';

// Build-time constants (captured at build time)
const BUILD_TIME = new Date().toISOString();

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Surrogate-Control': 'no-store',
};

export async function GET() {
    // ── Access Check ──────────────────────────────────────────────────────
    const access = await checkOpsAccess();

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
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    const isVercelEnv = !!process.env.VERCEL_ENV;

    // ── Owner: Full Response ──────────────────────────────────────────────
    if (access.isOwner) {
        const response: Record<string, unknown> = {
            commit: commit ?? 'local',
            branch: branch ?? 'local',
            buildTime: BUILD_TIME,
            environment,
            version,
            shaResolved,
        };

        // Phase 36A: Dev-mode clarity — info vs warning
        if (!shaResolved) {
            if (!isVercelEnv) {
                response.isDev = true;
                response._info = 'DEV_SHA_NOT_APPLICABLE: Running locally — commit SHA is not available in dev. This is normal.';
            } else {
                response._warning = 'ENV_SHA_NOT_EXPOSED: Enable "Automatically expose System Environment Variables" in Vercel Settings and redeploy.';
            }
        }

        return NextResponse.json(response, { headers: NO_STORE_HEADERS });
    }

    // ── Public: Redacted Response ─────────────────────────────────────────
    return NextResponse.json(
        {
            status: 'available',
            environment,
            shaResolved,
            _notice: 'Authenticate as owner for full build details.',
        },
        { headers: NO_STORE_HEADERS },
    );
}
