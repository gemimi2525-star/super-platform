'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PermissionMatrix from './PermissionMatrix';
import { useTranslations } from '@/lib/i18n';

interface RoleFormProps {
    initialData?: {
        name: string;
        description: string;
        permissions: string[];
        isSystem?: boolean;
    };
    onSubmit: (data: any) => Promise<void>;
    title?: string; // Optional now, since we handle it inside or pass strictly
    mode: 'create' | 'edit'; // Helper to pick title
}

export default function RoleForm({ initialData, onSubmit, mode }: RoleFormProps) {
    const router = useRouter();
    const t = useTranslations('platform.roles.form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        permissions: initialData?.permissions || [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            router.push('/platform/roles');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const pageTitle = mode === 'create'
        ? t('createTitle')
        : t('editTitle', { name: initialData?.name || '' });

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t('saving') : t('save')}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('nameLabel')}
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('descLabel')}
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('descPlaceholder')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('permissionsTitle')}</h2>
                <p className="text-sm text-gray-500">
                    {t('permissionsDesc')}
                </p>

                <PermissionMatrix
                    selectedPermissions={formData.permissions}
                    onChange={(perms) => setFormData({ ...formData, permissions: perms })}
                    disabled={false}
                />
            </div>
        </form>
    );
}
