'use client';

/**
 * Keyword Detail Page
 * Shows ranking history trend and details
 */

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/authStore';
import { useSEOGuard, useKeyword, useRankHistory } from '@modules/seo';
import { Button, Table, type ColumnDef } from '@platform/ui-kit';
import { LanguageSwitcher } from '@modules/seo';
import { RankUpdateModal } from '@/components/keywords/RankUpdateModal';
import type { RankHistory } from '@modules/seo';

export default function KeywordDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Correctly unwrap params
    const resolvedParams = use(params);
    const keywordId = resolvedParams.id;

    const router = useRouter();
    const t = useTranslations();
    const authStore = useAuthStore();
    const { organizationId, isReady } = useSEOGuard(authStore);

    const { data: keyword, isLoading: keywordLoading } = useKeyword(organizationId, keywordId);
    const { data: history, isLoading: historyLoading } = useRankHistory(organizationId, keywordId);

    const [showRankModal, setShowRankModal] = useState(false);

    if (!isReady || keywordLoading || historyLoading) {
        return <div className="p-8 text-center">{t('common.loading')}</div>;
    }

    if (!keyword) {
        return <div className="p-8 text-center text-red-500">Keyword not found</div>;
    }

    // Chart Placeholder (Pure CSS/SVG simple chart or just status)
    // We will render a simple list for MVP instead of complex chart if dependencies are strict, 
    // but a simple SVG polyline is easy.
    const reversedHistory = [...(history || [])].reverse().slice(-30);
    const chartPoints = reversedHistory.map((h, i) => {
        const x = (i / (reversedHistory.length - 1 || 1)) * 100;
        const y = h.rank; // 1 is high, 100 is low. We want 1 at top.
        // Normalize 1-100 to 0-100px height. 1 -> 0px, 100 -> 100px.
        return `${x},${h.rank}`;
    }).join(' ');

    const columns: ColumnDef<RankHistory>[] = [
        {
            key: 'date',
            header: t('seo.ranks.date'),
            render: (row) => row.date
        },
        {
            key: 'rank',
            header: t('seo.ranks.rank'),
            render: (row) => <span className="font-bold">#{row.rank}</span>
        },
        {
            key: 'change',
            header: t('seo.ranks.change'),
            render: (row, i) => {
                // Calculate change from next item in list (which is previous date)
                // History is sorted desc by default, so previous is at index i + 1
                const prev = history?.[i + 1]?.rank;
                if (!prev) return '-';
                const change = prev - row.rank; // positive means went UP (rank got smaller number)
                if (change === 0) return <span className="text-gray-400">-</span>;
                return (
                    <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {change > 0 ? '▲' : '▼'} {Math.abs(change)}
                    </span>
                );
            }
        },
        {
            key: 'note',
            header: t('seo.ranks.note'),
            render: (row) => <span className="text-gray-500 text-sm">{row.note || '-'}</span>
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => router.push('/seo/keywords')}>
                                    ←
                                </Button>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {keyword.term}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <Button onClick={() => setShowRankModal(true)} variant="primary">
                                {t('seo.ranks.updateRank')}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">{t('seo.ranks.currentRank')}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {keyword.ranking?.currentPosition ? `#${keyword.ranking.currentPosition}` : '-'}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">{t('seo.ranks.bestRank')}</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {keyword.ranking?.bestPosition ? `#${keyword.ranking.bestPosition}` : '-'}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">{t('seo.ranks.trend')}</h3>
                        {/* Simple Sparkline */}
                        {chartPoints ? (
                            <div className="h-12 w-full mt-2 relative">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <polyline
                                        points={chartPoints}
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>
                        ) : (
                            <div className="text-gray-400 mt-2 text-sm">{t('seo.ranks.history')}...</div>
                        )}
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold">{t('seo.ranks.history')}</h2>
                    </div>
                    <Table
                        columns={columns}
                        data={history || []}
                        keyExtractor={(h) => h.id}
                    />
                </div>
            </main>

            <RankUpdateModal
                open={showRankModal}
                keyword={keyword}
                organizationId={organizationId}
                onClose={() => setShowRankModal(false)}
            />
        </div>
    );
}
