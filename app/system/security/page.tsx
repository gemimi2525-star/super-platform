'use client';

/**
 * System Hub — Security Page (/system/security)
 * Phase 27A: Break-glass standalone route
 */

import React from 'react';
import { SystemNavBar } from '@/coreos/system/ui/SystemNavBar';
import { SecurityView } from '@/coreos/system/ui/SecurityView';

export default function SecurityPage() {
    return (
        <div style={pageStyle}>
            <SystemNavBar />
            <main style={mainStyle}>
                <SecurityView />
            </main>
        </div>
    );
}

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const mainStyle: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
};
