'use client';

/**
 * Dashboard Stats Component
 * 
 * Displays summary statistics cards
 */

import { Card } from '@super-platform/ui';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
}

function StatsCard({ title, value, icon, trend, color = 'blue' }: StatsCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                <div className={`text-${color}-500 opacity-50`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}

interface DashboardStatsProps {
    stats: {
        organizations: number;
        users: number;
        scans: number;
    };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
                title="Organizations"
                value={stats.organizations}
                icon={<span className="text-4xl">🏢</span>}
                color="blue"
            />
            <StatsCard
                title="Total Users"
                value={stats.users}
                icon={<span className="text-4xl">👥</span>}
                color="green"
            />
            <StatsCard
                title="Total Scans"
                value={stats.scans}
                icon={<span className="text-4xl">📊</span>}
                color="purple"
            />
        </div>
    );
}
