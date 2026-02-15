/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops About — System Information Endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Static JSON endpoint returning system architecture and governance info.
 * No Firestore access. Safe for monitoring and UI rendering.
 *
 * @module app/api/ops/about
 * @version 1.0.0 — Phase 27C.7
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const response = NextResponse.json({
        product: 'APICOREDATA Client OS',
        version: '0.1.0',
        phase: '27C.7',
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
