'use client';

/**
 * Platform Audit Logs Viewer
 * 
 * Platform owner can view all audit log entries
 * Filters: orgId, action, date range
 * i18n: EN/TH/ZH
 */

import { useState, useEffect } from 'react';
import { useTranslations } from '@/lib/i18n';
import { Card, Badge, Input, Button } from '@super-platform/ui';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { useApi } from '@/lib/hooks/useApi';
import ApiErrorBanner from '@/components/common/ApiErrorBanner';

interface AuditLog {
    id: string;
    actorId: string;
    action: string;
    orgId?: string;
    entityType?: string;
    path?: string;
    timestamp: any;
}

export default function PlatformAuditPage() {
    const t = useTranslations('platform.audit');

    // Use useApi hook for type-safe API consumption
    // API returns { items: AuditLog[], nextCursor: ... }
    const { data: response, error, loading } = useApi<{ items: AuditLog[] }>('/api/platform/audit-logs');
    const logs = response?.items || [];

    const [filters, setFilters] = useState({
        orgId: '',
        action: '',
        startDate: '',
        endDate: ''
    });

    const filteredLogs = logs.filter(log => {
        if (filters.orgId && !log.orgId?.includes(filters.orgId)) return false;
        if (filters.action && log.action !== filters.action) return false;
        // Date filtering would go here
        return true;
    });

    return (
        <div className="p-8 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-gray-600">{t('description')}</p>
            </header>

            {/* Error Display */}
            <ApiErrorBanner error={error} />

            <Card>
                <h2 className="text-lg font-semibold mb-4">{t('filters')}</h2>
                <div className="grid grid-cols-4 gap-4">
                    <Input
                        placeholder={t('filterOrgId')}
                        value={filters.orgId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, orgId: e.target.value })}
                    />
                    <Input
                        placeholder={t('filterAction')}
                        value={filters.action}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, action: e.target.value })}
                    />
                    <Input
                        type="date"
                        placeholder={t('startDate')}
                        value={filters.startDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <Input
                        type="date"
                        placeholder={t('endDate')}
                        value={filters.endDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </div>
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t('logs')}</h2>
                    <Badge>{filteredLogs.length} {t('entries')}</Badge>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">{t('loading')}</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">{t('noLogs')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left py-3 px-4">{t('timestamp')}</th>
                                    <th className="text-left py-3 px-4">{t('actor')}</th>
                                    <th className="text-left py-3 px-4">{t('action')}</th>
                                    <th className="text-left py-3 px-4">{t('orgId')}</th>
                                    <th className="text-left py-3 px-4">{t('entityType')}</th>
                                    <th className="text-left py-3 px-4">{t('path')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm">
                                            {log.timestamp?.toDate?.()?.toLocaleString() || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-mono">{log.actorId}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant={log.action.startsWith('owner.') ? 'warning' : 'default'}>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{log.orgId || '-'}</td>
                                        <td className="py-3 px-4 text-sm">{log.entityType || '-'}</td>
                                        <td className="py-3 px-4 text-sm font-mono text-gray-600">{log.path || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
