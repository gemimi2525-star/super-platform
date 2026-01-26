'use client';

/**
 * Audit Log Table Component
 */

import { Card } from '@super-platform/ui';
import type { AuditLog } from '../types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'user.created': { label: 'User Created', color: 'bg-green-100 text-green-800' },
    'user.updated': { label: 'User Updated', color: 'bg-blue-100 text-blue-800' },
    'user.deleted': { label: 'User Deleted', color: 'bg-red-100 text-red-800' },
    'user.disabled': { label: 'User Disabled', color: 'bg-yellow-100 text-yellow-800' },
    'user.enabled': { label: 'User Enabled', color: 'bg-green-100 text-green-800' },
    'role.updated': { label: 'Role Updated', color: 'bg-purple-100 text-purple-800' },
    'login.success': { label: 'Login Success', color: 'bg-gray-100 text-gray-800' },
    'login.failed': { label: 'Login Failed', color: 'bg-red-100 text-red-800' },
};

interface AuditLogTableProps {
    logs: AuditLog[];
    loading?: boolean;
}

export function AuditLogTable({ logs, loading }: AuditLogTableProps) {
    if (loading) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500 animate-pulse">
                    Loading audit logs...
                </div>
            </Card>
        );
    }

    if (logs.length === 0) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500">
                    No audit logs found
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Timestamp
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Action
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Actor
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Target
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.map((log) => {
                            const actionInfo = ACTION_LABELS[log.action] || {
                                label: log.action,
                                color: 'bg-gray-100 text-gray-800',
                            };

                            return (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionInfo.color}`}>
                                            {actionInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {log.actorEmail}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.targetEmail || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <code className="text-xs bg-gray-100 px-1 rounded">
                                            {JSON.stringify(log.details).slice(0, 50)}
                                            {JSON.stringify(log.details).length > 50 ? '...' : ''}
                                        </code>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
