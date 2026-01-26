'use client';

/**
 * Platform Organizations Management Page
 * 
 * List all organizations with ability to:
 * - View all tenants
 * - Create new organizations (UI only, no functionality yet)
 * - Search and filter
 * 
 * UI: Standardized to Design System patterns (matching Users/Roles)
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { Card } from '@super-platform/ui';
import {
    TableToolbar,
    TableLoadingSkeleton,
    TableEmptyState,
    DataTableFooter
} from '@/components/platform/tables';
import type { TableDensity } from '@/components/platform/tables';

interface Organization {
    id: string;
    name: string;
    slug?: string;
    plan?: string;
    createdAt?: string;
    disabled?: boolean;
}

// Plan badge colors (Design System tokens)
const PLAN_COLORS: Record<string, string> = {
    free: 'bg-[#F5F5F5] text-[#525252]',
    starter: 'bg-[#E6F1FC] text-[#0F6FDE]',
    pro: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-[#FFF4E6] text-[#D97706]',
};

export default function PlatformOrgsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.match(/^\/(en|th|zh)\//)?.[1] || 'en';
    const t = useTranslations('platform.orgs');

    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [density, setDensity] = useState<TableDensity>('default');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [disablingOrg, setDisablingOrg] = useState<Organization | null>(null);
    const [platformRole, setPlatformRole] = useState<string | null>(null);

    useEffect(() => {
        fetchOrgs();
        fetchPlatformRole();
    }, []);

    async function fetchOrgs() {
        try {
            setLoading(true);
            const response = await fetch('/api/platform/orgs');
            if (response.ok) {
                const data = await response.json();
                setOrgs(data.organizations || []);
            }
        } catch (error) {
            console.error('Failed to fetch orgs', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchPlatformRole() {
        try {
            const response = await fetch('/api/platform/me');
            if (response.ok) {
                const data = await response.json();
                setPlatformRole(data.role);
            }
        } catch (error) {
            console.error('Failed to fetch platform role', error);
        }
    }

    // Filter organizations: exclude disabled and apply search
    const filteredOrgs = orgs.filter(org => {
        // Exclude disabled organizations
        if (org.disabled === true) return false;

        // Apply search filter
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();
        return (
            org.name.toLowerCase().includes(searchLower) ||
            org.slug?.toLowerCase().includes(searchLower) ||
            org.id.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const paginatedOrgs = filteredOrgs.slice(0, rowsPerPage);

    // Search handler
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    // Permission check: Only owner/admin can create organizations
    const canCreateOrg = platformRole === 'owner' || platformRole === 'admin';
    const canEditOrg = platformRole === 'owner' || platformRole === 'admin';
    const canDisableOrg = platformRole === 'owner';

    return (
        <div className="space-y-6">
            {/* Header - Design System Pattern */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#242424]">{t('title')}</h1>
                        <p className="text-[#6B6B6B] mt-1">{t('subtitle')}</p>
                    </div>
                    {/* Show CTA when orgs exist (enterprise pattern) */}
                    {!loading && orgs.length > 0 && canCreateOrg && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg hover:bg-[#0A5AC4] transition-colors duration-150 font-medium text-sm whitespace-nowrap"
                        >
                            ➕ {t('createButton')}
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar - Reusable Component */}
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

            {/* Organizations Table - Design System Pattern */}
            <Card>
                {loading ? (
                    // Loading State - Reusable Component
                    <div className="p-6">
                        <TableLoadingSkeleton rows={5} />
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    // Empty State - Reusable Component
                    <TableEmptyState
                        icon="🏢"
                        title={searchQuery ? t('noOrgs') : t('empty.title')}
                        description={searchQuery
                            ? `No organizations match "${searchQuery}"`
                            : t('empty.description')}
                        action={!searchQuery && canCreateOrg ? (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg hover:bg-[#0A5AC4] transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                ➕ {t('createButton')}
                            </button>
                        ) : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
                                <tr>
                                    <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                        {t('table.name')}
                                    </th>
                                    <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                        {t('table.slug')}
                                    </th>
                                    <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                        {t('table.plan')}
                                    </th>
                                    <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                        {t('table.created')}
                                    </th>
                                    <th className={`text-right ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                        {t('table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E8E8]">
                                {paginatedOrgs.map((org) => (
                                    <tr
                                        key={org.id}
                                        className="hover:bg-[#F5F5F5] transition-colors duration-150"
                                    >
                                        <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                            <div className="max-w-[300px]">
                                                <div className="font-medium text-[#242424] truncate" title={org.name}>
                                                    {org.name}
                                                </div>
                                                <div className="text-xs text-[#8E8E8E] font-mono truncate mt-1" title={org.id}>
                                                    {org.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'} text-sm text-[#525252]`}>
                                            <code className="bg-[#F5F5F5] px-2 py-0.5 rounded text-xs">
                                                {org.slug || '-'}
                                            </code>
                                        </td>
                                        <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan || 'free'] || PLAN_COLORS.free}`}>
                                                {(org.plan || 'Free').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`${density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'} text-sm text-[#8E8E8E]`}>
                                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString(locale, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : '-'}
                                        </td>
                                        <td className={`${density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'} text-right space-x-3`}>
                                            <button
                                                onClick={() => router.push(`/${locale}/platform/orgs/${org.id}`)}
                                                className="text-[#0F6FDE] hover:underline text-sm font-medium"
                                            >
                                                {t('actions.view')}
                                            </button>
                                            {canEditOrg && (
                                                <button
                                                    onClick={() => {
                                                        setEditingOrg(org);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-[#0F6FDE] hover:underline text-sm font-medium"
                                                >
                                                    {t('actions.edit')}
                                                </button>
                                            )}
                                            {canDisableOrg && (
                                                <button
                                                    onClick={() => {
                                                        setDisablingOrg(org);
                                                        setShowDisableModal(true);
                                                    }}
                                                    disabled={org.disabled === true}
                                                    className="text-[#DC2626] hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {t('actions.disable')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer - Reusable Component */}
                        {filteredOrgs.length > 0 && (
                            <DataTableFooter
                                from={1}
                                to={Math.min(rowsPerPage, filteredOrgs.length)}
                                total={filteredOrgs.length}
                                paginationText={`Showing ${1} to ${Math.min(rowsPerPage, filteredOrgs.length)} of ${filteredOrgs.length} organizations`}
                            />
                        )}
                    </div>
                )}
            </Card>

            {/* Create Organization Modal */}
            {showCreateModal && (
                <CreateOrganizationModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchOrgs();
                    }}
                />
            )}

            {/* Edit Organization Modal */}
            {showEditModal && editingOrg && (
                <EditOrganizationModal
                    org={editingOrg}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingOrg(null);
                    }}
                    onUpdated={() => {
                        setShowEditModal(false);
                        setEditingOrg(null);
                        fetchOrgs();
                    }}
                />
            )}

            {/* Disable Organization Confirmation Modal */}
            {showDisableModal && disablingOrg && (
                <ConfirmDisableModal
                    org={disablingOrg}
                    onClose={() => {
                        setShowDisableModal(false);
                        setDisablingOrg(null);
                    }}
                    onDisabled={() => {
                        setShowDisableModal(false);
                        setDisablingOrg(null);
                        fetchOrgs();
                    }}
                />
            )}
        </div>
    );
}

// =============================================================================
// Create Organization Modal
// =============================================================================

interface CreateOrganizationModalProps {
    onClose: () => void;
    onCreated: () => void;
}

function CreateOrganizationModal({ onClose, onCreated }: CreateOrganizationModalProps) {
    const t = useTranslations('platform.orgs.create');
    const tCommon = useTranslations('common');

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>('free');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Client-side slug validation
    const isValidSlug = (value: string) => {
        return /^[a-z0-9-]+$/.test(value);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation
        if (slug && !isValidSlug(slug)) {
            setError(t('error.invalidSlug'));
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/platform/orgs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle specific error codes
                if (res.status === 403) {
                    setError(t('error.forbidden'));
                } else if (res.status === 409) {
                    setError(t('error.duplicateSlug'));
                } else if (data.error?.message) {
                    setError(data.error.message);
                } else {
                    setError(t('error.general'));
                }
                setLoading(false);
                return;
            }

            // Success - close and refresh
            onCreated();

        } catch (err: unknown) {
            setError(t('error.general'));
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('slug')}</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase())}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('slugPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('slugHelper')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('plan')}</label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value as typeof plan)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="free">{t('planFree')}</option>
                            <option value="starter">{t('planStarter')}</option>
                            <option value="pro">{t('planPro')}</option>
                            <option value="enterprise">{t('planEnterprise')}</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            {tCommon('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t('creating') : t('submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================================================
// Edit Organization Modal (UI Only - No PATCH API yet)
// =============================================================================

interface EditOrganizationModalProps {
    org: Organization;
    onClose: () => void;
    onUpdated: () => void;
}

function EditOrganizationModal({ org, onClose, onUpdated }: EditOrganizationModalProps) {
    const t = useTranslations('platform.orgs.edit');
    const tCommon = useTranslations('common');

    // Prefill from existing org
    const [name, setName] = useState(org.name);
    const [slug, setSlug] = useState(org.slug || '');
    const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>((org.plan as any) || 'free');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Client-side slug validation
    const isValidSlug = (value: string) => {
        return /^[a-z0-9-]+$/.test(value);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation
        if (slug && !isValidSlug(slug)) {
            setError(t('error.invalidSlug'));
            setLoading(false);
            return;
        }

        // Build minimal v1 payload
        const payload = { name, slug, plan };

        try {
            const res = await fetch(`/api/platform/orgs/${org.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Try to parse response safely
            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // Response might not have JSON body
            }

            if (res.ok) {
                // Success - close and refresh
                onUpdated();
                return;
            }

            // Handle error responses
            if (res.status === 403) {
                setError(t('error.forbidden'));
            } else if (res.status === 409) {
                setError(t('error.duplicateSlug'));
            } else if (res.status === 400) {
                setError(data.error?.message || t('error.general'));
            } else if (res.status === 404) {
                setError(data.error?.message || t('error.general'));
            } else {
                setError(t('error.general'));
            }
            setLoading(false);

        } catch (err: unknown) {
            setError(t('error.general'));
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('namePlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('slug')}</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase())}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('slugPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('slugHelper')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('plan')}</label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value as typeof plan)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="free">{t('planFree')}</option>
                            <option value="starter">{t('planStarter')}</option>
                            <option value="pro">{t('planPro')}</option>
                            <option value="enterprise">{t('planEnterprise')}</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            {tCommon('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t('saving') : t('submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =============================================================================
// Confirm Disable Organization Modal
// =============================================================================

interface ConfirmDisableModalProps {
    org: Organization;
    onClose: () => void;
    onDisabled: () => void;
}

function ConfirmDisableModal({ org, onClose, onDisabled }: ConfirmDisableModalProps) {
    const t = useTranslations('platform.orgs.disable');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleConfirm() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/platform/orgs/${org.id}`, {
                method: 'DELETE',
            });

            // Try to parse response safely
            let data: any = {};
            try {
                data = await res.json();
            } catch {
                // Response might not have JSON body
            }

            if (res.ok) {
                // Success - close and refresh
                onDisabled();
                return;
            }

            // Handle error responses
            if (res.status === 404) {
                setError(t('error.notFound'));
            } else if (res.status === 403) {
                setError(t('error.forbidden'));
            } else {
                setError(data.error?.message || t('error.general'));
            }
            setLoading(false);

        } catch (err: unknown) {
            setError(t('error.general'));
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{t('confirmTitle')}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>

                    <div className="text-sm text-gray-600">
                        {t('confirmDescription')}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>{org.name}</strong>
                            {org.slug && (
                                <span className="text-xs text-yellow-600 ml-2">({org.slug})</span>
                            )}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            {t('cancelButton')}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? t('disabling') : t('confirmButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
