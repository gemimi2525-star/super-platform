'use client';

/**
 * User List Component
 * 
 * Displays a table of platform users
 */

import { useTranslations } from '@/lib/i18n';
import { Card } from '@super-platform/ui';
import type { PlatformUser, PlatformRole } from '../types';

const ROLE_COLORS: Record<PlatformRole, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-800',
};

interface UserListProps {
    users: PlatformUser[];
    loading?: boolean;
    onUserClick?: (user: PlatformUser) => void;
}

export function UserList({ users, loading, onUserClick }: UserListProps) {
    const t = useTranslations('platform.userManagement');
    const tRoles = useTranslations('platform.roles');

    if (loading) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500 animate-pulse">
                    {t('loading')}
                </div>
            </Card>
        );
    }

    if (users.length === 0) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500">
                    {t('noUsers')}
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
                                {t('user')}
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                {t('role')}
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                {t('status')}
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                {t('created')}
                            </th>
                            <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                                {t('actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.uid} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {user.displayName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                                        {tRoles(user.role).toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.enabled ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                                            {t('active')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                                            {t('disabled')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onUserClick?.(user)}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        {t('edit')} →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
