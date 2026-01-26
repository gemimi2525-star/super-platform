'use client';

/**
 * Platform V2 Layout
 * Uses AppShell pattern from design-system
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';
import { AppShell } from '@/modules/design-system/src/patterns/AppShell';
import { Divider } from '@/modules/design-system/src/components/Divider';

interface PlatformV2LayoutProps {
    children: React.ReactNode;
}

export default function PlatformV2Layout({ children }: PlatformV2LayoutProps) {
    // Simple sidebar for v2
    const sidebar = (
        <div className="p-6">
            <div className="text-lg font-bold text-neutral-900 mb-8">
                Platform V2
            </div>
            <nav className="flex flex-col gap-2">
                <a
                    href="/en/v2"
                    className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                >
                    Dashboard
                </a>
                <a
                    href="/en/v2/orgs"
                    className="px-4 py-3 text-neutral-700 no-underline rounded-md hover:bg-neutral-100 transition-colors"
                >
                    Organizations
                </a>

                {/* Test Login Link (DEV only) */}
                {process.env.ENABLE_TEST_LOGIN === 'true' && process.env.NODE_ENV !== 'production' && (
                    <>
                        <Divider spacing="md" />
                        <a
                            href="/en/v2/test-login"
                            className="px-4 py-3 text-primary-600 no-underline rounded-md hover:bg-primary-50 transition-colors text-sm font-medium"
                        >
                            🧪 Test Login
                        </a>
                    </>
                )}
            </nav>
        </div>
    );

    // Simple topbar
    const topbar = (
        <div className="flex justify-between items-center w-full">
            <div className="text-base font-medium text-neutral-700">
                APICOREDATA Platform V2
            </div>
            <div className="flex gap-4 items-center">
                <span className="text-sm text-neutral-600">English</span>
                <button className="px-4 py-1 bg-white border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors">
                    Logout
                </button>
            </div>
        </div>
    );

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
