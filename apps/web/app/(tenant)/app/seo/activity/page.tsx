'use client';

import { useTranslations } from 'next-intl';
import { useAuditLogs } from '@modules/seo';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card, Table, Badge, Select, type ColumnDef } from '@platform/ui-kit';
import { useState } from 'react';
import type { AuditLog } from '@modules/seo';

export default function ActivityPage() {
    const t = useTranslations('seo.activity');
    const { currentOrganization } = useAuthStore();
    const { data: logs, isLoading } = useAuditLogs(currentOrganization?.id || '');

    const [filterType, setFilterType] = useState<string>('all');

    // Filter Logic
    const filteredLogs = logs?.filter(log => {
        if (filterType !== 'all') {
            return log.entity.type === filterType;
        }
        return true;
    }) || [];

    const getActionLabel = (action: string) => {
        const [type, act] = action.split('.');
        return t(`actions.${type}.${act}` as any);
    };

    const getActionColor = (action: string) => {
        if (action.includes('create') || action.includes('import')) return 'success';
        if (action.includes('delete')) return 'destructive';
        return 'default'; // update
    };

    const columns: ColumnDef<AuditLog>[] = [
        {
            key: 'date',
            header: t('table.date'),
            render: (log) => new Date(log.createdAt).toLocaleString()
        },
        {
            key: 'user',
            header: t('table.user'),
            render: (log) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{log.actor.email || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{log.actor.userId.slice(0, 6)}...</span>
                </div>
            )
        },
        {
            key: 'action',
            header: t('table.action'),
            render: (log) => (
                <Badge variant={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                </Badge>
            )
        },
        {
            key: 'details',
            header: t('table.details'),
            render: (log) => (
                <div className="max-w-md truncate">
                    <span className="font-medium">{log.entity.name}</span>
                    {log.metadata && (
                        <span className="text-gray-400 text-sm ml-2">
                            ({JSON.stringify(log.metadata)})
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                <div className="w-48">
                    <Select
                        value={filterType}
                        onChange={(value) => setFilterType(typeof value === 'string' ? value : value[0])}
                        options={[
                            { label: t('filters.allTypes'), value: 'all' },
                            { label: 'Keyword', value: 'keyword' },
                            { label: 'Page', value: 'page' },
                            { label: 'Rank', value: 'rank' },
                            { label: 'Import', value: 'import' },
                        ]}
                    />
                </div>
            </header>

            <Card>
                <Table
                    columns={columns}
                    data={filteredLogs}
                    loading={isLoading}
                    keyExtractor={(log) => log.id}
                    emptyMessage="No activity found"
                />
            </Card>
        </div>
    );
}
