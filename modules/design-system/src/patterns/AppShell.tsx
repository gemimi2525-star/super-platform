/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — AppShell Pattern
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4.2: Simplified - No Collapse
 * 
 * Full-height layout with:
 * - Static sidebar (240px, no collapse)
 * - TopBar (56px height)
 * - Main content area
 * 
 * Calm OS Principle:
 * - No unnecessary animations
 * - Stable, predictable layout
 * - Navigation is pure and simple
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AppShellProps {
    sidebar: React.ReactNode;
    topbar: React.ReactNode;
    children: React.ReactNode;
    sidebarWidth?: string;
    /** @deprecated - Collapse functionality removed in PHASE 7.4.2 */
    collapsible?: boolean;
    /** @deprecated - Collapse functionality removed in PHASE 7.4.2 */
    defaultCollapsed?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const AppShell: React.FC<AppShellProps> = ({
    sidebar,
    topbar,
    children,
    sidebarWidth = '240px',
    // collapsible and defaultCollapsed are now ignored (deprecated)
}) => {
    // Convert sidebarWidth to a width class if it's a standard size
    const getWidthClass = (width: string) => {
        const widthMap: Record<string, string> = {
            '240px': 'w-60',
            '256px': 'w-64',
            '280px': 'w-70',
            '320px': 'w-80',
        };
        return widthMap[width] || 'w-60';
    };

    const sidebarWidthClass = getWidthClass(sidebarWidth);

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50">
            {/* ═══════════════════════════════════════════════════════════════
                SIDEBAR: Static, no collapse
            ═══════════════════════════════════════════════════════════════ */}
            <aside
                className={`
                    h-screen bg-white border-r border-neutral-200 
                    flex flex-col flex-shrink-0 z-[100] 
                    overflow-y-auto overflow-x-hidden
                    ${sidebarWidthClass}
                `}
            >
                {sidebar}
            </aside>

            {/* ═══════════════════════════════════════════════════════════════
                MAIN CONTAINER: TopBar + Content
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* TopBar */}
                <header
                    className="h-14 bg-white border-b border-neutral-200 flex items-center px-6 flex-shrink-0 shadow-sm z-[100]"
                    style={{ position: 'relative' }}
                >
                    {topbar}
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

