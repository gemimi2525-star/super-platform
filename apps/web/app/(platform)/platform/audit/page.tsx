'use client';

/**
 * Platform Audit Logs Viewer
 * 
 * Platform owner can view all audit log entries
 * Filters: orgId, action, date range
 * i18n: EN/TH/ZH
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Badge, Input, Button } from '@platform/ui-kit';
import { getAdminFirestore } from '@platform/firebase-admin';

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
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        orgId: '',
        action: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        try {
            const response = await fetch('/api/platform/audit-logs');
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    }

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

            <Card>
                <h2 className="text-lg font-semibold mb-4">{t('filters')}</h2>
                <div className="grid grid-cols-4 gap-4">
                    <Input
                        placeholder={t('filterOrgId')}
                        value={filters.orgId}
                        onChange={(e) => setFilters({ ...filters, orgId: e.target.value })}
                    />
                    <Input
                        placeholder={t('filterAction')}
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    />
                    <Input
                        type="date"
                        placeholder={t('startDate')}
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <Input
                        type="date"
                        placeholder={t('endDate')}
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
