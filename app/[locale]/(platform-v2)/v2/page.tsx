'use client';

/**
 * Platform V2 Dashboard Page
 * Static placeholder using design system
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Button } from '@/modules/design-system/src/components/Button';
import { Badge } from '@/modules/design-system/src/components/Badge';

export default function PlatformV2DashboardPage() {
    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to Platform V2 - MacOS-grade UI"
                actions={
                    <>
                        <Button variant="outline" size="md">Settings</Button>
                        <Button variant="primary" size="md">Create New</Button>
                    </>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-8">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex flex-col gap-2">
                    <div className="text-sm text-neutral-600 font-medium">
                        Total Organizations
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        24
                    </div>
                    <Badge variant="success" size="sm">+12% this month</Badge>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex flex-col gap-2">
                    <div className="text-sm text-neutral-600 font-medium">
                        Active Users
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        1,234
                    </div>
                    <Badge variant="info" size="sm">+8% this month</Badge>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex flex-col gap-2">
                    <div className="text-sm text-neutral-600 font-medium">
                        System Status
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        Healthy
                    </div>
                    <Badge variant="success" size="sm" dot>All systems operational</Badge>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex flex-col gap-2">
                    <div className="text-sm text-neutral-600 font-medium">
                        API Calls Today
                    </div>
                    <div className="text-3xl font-bold text-neutral-900">
                        45.2K
                    </div>
                    <Badge variant="neutral" size="sm">Within limits</Badge>
                </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                    Recent Activity
                </h2>
                <div className="text-neutral-600 text-base">
                    This is a static placeholder for the v2 dashboard. Design system components are working correctly.
                </div>
            </div>
        </div>
    );
}
