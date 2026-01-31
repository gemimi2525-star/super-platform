'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlatformRole } from '@/lib/roles/service';
import { useTranslations } from '@/lib/i18n';
import { useApi } from '@/lib/hooks/useApi';
import { notifySuccess, notifyError, notifyLoading } from '@/lib/ui/notify';
import { toast } from 'sonner';

// Import reusable table components
import {
    TableToolbar,
    TableLoadingSkeleton,
    TableEmptyState,
    TableErrorAlert,
    DataTableFooter,
} from '@/components/platform/tables';
import type { TableDensity } from '@/components/platform/tables';

interface RolesListProps {
    initialRoles: PlatformRole[];
}

export default function RolesList({ initialRoles }: RolesListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('platform.roles');

    // Extract locale from pathname
    const localeMatch = pathname?.match(/^\/(en|th)\//);
    const locale = localeMatch?.[1] || 'en';

    // API state
    const { data: fetchedRoles, error: apiError, loading: apiLoading, refetch } = useApi<PlatformRole[]>('/api/roles', { skip: true });

    // Use fetched roles if available, otherwise use initial roles
    const roles = fetchedRoles || initialRoles;
    const [loading, setLoading] = useState(false);

    // Table state (search, pagination, density)
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [density, setDensity] = useState<TableDensity>('default');

    // Filter roles by search query
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Paginate filtered roles
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    // Delete handler with instrumentation
    const handleDelete = async (id: string) => {
        // 🔍 INSTRUMENTATION: Log intent
        console.log('[RolesList] Delete clicked for role:', id);

        // Safe confirm dialog handling
        try {
            if (typeof window !== 'undefined' && window.confirm) {
                const confirmed = window.confirm(t('messages.deleteConfirm'));
                console.log('[RolesList] Confirmed:', confirmed);
                if (!confirmed) return;
            } else {
                // If confirm is not available, log warning and proceed (or fail safe)
                // For production/browser, window.confirm should exist. 
                console.warn('[RolesList] window.confirm not available');
            }
        } catch (e) {
            console.error('[RolesList] Confirm dialog failed:', e);
            return;
        }

        const toastId = notifyLoading('Deleting role...');

        try {
            setLoading(true);

            // 🔍 INSTRUMENTATION: Log before request
            console.log('[RolesList] Sending DELETE request to:', `/api/roles/${id}`);

            const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });

            // 🔍 INSTRUMENTATION: Log response
            console.log('[RolesList] Response status:', res.status);
            console.log('[RolesList] Response ok:', res.ok);

            const data = await res.json();
            console.log('[RolesList] Response data:', data);

            if (!res.ok) {
                // Handle 403 Forbidden specifically
                if (res.status === 403) {
                    throw new Error(t('messages.forbidden.delete'));
                }
                // Extract error message from API response structure
                const errorMessage = data.error?.message || data.error || 'Failed to delete';
                console.error('[RolesList] Delete failed:', errorMessage);
                throw new Error(errorMessage);
            }

            await refetch();
            router.refresh();

            toast.dismiss(toastId);
            notifySuccess('Role deleted successfully');
            console.log('[RolesList] Role deleted successfully');
        } catch (error: any) {
            toast.dismiss(toastId);
            // Ensure error message is a string, not an object
            const errorMessage = typeof error.message === 'string'
                ? error.message
                : 'Failed to delete role';
            console.error('[RolesList] Delete error:', error);
            console.error('[RolesList] Error message:', errorMessage);
            notifyError({ type: 'toast', message: errorMessage, originalError: null as any });
        } finally {
            setLoading(false);
        }
    };

    // Copy handler (keep existing logic)
    const handleCopy = async (role: PlatformRole) => {
        const defaultName = t('messages.copyDefaultName', { name: role.name });
        const promptMsg = t('messages.copyPrompt', { name: role.name });

        const newName = prompt(promptMsg, defaultName);
        if (!newName) return;

        const toastId = notifyLoading('Copying role...');

        try {
            setLoading(true);
            const res = await fetch('/api/roles/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceRoleId: role.id, newName }),
            });

            if (!res.ok) {
                // Handle 403 Forbidden specifically
                if (res.status === 403) {
                    throw new Error(t('messages.forbidden.copy'));
                }
                throw new Error('Failed to copy');
            }

            const response = await res.json();
            const newRoleId = response.data?.id || response.id;

            toast.dismiss(toastId);
            notifySuccess('Role copied successfully');
            router.push(`/${locale}/platform/roles/${newRoleId}`);
        } catch (error: any) {
            toast.dismiss(toastId);
            notifyError({ type: 'toast', message: error.message || 'Failed to copy role', originalError: null as any });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar: Search + Rows per page + Density */}
            <TableToolbar
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                searchPlaceholder={t('toolbar.searchPlaceholder')}
                selectedCount={0}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={setRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                rowsPerPageLabel={(count) => t('toolbar.rowsPerPage', { count })}
                density={density}
                onDensityChange={setDensity}
                densityLabels={{
                    default: t('toolbar.density.default'),
                    dense: t('toolbar.density.dense')
                }}
                showDensityToggle={true}
                showRowsPerPage={true}
            />

            {/* Error State */}
            {
                apiError && (
                    <TableErrorAlert
                        message={apiError.message || t('error.general')}
                        onRetry={refetch}
                        retryLabel={t('error.retry')}
                    />
                )
            }

            {/* Loading State */}
            {
                apiLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        < TableLoadingSkeleton rows={5} />
                    </div >
                ) : filteredRoles.length === 0 ? (
                    /* Empty States */
                    searchQuery ? (
                        <TableEmptyState
                            icon="🔍"
                            title={t('empty.noMatch.title')}
                            description={t('empty.noMatch.description')}
                        />
                    ) : (
                        <TableEmptyState
                            icon="👥"
                            title={t('empty.title')}
                            description={t('empty.description')}
                            action={
                                <Link
                                    href={`/${locale}/platform/roles/create`}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {t('empty.action')}
                                </Link>
                            }
                        />
                    )
                ) : (
                    /* Roles List Container */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                        {/* Mobile View: Card List (< md) */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {paginatedRoles.map((role) => (
                                <div key={role.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900 truncate">
                                                    {role.name}
                                                </span>
                                                {role.isSystem ? (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-800">
                                                        {t('status.system')}
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 text-green-800">
                                                        {t('status.custom')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2">
                                                {role.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mobile Actions Data Grid */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                        <span className="text-xs font-mono text-gray-400">{role.id}</span>
                                        <div className="flex gap-3">
                                            <Link
                                                href={`/${locale}/platform/roles/${role.id}`}
                                                className="text-sm font-medium text-blue-600"
                                            >
                                                {t('actions.edit')}
                                            </Link>
                                            <button
                                                onClick={() => handleCopy(role)}
                                                className="text-sm font-medium text-gray-600"
                                            >
                                                {t('actions.copy')}
                                            </button>
                                            {!role.isSystem && (
                                                <button
                                                    onClick={() => handleDelete(role.id)}
                                                    className="text-sm font-medium text-red-600"
                                                >
                                                    {t('actions.delete')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View: Table (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.name')}</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.description')}</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.type')}</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedRoles.map((role) => (
                                        <tr
                                            key={role.id}
                                            className={`hover:bg-gray-50 transition-colors`}
                                        >
                                            <td className={`px-6 whitespace-nowrap ${density === 'dense' ? 'py-3' : 'py-4'}`}>
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{role.name}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-1 truncate max-w-xs">{role.id}</div>
                                            </td>
                                            <td className={`px-6 ${density === 'dense' ? 'py-3' : 'py-4'}`}>
                                                <div className="text-sm text-gray-500 truncate max-w-md">{role.description}</div>
                                            </td>
                                            <td className={`px-6 whitespace-nowrap ${density === 'dense' ? 'py-3' : 'py-4'}`}>
                                                {role.isSystem ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {t('status.system')}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {t('status.custom')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-6 whitespace-nowrap text-sm font-medium space-x-3 ${density === 'dense' ? 'py-3' : 'py-4'}`}>
                                                <Link
                                                    href={`/${locale}/platform/roles/${role.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    {t('actions.edit')}
                                                </Link>
                                                <button
                                                    onClick={() => handleCopy(role)}
                                                    disabled={loading}
                                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                                >
                                                    {t('actions.copy')}
                                                </button>
                                                {!role.isSystem && (
                                                    <button
                                                        onClick={() => handleDelete(role.id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                    >
                                                        {t('actions.delete')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer: Pagination */}
                        <DataTableFooter
                            from={startIndex + 1}
                            to={Math.min(endIndex, filteredRoles.length)}
                            total={filteredRoles.length}
                            paginationText={
                                t('pagination.text', {
                                    from: startIndex + 1,
                                    to: Math.min(endIndex, filteredRoles.length),
                                    total: filteredRoles.length
                                })}
                        />
                    </div>
                )}
        </div >
    );
}
