import React from 'react';
import { cookies } from 'next/headers';
import { getAuthContext, requirePlatformAccess } from '@/lib/auth/server';
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
        const cookieStore = cookies();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

export default async function AuditLogsPage() {
    const auth = await getAuthContext();

    // RBAC Check: Only Owner can view audit logs
    if (!auth || auth.role?.toLowerCase() !== 'owner') {
        redirect('/platform'); // 403 Forbidden - Redirect for safety
    }

    try {
        await requirePlatformAccess();
    } catch (error) {
        redirect('/platform');
    }

    const logs = await getAuditLogs();

    const columns: TableColumn<AuditLog>[] = [
        {
            key: 'timestamp',
            header: 'Timestamp',
            sortable: true,
            className: 'w-[200px]', // Keep existing width
            render: (value) => {
                try {
                    return new Date(String(value)).toLocaleString();
                } catch {
                    return String(value);
                }
            }
        },
        {
            key: 'actor',
            header: 'Actor',
            sortable: true,
            className: 'w-[250px]',
        },
        {
            key: 'action',
            header: 'Action',
            sortable: true,
            className: 'w-[200px]',
            render: (value) => <span className="font-medium">{String(value)}</span>,
        },
        {
            key: 'target',
            header: 'Target',
            className: 'w-[250px]',
        },
        {
            key: 'status',
            header: 'Status',
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
                    title="Audit Logs"
                    subtitle="Security event history for platform administrators"
                />
                <div className="mt-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
                    <EmptyState
                        variant="empty"
                        title="No Audit Logs"
                        message="There are no audit log entries to display."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Audit Logs"
                subtitle="Security event history for platform administrators"
            />

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                <Table
                    columns={columns}
                    data={logs}
                    // Client-side sorting on the fetched set for now
                    // Note: Ideally sorting should be server-side, but keeping UI unchanged
                    // as Table supports client sort
                    sortKey="timestamp"
                    sortDirection="desc"
                />
            </div>
        </div>
    );
}
