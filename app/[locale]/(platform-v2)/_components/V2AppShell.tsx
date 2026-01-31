'use client';

/**
 * V2 AppShell Wrapper
 * 
 * PHASE 7.4: Enhanced with Core System Provider
 * 
 * Provides the OS experience shell with:
 * - Fixed OS Chrome (TopBar + Sidebar)
 * - OSWorkspace container for app content
 * - Smooth cross-fade between routes
 * - Core System Provider (Settings, About, Lock Screen)
 * 
 * Required because the shared Design System 'AppShell' uses hooks (useState)
 * but doesn't have the 'use client' directive.
 * This wrapper creates the necessary Client Boundary.
 */

import React from 'react';
import { usePathname, useParams } from 'next/navigation';
import { AppShell } from '@/modules/design-system/src/patterns/AppShell';
import { OSWorkspace } from '@/modules/design-system/src/patterns/OSWorkspace';
import { CoreSystemProvider } from './CoreSystemHost';

interface V2AppShellProps {
    sidebar: React.ReactNode;
    topbar?: React.ReactNode;
    children: React.ReactNode;
}

export function V2AppShell({ sidebar, topbar, children }: V2AppShellProps) {
    // Get current pathname for AnimatePresence key
    const pathname = usePathname();
    const params = useParams();
    const locale = (params.locale as string) || 'en';

    return (
        <CoreSystemProvider locale={locale}>
            <AppShell
                sidebar={sidebar}
                topbar={topbar}
                sidebarWidth="240px"
                collapsible={true}
                defaultCollapsed={false}
            >
                {/* OSWorkspace provides the window-like container with route animations */}
                <OSWorkspace routeKey={pathname}>
                    {children}
                </OSWorkspace>
            </AppShell>
        </CoreSystemProvider>
    );
}

