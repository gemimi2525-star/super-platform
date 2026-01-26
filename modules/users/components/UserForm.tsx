'use client';

/**
 * User Form Component
 * 
 * Form for editing user details
 */

import { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import type { PlatformUser, UpdateUserRequest, PlatformRole } from '../types';

interface UserFormProps {
    user: PlatformUser;
    onSubmit: (data: UpdateUserRequest) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, loading }: UserFormProps) {
    const t = useTranslations('platform.userManagement');
    const tRoles = useTranslations('platform.roles');
    const tCommon = useTranslations('common');

    const [displayName, setDisplayName] = useState(user.displayName);
    const [role, setRole] = useState<PlatformRole>(user.role);
    const [enabled, setEnabled] = useState(user.enabled);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ displayName, role, enabled });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email')}
                </label>
                <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('displayName')}
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                </label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PlatformRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={user.role === 'owner'}
                >
                    <option value="user">{tRoles('user')}</option>
                    <option value="admin">{tRoles('admin')}</option>
                    {user.role === 'owner' && <option value="owner">{tRoles('owner')}</option>}
                </select>
            </div>

            <div className="flex items-center">
                <input
                    id="enabled"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                    disabled={user.role === 'owner'}
                />
                <label htmlFor="enabled" className="ml-2 text-sm text-gray-900">
                    {t('active')}
                </label>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                    {tCommon('cancel')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? tCommon('loading') : tCommon('save')}
                </button>
            </div>
        </form>
    );
}
