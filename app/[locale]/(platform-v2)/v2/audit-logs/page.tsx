import React from 'react';
import { cookies, headers } from 'next/headers';
import { getAuthContext } from '@/lib/auth/server'; // requireOwner is available but we need custom redirect logic
import { getDictionary, tFromDict } from '@/lib/i18n/server';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Table, TableColumn } from '@/modules/design-system/src/components/Table';
import { Badge, BadgeVariant } from '@/modules/design-system/src/components/Badge';
import { EmptyState } from '@/modules/design-system/src/components/EmptyState';
import { redirect } from 'next/navigation';

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

async function getAuditLogs(): Promise<AuditLog[]> {
    try {
        const cookieStore = await cookies();
        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        // Relative fetch using absolute URL constructed from headers
        const response = await fetch(`${baseUrl}/api/platform/audit-logs?limit=50`, {
            headers: {
                Cookie: cookieStore.toString(),
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Failed to fetch audit logs:', response.status, response.statusText);
            return [];
        }

        const json = await response.json() as ApiResponse;
        const items = json.data?.items || [];

        return items.map((item) => ({
            id: item.id,
            timestamp: item.timestamp,
            actor: item.actor?.email || 'System',
            action: item.action,
            target: item.target?.name || `${item.target?.type}:${item.target?.id}` || 'Unknown',
            status: item.success ? 'success' : 'failure',
        }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AuditLogsPage({ params }: PageProps) {
    const { locale } = await params;
    const auth = await getAuthContext();
    const dict = await getDictionary(locale as any);
    const t = (key: string) => tFromDict(dict, key);

    // RBAC Check: Strict Owner Only with Locale-aware redirect
    // We do not use requireOwner() here because it redirects to /platform (no locale)
    if (!auth) {
        redirect(`/${locale}/auth/login`);
    }

    if (auth.role !== 'owner') {
        // RBAC Policy: Non-owners redirected to Dashboard, NOT Login
        redirect(`/${locale}/v2`);
    }

    const logs = await getAuditLogs();

    const columns: TableColumn<AuditLog>[] = [
        {
            key: 'timestamp',
            header: t('v2.audit.table.timestamp'),
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
            header: t('v2.audit.table.actor'),
            sortable: true,
            className: 'w-[250px]',
        },
        {
            key: 'action',
            header: t('v2.audit.table.action'),
            sortable: true,
            className: 'w-[200px]',
            render: (value) => <span className="font-medium">{String(value)}</span>,
        },
        {
            key: 'target',
            header: t('v2.audit.table.target'),
            className: 'w-[250px]',
        },
        {
            key: 'status',
            header: t('v2.audit.table.status'),
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
    ];

    if (!logs || logs.length === 0) {
        return (
            <div className="p-8">
                <PageHeader
                    title={t('v2.audit.title')}
                    subtitle={t('v2.audit.subtitle')}
                />
                <div className="mt-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
                    <EmptyState
                        variant="empty"
                        title={t('v2.audit.empty.title')}
                        message={t('v2.audit.empty.description')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title={t('v2.audit.title')}
                subtitle={t('v2.audit.subtitle')}
            />

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                <Table
                    columns={columns}
                    data={logs}
                    // Client-side sorting on the fetched set for now
                    sortKey="timestamp"
                    sortDirection="desc"
                />
            </div>
        </div>
    );
}
