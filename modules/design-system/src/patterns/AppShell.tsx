/**
 * AppShell Pattern
 * Full-height layout with sidebar + topbar + main content
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useState } from 'react';

export interface AppShellProps {
    sidebar: React.ReactNode;
    topbar: React.ReactNode;
    children: React.ReactNode;
    sidebarWidth?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
    sidebar,
    topbar,
    children,
    sidebarWidth = '240px',
    collapsible = true,
    defaultCollapsed = false,
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultCollapsed);

    // Convert sidebarWidth to a width class if it's a standard size
    const getWidthClass = (width: string) => {
        const widthMap: Record<string, string> = {
            '240px': 'w-60',
            '256px': 'w-64',
            '280px': 'w-70',
            '320px': 'w-80',
        };
        return widthMap[width] || 'w-60'; // Default to w-60 if not in map
    };

    const sidebarWidthClass = getWidthClass(sidebarWidth);
    const containerClasses = 'flex h-screen overflow-hidden bg-neutral-50';
    const sidebarClasses = `h-screen bg-white border-r border-neutral-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-out z-[100] overflow-y-auto overflow-x-hidden ${isSidebarCollapsed ? 'w-16' : sidebarWidthClass
        }`;
    const mainContainerClasses = 'flex flex-col flex-1 min-w-0 overflow-hidden';
    const topbarClasses = 'h-16 bg-white border-b border-neutral-200 flex items-center px-6 flex-shrink-0 shadow-sm z-[100]';
    const contentClasses = 'flex-1 overflow-auto p-6';

    // Toggle button positioning based on collapse state
    const toggleButtonClasses = `absolute top-6 w-8 h-8 rounded-full bg-white border border-neutral-300 flex items-center justify-center cursor-pointer shadow-md z-[1000] transition-all duration-300 ease-out text-sm text-neutral-600 hover:bg-neutral-50 ${isSidebarCollapsed ? 'left-4' : sidebarWidthClass === 'w-60' ? 'left-[208px]' : sidebarWidthClass === 'w-64' ? 'left-[224px]' : sidebarWidthClass === 'w-80' ? 'left-[288px]' : 'left-[208px]'
        }`;

    return (
        <div className={containerClasses}>
            <aside className={sidebarClasses}>
                {sidebar}
            </aside>

            {collapsible && (
                <button
                    className={toggleButtonClasses}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isSidebarCollapsed ? '→' : '←'}
                </button>
            )}

            <div className={mainContainerClasses}>
                <header className={topbarClasses}>
                    {topbar}
                </header>
                <main className={contentClasses}>
                    {children}
                </main>
            </div>
        </div>
    );
};
