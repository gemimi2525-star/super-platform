'use client';

/**
 * V2 AppShell Wrapper
 * 
 * Required because the shared Design System 'AppShell' uses hooks (useState)
 * but doesn't have the 'use client' directive.
 * This wrapper creates the necessary Client Boundary.
 */

import React from 'react';
import { AppShell } from '@/modules/design-system/src/patterns/AppShell';

interface V2AppShellProps {
    sidebar: React.ReactNode;
    topbar?: React.ReactNode;
    children: React.ReactNode;
}

export function V2AppShell({ sidebar, topbar, children }: V2AppShellProps) {
    return (
        <AppShell
            sidebar={sidebar}
            topbar={topbar}
            sidebarWidth="240px"
            collapsible={true}
            defaultCollapsed={false}
        >
            {children}
        </AppShell>
    );
}
