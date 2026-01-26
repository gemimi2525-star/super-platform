'use client';

/**
 * Platform Insights Overview
 * 
 * Platform owner dashboard for evaluating all org usage and health
 * Read-only analytics using internal data only (no GSC/GA4)
 * All reads audited to platform_audit_logs
 */

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import { Card, Badge } from '@super-platform/ui';
import { useApi } from '@/lib/hooks/useApi';
import ApiErrorBanner from '@/components/common/ApiErrorBanner';

interface OrgStats {
    orgId: string;
    orgName: string;
    keywordsCount: number;
    pagesCount: number;
    lastActivityAt: string | null;
    enabledApps: string[];
    health: 'active' | 'low_activity' | 'no_data';
}

interface InsightsData {
    totalOrgs: number;
    totalKeywords: number;
    totalPages: number;
    recentAuditEvents: number;
    orgStats: OrgStats[];
}

export default function PlatformInsightsPage() {
    const t = useTranslations('platform.insights');

    // Use useApi hook for type-safe API consumption
    const { data, error, loading } = useApi<InsightsData>('/api/platform/insights');

    const [sortBy, setSortBy] = useState<'keywords' | 'pages' | 'activity'>('keywords');

    if (loading) {
        return <div className="p-8 text-center">{t('loading')}</div>;
    }

    const sortedOrgs = (data?.orgStats || []).sort((a, b) => {
        if (sortBy === 'keywords') return b.keywordsCount - a.keywordsCount;
        if (sortBy === 'pages') return b.pagesCount - a.pagesCount;
        // activity
        if (!a.lastActivityAt) return 1;
        if (!b.lastActivityAt) return -1;
        return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });

    const getHealthBadge = (health: string) => {
        if (health === 'active') return { variant: 'success' as const, label: t('healthActive') };
        if (health === 'low_activity') return { variant: 'warning' as const, label: t('healthLowActivity') };
        return { variant: 'destructive' as const, label: t('healthNoData') };
    };

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-gray-600">{t('description')}</p>
            </header>

            {/* Error Display */}
            <ApiErrorBanner error={error} />

            {/* Show content only if data exists */}
            {data && (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <Card>
                            <div className="text-3xl font-bold">{data.totalOrgs}</div>
                            <div className="text-sm text-gray-600">{t('totalOrgs')}</div>
                        </Card>
                        <Card>
                            <div className="text-3xl font-bold">{data.totalKeywords}</div>
                            <div className="text-sm text-gray-600">{t('totalKeywords')}</div>
                        </Card>
                        <Card>
                            <div className="text-3xl font-bold">{data.totalPages}</div>
                            <div className="text-sm text-gray-600">{t('totalPages')}</div>
                        </Card>
                        <Card>
                            <div className="text-3xl font-bold">{data.recentAuditEvents}</div>
                            <div className="text-sm text-gray-600">{t('recentAuditEvents')}</div>
                        </Card>
                    </div>

                    {/* Org Leaderboard */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">{t('orgLeaderboard')}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSortBy('keywords')}
                                    className={`px-3 py-1 rounded ${sortBy === 'keywords' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                >
                                    {t('sortKeywords')}
                                </button>
                                <button
                                    onClick={() => setSortBy('pages')}
                                    className={`px-3 py-1 rounded ${sortBy === 'pages' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                >
                                    {t('sortPages')}
                                </button>
                                <button
                                    onClick={() => setSortBy('activity')}
                                    className={`px-3 py-1 rounded ${sortBy === 'activity' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                >
                                    {t('sortActivity')}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left py-3 px-4">{t('orgName')}</th>
                                        <th className="text-left py-3 px-4">{t('keywords')}</th>
                                        <th className="text-left py-3 px-4">{t('pages')}</th>
                                        <th className="text-left py-3 px-4">{t('lastActivity')}</th>
                                        <th className="text-left py-3 px-4">{t('enabledApps')}</th>
                                        <th className="text-left py-3 px-4">{t('health')}</th>
                                        <th className="text-left py-3 px-4">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOrgs.map((org) => {
                                        const healthBadge = getHealthBadge(org.health);
                                        return (
                                            <tr key={org.orgId} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{org.orgName}</td>
                                                <td className="py-3 px-4">{org.keywordsCount}</td>
                                                <td className="py-3 px-4">{org.pagesCount}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    {org.lastActivityAt
                                                        ? new Date(org.lastActivityAt).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-1">
                                                        {org.enabledApps.map(app => (
                                                            <Badge key={app} variant="default">{app}</Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={healthBadge.variant}>{healthBadge.label}</Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Link
                                                        href={`/platform/insights/${org.orgId}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {t('viewDetails')}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div >
    );
}
