'use client';

import { use } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Card, Table, type ColumnDef, Badge } from '@super-platform/ui';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { platformGlobalRead } from '@/modules/platform';
import type { Keyword, Page, AuditLog } from '@/modules/seo';

/**
 * Platform: Organization Detail (Read-Only)
 * Platform Owner can view all org data via global read
 * ALL reads logged to platform_audit_logs
 */
export default function PlatformOrgDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
    const resolvedParams = use(params);
    const { orgId } = resolvedParams;
    const t = useTranslations();
    const { firebaseUser } = useAuthStore();

    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [pages, setPages] = useState<Page[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState({ keywordsCount: 0, pagesCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOrgData() {
            if (!firebaseUser?.uid) return;

            try {
                const [kw, pg, stats, logs] = await Promise.all([
                    platformGlobalRead.getOrgKeywords(orgId, firebaseUser.uid),
                    platformGlobalRead.getOrgPages(orgId, firebaseUser.uid),
                    platformGlobalRead.getOrgStats(orgId, firebaseUser.uid),
                    platformGlobalRead.getOrgAuditLogs(orgId, firebaseUser.uid, 20)
                ]);

                setKeywords(kw);
                setPages(pg);
                setStats(stats);
                setAuditLogs(logs);
            } catch (error) {
                console.error('[PLATFORM READ ERROR]', error);
            } finally {
                setLoading(false);
            }
        }

        loadOrgData();
    }, [orgId, firebaseUser]);

    const keywordColumns: ColumnDef<Keyword>[] = [
        {
            key: 'term',
            header: 'Keyword',
            render: (kw) => kw.term
        },
        {
            key: 'rank',
            header: 'Current Rank',
            render: (kw) => kw.ranking?.currentPosition ? `#${kw.ranking.currentPosition}` : '-'
        }
    ];

    const pageColumns: ColumnDef<Page>[] = [
        {
            key: 'title',
            header: 'Page Title',
            render: (pg) => pg.title || pg.url
        },
        {
            key: 'url',
            header: 'URL',
            render: (pg) => (
                <a href={pg.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate max-w-xs block">
                    {pg.url}
                </a>
            )
        }
    ];

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <a href="/platform/tenants" className="text-blue-600 hover:underline mb-2 block">
                        ← Back to Organizations
                    </a>
                    <h1 className="text-2xl font-bold">Organization: {orgId}</h1>
                    <Badge variant="warning" className="mt-2">Global Read-Only Access</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <Card>
                        <div className="text-3xl font-bold">{stats.keywordsCount}</div>
                        <div className="text-sm text-gray-600">Keywords</div>
                    </Card>
                    <Card>
                        <div className="text-3xl font-bold">{stats.pagesCount}</div>
                        <div className="text-sm text-gray-600">Pages</div>
                    </Card>
                </div>
            </header>

            <section>
                <h2 className="text-xl font-semibold mb-4">Keywords ({keywords.length})</h2>
                <Card>
                    <Table
                        columns={keywordColumns}
                        data={keywords.slice(0, 10)}
                        keyExtractor={(kw) => kw.id}
                        emptyMessage="No keywords found"
                    />
                </Card>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Pages ({pages.length})</h2>
                <Card>
                    <Table
                        columns={pageColumns}
                        data={pages.slice(0, 10)}
                        keyExtractor={(pg) => pg.id}
                        emptyMessage="No pages found"
                    />
                </Card>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <Card>
                    <div className="space-y-2">
                        {auditLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="text-sm border-b pb-2">
                                <span className="font-medium">{log.action}</span> - {log.entity.name}
                                <span className="text-gray-500 ml-2">
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </section>
        </div>
    );
}
