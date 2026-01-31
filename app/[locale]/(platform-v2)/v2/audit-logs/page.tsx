'use client';

/**
 * Audit Logs Page
 * 
 * STEP 4 Fix: Converted from Server to Client Component
 * because Table requires onClick handlers and column render functions
 * are not serializable from Server to Client components.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Table, TableColumn } from '@/modules/design-system/src/components/Table';
import { Badge, BadgeVariant } from '@/modules/design-system/src/components/Badge';
import { EmptyState } from '@/modules/design-system/src/components/EmptyState';
import { Button } from '@/modules/design-system/src/components/Button';
import { RefreshCw } from 'lucide-react';

interface AuditLog {
    [key: string]: unknown;
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
    status: 'success' | 'failure';
}

interface ApiAuditLog {
    id: string;
    timestamp: string;
    actor: { email?: string; uid?: string; displayName?: string };
    action: string;
    target: { type: string; id: string; name?: string };
    success: boolean;
}

interface ApiResponse {
    success: boolean;
    data: {
        items: ApiAuditLog[];
    };
}

export default function AuditLogsPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || 'en';

    const t = useTranslations('v2.audit');
    const tCommon = useTranslations('v2.common');
    const tBreadcrumb = useTranslations('v2.breadcrumb');

    // State
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    // Fetch audit logs
    async function fetchAuditLogs() {
        try {
            setLoading(true);
            setError(null);
            setForbidden(false);

            const response = await fetch('/api/platform/audit-logs?limit=50', {
                credentials: 'include',
            });

            if (response.status === 401) {
                router.push(`/${locale}/auth/login`);
                return;
            }

            if (response.status === 403) {
                setForbidden(true);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const json = await response.json() as ApiResponse;
            const items = json.data?.items || [];

            const mappedLogs: AuditLog[] = items.map((item) => ({
                id: item.id,
                timestamp: item.timestamp,
                actor: item.actor?.email || 'System',
                action: item.action,
                target: item.target?.name || `${item.target?.type}:${item.target?.id}` || 'Unknown',
                status: item.success ? 'success' : 'failure',
            }));

            setLogs(mappedLogs);
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    // Table columns
    const columns: TableColumn<AuditLog>[] = useMemo(() => [
        {
            key: 'timestamp',
            header: t('table.timestamp'),
            sortable: true,
            className: 'w-[200px]',
            render: (value) => {
                try {
                    return new Date(String(value)).toLocaleString(locale);
                } catch {
                    return String(value);
                }
            }
        },
        {
            key: 'actor',
            header: t('table.actor'),
            sortable: true,
            className: 'w-[250px]',
        },
        {
            key: 'action',
            header: t('table.action'),
            sortable: true,
            className: 'w-[200px]',
            render: (value) => <span className="font-medium">{String(value)}</span>,
        },
        {
            key: 'target',
            header: t('table.target'),
            className: 'w-[250px]',
        },
        {
            key: 'status',
            header: t('table.status'),
            className: 'w-[150px]',
            render: (_, row) => {
                const variant: BadgeVariant = row.status === 'success' ? 'success' : 'danger';
                return (
                    <Badge variant={variant} size="sm" dot>
                        {row.status.toUpperCase()}
                    </Badge>
                );
            },
        },
    ], [t, locale]);

    // Loading state
    if (loading) {
        return (
            <div className="p-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tBreadcrumb('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="mt-8 bg-white rounded-lg border border-neutral-200 shadow-sm p-12 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                        <div className="h-4 w-48 bg-neutral-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Forbidden state (not owner)
    if (forbidden) {
        return (
            <div className="p-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tBreadcrumb('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="mt-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
                    <EmptyState
                        variant="error"
                        title={tCommon('forbidden')}
                        message={tCommon('forbiddenMessage')}
                    />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tBreadcrumb('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="mt-8 bg-white rounded-lg border border-red-200 shadow-sm p-12 text-center">
                    <div className="text-red-600 mb-4">
                        <span className="text-xl font-semibold">{tCommon('error')}</span>
                        <p className="text-sm mt-2">{error}</p>
                    </div>
                    <Button variant="ghost" onClick={fetchAuditLogs}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {tCommon('retry')}
                    </Button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!logs || logs.length === 0) {
        return (
            <div className="p-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tBreadcrumb('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="mt-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
                    <EmptyState
                        variant="empty"
                        title={t('empty.title')}
                        message={t('empty.description')}
                    />
                </div>
            </div>
        );
    }

    // Main content with data
    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                breadcrumbs={[
                    { label: tBreadcrumb('home'), href: `/${locale}/v2` },
                    { label: t('title') },
                ]}
            />

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                <Table
                    columns={columns}
                    data={logs}
                    sortKey="timestamp"
                    sortDirection="desc"
                />
            </div>
        </div>
    );
}
