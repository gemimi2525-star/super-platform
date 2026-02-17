/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops About — System Information Endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Static JSON endpoint returning system architecture and governance info.
 * No Firestore access. Safe for monitoring and UI rendering.
 *
 * @module app/api/ops/about
 * @version 2.0.0 — Phase 32.4
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let _cachedVersion = '';
function getPackageVersion(): string {
    if (_cachedVersion) return _cachedVersion;
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        _cachedVersion = pkg.version || '0.32.1';
    } catch {
        _cachedVersion = '0.32.1';
    }
    return _cachedVersion;
}

export async function GET() {
    const version = getPackageVersion();
    const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

    const response = NextResponse.json({
        product: 'APICOREDATA Client OS',
        version,
        phase: '32.4',
        commit,
        architecture: {
            shell: { name: 'NEXUS', desc: 'Desktop, Dock, Menu Bar' },
            windowSystem: { name: 'ORBIT', desc: 'Window Manager, Chrome' },
            kernel: { name: 'SYNAPSE', desc: 'Governance, Policy, Security' },
        },
        governance: {
            consistencyGate: 'active',
            auditLogging: 'enabled',
        },
        ts: new Date().toISOString(),
    });

    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
}
