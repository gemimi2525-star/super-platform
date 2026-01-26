'use client';

/**
 * Org Detail Insights
 * Platform owner read-only dashboard for specific org
 * Read-only analytics using internal data (no GSC/GA4)
 * All reads audited to platform_audit_logs
 */

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button } from '@super-platform/ui';

interface OrgDetailData {
    orgId: string;
    orgName: string;
    status: string;
    createdAt: string;
    stats: {
        keywordsCount: number;
        pagesCount: number;
        lastActivityAt: string | null;
        enabledApps: string[];
    };
    timeseries: {
        keywordsByDay: Array<{ date: string; count: number }>;
        pagesByDay: Array<{ date: string; count: number }>;
    };
}

export default function OrgDetailInsightsPage() {
    const t = useTranslations('platform.insights.detail');
    const params = useParams();
    const orgId = params?.orgId as string;

    const [data, setData] = useState<OrgDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchOrgDetail();
        }
    }, [orgId]);

    async function fetchOrgDetail() {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch(`/api/platform/insights/${orgId}`);
            if (response.ok) {
                const detail = await response.json();
                setData(detail);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Failed to fetch org detail:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center">{t('loading')}</div>;
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{t('errorLoading')}</p>
                <Link href="/platform/insights">
                    <Button>{t('back')}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-gray-600">
                        {t('orgIdLabel')}: <span className="font-mono">{data.orgId}</span>
                    </p>
                </div>
                <Link href="/platform/insights">
                    <Button variant="outline">{t('back')}</Button>
                </Link>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <div className="text-3xl font-bold">{data.stats.keywordsCount}</div>
                    <div className="text-sm text-gray-600">{t('keywordsCount')}</div>
                </Card>
                <Card>
                    <div className="text-3xl font-bold">{data.stats.pagesCount}</div>
                    <div className="text-sm text-gray-600">{t('pagesCount')}</div>
                </Card>
                <Card>
                    <div className="text-sm text-gray-600 mb-1">{t('lastActivity')}</div>
                    <div className="text-lg font-medium">
                        {data.stats.lastActivityAt
                            ? new Date(data.stats.lastActivityAt).toLocaleDateString()
                            : '-'}
                    </div>
                </Card>
                <Card>
                    <div className="text-sm text-gray-600 mb-2">{t('enabledApps')}</div>
                    <div className="flex gap-1 flex-wrap">
                        {data.stats.enabledApps.length > 0 ? (
                            data.stats.enabledApps.map(app => (
                                <Badge key={app} variant="default">{app}</Badge>
                            ))
                        ) : (
                            <span className="text-gray-500">-</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                {/* Keywords Chart */}
                <Card>
                    <h2 className="text-lg font-semibold mb-4">{t('keywordsChartTitle')}</h2>
                    <p className="text-sm text-gray-500 mb-4">{t('last30Days')}</p>
                    {data.timeseries.keywordsByDay.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left py-2">Date</th>
                                        <th className="text-right py-2">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.timeseries.keywordsByDay.slice(0, 10).map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="text-right font-mono">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">{t('noChartData')}</p>
                    )}
                </Card>

                {/* Pages Chart */}
                <Card>
                    <h2 className="text-lg font-semibold mb-4">{t('pagesChartTitle')}</h2>
                    <p className="text-sm text-gray-500 mb-4">{t('last30Days')}</p>
                    {data.timeseries.pagesByDay.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left py-2">Date</th>
                                        <th className="text-right py-2">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.timeseries.pagesByDay.slice(0, 10).map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="text-right font-mono">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">{t('noChartData')}</p>
                    )}
                </Card>
            </div>
        </div>
    );
}
