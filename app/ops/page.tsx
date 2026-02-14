'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Monitor Hub — System Status (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Default /ops page showing System Status.
 * Handles legacy ?tab= query params with client-side redirects.
 *
 * @module app/ops/page
 * @version 3.0.0
 */

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OpsNavBar } from '@/coreos/ops/ui/OpsNavBar';
import { SystemStatusView } from '@/coreos/ops/ui/SystemStatusView';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY QUERY TAB REDIRECTS
// ═══════════════════════════════════════════════════════════════════════════

const LEGACY_TAB_REDIRECTS: Record<string, string> = {
    metrics: '/ops/runtime-metrics',
    brain: '/ops/brain',
    workers: '/ops/workers',
    audit: '/ops/audit',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MonitorHubPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Handle legacy ?tab= query params
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && LEGACY_TAB_REDIRECTS[tab]) {
            router.replace(LEGACY_TAB_REDIRECTS[tab]);
        }
    }, [searchParams, router]);

    return (
        <div style={s.page}>
            <div style={s.container}>
                <header style={s.header}>
                    <div>
                        <h1 style={s.title}>◈ Monitor Hub</h1>
                        <p style={s.subtitle}>Phase 26A — Unified Operations Center</p>
                    </div>
                </header>

                <OpsNavBar />

                <SystemStatusView />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        padding: '32px',
    },
    container: {
        maxWidth: 1100,
        margin: '0 auto',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 20,
    },
    title: {
        fontSize: 28, fontWeight: 700, margin: 0,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: 13, color: '#94a3b8', margin: '4px 0 0', letterSpacing: 1 },
};
