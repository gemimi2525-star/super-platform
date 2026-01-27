/**
 * Platform V2 Dashboard Page
 * Static placeholder using design system
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';
import { requirePlatformAccess } from '@/lib/auth/server';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Button } from '@/modules/design-system/src/components/Button';
import { Badge } from '@/modules/design-system/src/components/Badge';

export default async function PlatformV2DashboardPage() {
    // Add server-side auth check
    await requirePlatformAccess();

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to Platform V2 - MacOS-grade UI"
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="md">
                            Settings
                        </Button>
                        <Button variant="primary" size="md">
                            Create New
                        </Button>
                    </div>
                }
            />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Card 1 */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-sm font-medium text-neutral-500">Total Revenue</div>
                        <Badge variant="success" size="sm">+12.5%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">$45,231</div>
                    <div className="mt-2 text-sm text-neutral-500">vs last month</div>
                </div>

                {/* Stats Card 2 */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-sm font-medium text-neutral-500">Active Users</div>
                        <Badge variant="neutral" size="sm">+2.1%</Badge>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">12,345</div>
                    <div className="mt-2 text-sm text-neutral-500">vs last month</div>
                </div>

                {/* Stats Card 3 */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-sm font-medium text-neutral-500">System Status</div>
                        <Badge variant="success" size="sm" dot>Operational</Badge>
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">99.9%</div>
                    <div className="mt-2 text-sm text-neutral-500">Uptime (30 days)</div>
                </div>
            </div>

            <div className="mt-8 bg-neutral-50 p-8 rounded-lg border border-neutral-200 text-center">
                <div className="text-lg font-medium text-neutral-900 mb-2">
                    Work in Progress
                </div>
                <div className="text-neutral-500 max-w-md mx-auto">
                    This dashboard is a placeholder. Real charts and data visualization widgets will be implemented in subsequent phases.
                </div>
            </div>
        </div>
    );
}
