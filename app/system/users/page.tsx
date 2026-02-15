'use client';

/**
 * System Hub — Users Page (/system/users)
 * Phase 27A: Break-glass standalone route
 */

import React from 'react';
import { SystemNavBar } from '@/coreos/system/ui/SystemNavBar';
import { UsersView } from '@/coreos/system/ui/UsersView';

export default function UsersPage() {
    return (
        <div style={pageStyle}>
            <SystemNavBar />
            <main style={mainStyle}>
                <UsersView />
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
