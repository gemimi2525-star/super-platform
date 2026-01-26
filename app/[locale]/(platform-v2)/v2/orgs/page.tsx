'use client';

/**
 * Platform V2 Organizations Page
 * Full CRUD operations with Create/Edit/Disable modals
 * 
 * Phase 15/16 Compliant: ZERO inline styles, 100% design-system
 * 
 * Features:
 * - Real API data from /api/platform/orgs
 * - Permission-based UI gating (Owner/Admin/User)
 * - Full CRUD: Create/Edit/Disable modals
 * - Error handling (403/500/empty/network)
 * - Client-side search & filter
 * - Toast notifications
 * - 100% design-system components
 * - i18n EN/TH/ZH
 */

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
import { Button } from '@/modules/design-system/src/components/Button';
import { Input } from '@/modules/design-system/src/components/Input';
import { Select } from '@/modules/design-system/src/components/Select';
import { Table } from '@/modules/design-system/src/components/Table';
import { Badge } from '@/modules/design-system/src/components/Badge';
import { EmptyState } from '@/modules/design-system/src/components/EmptyState';
import { Pagination } from '@/modules/design-system/src/components/Pagination';
import { Dialog } from '@/modules/design-system/src/components/Dialog';

interface Organization extends Record<string, unknown> {
    id: string;
    name: string;
    slug?: string;
    plan?: string;
    createdAt?: string;
}

interface UserRole {
    role: 'owner' | 'admin' | 'user' | null;
}

export default function V2OrgsPage() {
    const pathname = usePathname();
    const locale = pathname?.match(/^\/(en|th|zh)\//)?.[1] || 'en';
    const t = useTranslations('v2.orgs');

    // State
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [userRole, setUserRole] = useState<UserRole['role']>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [disablingOrg, setDisablingOrg] = useState<Organization | null>(null);

    // Fetch data on mount
    useEffect(() => {
        fetchOrganizations();
        fetchUserRole();
    }, []);

    async function fetchOrganizations() {
        try {
            setLoading(true);
            setError(null);
            setForbidden(false);

            const response = await fetch('/api/platform/orgs');

            if (response.status === 403) {
                setForbidden(true);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch organizations');
            }

            const data = await response.json();
            setOrgs(data.organizations || []);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserRole() {
        try {
            const response = await fetch('/api/platform/me');
            if (response.ok) {
                const data = await response.json();
                setUserRole(data.role || null);
            }
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    }

    // Permission checks
    const canCreate = userRole === 'owner' || userRole === 'admin';
    const canEdit = userRole === 'owner' || userRole === 'admin';
    const canDisable = userRole === 'owner';

    // Client-side filtering
    const filteredOrgs = orgs.filter((org) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                org.name.toLowerCase().includes(query) ||
                org.slug?.toLowerCase().includes(query) ||
                org.id.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        if (planFilter !== 'all') {
            if (org.plan?.toLowerCase() !== planFilter.toLowerCase()) {
                return false;
            }
        }

        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredOrgs.length / pageSize);
    const paginatedOrgs = filteredOrgs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, planFilter]);

    // Loading State
    if (loading) {
        return (
            <div>
                <PageHeader title={t('title')} subtitle={t('subtitle')} />
                <div className="p-8 text-center">
                    <p className="text-lg text-neutral-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Forbidden State (403)
    if (forbidden) {
        return (
            <div>
                <PageHeader title={t('title')} subtitle={t('subtitle')} />
                <div className="p-8">
                    <EmptyState
                        variant="error"
                        title={t('errors.forbidden.title')}
                        message={t('errors.forbidden.message')}
                    />
                </div>
            </div>
        );
    }

    // Error State (500/network)
    if (error) {
        return (
            <div>
                <PageHeader title={t('title')} subtitle={t('subtitle')} />
                <div className="p-8">
                    <EmptyState
                        variant="error"
                        title={t('errors.general.title')}
                        message={t('errors.general.message')}
                    />
                </div>
            </div>
        );
    }

    // Empty State (no data)
    if (orgs.length === 0) {
        return (
            <div>
                <PageHeader title={t('title')} subtitle={t('subtitle')} />
                <div className="p-8">
                    <EmptyState
                        variant="empty"
                        title={t('empty.title')}
                        message={t('empty.message')}
                        action={
                            canCreate
                                ? {
                                    label: t('actions.create'),
                                    onClick: () => setShowCreateModal(true),
                                }
                                : undefined
                        }
                    />
                </div>
            </div>
        );
    }

    // Plan badge variants
    const getPlanVariant = (
        plan?: string
    ): 'neutral' | 'success' | 'warning' | 'danger' | 'info' => {
        switch (plan?.toLowerCase()) {
            case 'enterprise':
                return 'warning';
            case 'pro':
                return 'info';
            case 'starter':
                return 'success';
            default:
                return 'neutral';
        }
    };

    // Table columns
    const columns: Array<{
        key: string;
        header: string;
        sortable?: boolean;
        render?: (value: unknown, row: Organization) => React.ReactNode;
    }> = [
            {
                key: 'name',
                header: t('table.name'),
                sortable: false,
                render: (_value: unknown, org: Organization) => (
                    <div>
                        <div className="font-semibold text-neutral-900">{org.name}</div>
                        <div className="text-xs text-neutral-500 font-mono">{org.id}</div>
                    </div>
                ),
            },
            {
                key: 'slug',
                header: t('table.slug'),
                sortable: false,
                render: (_value: unknown, org: Organization) => (
                    <code className="bg-neutral-100 px-2 py-0.5 rounded text-xs font-mono">
                        {org.slug || '-'}
                    </code>
                ),
            },
            {
                key: 'plan',
                header: t('table.plan'),
                sortable: false,
                render: (_value: unknown, org: Organization) => (
                    <Badge variant={getPlanVariant(org.plan)}>
                        {(org.plan || 'Free').toUpperCase()}
                    </Badge>
                ),
            },
            {
                key: 'createdAt',
                header: t('table.createdAt'),
                sortable: false,
                render: (_value: unknown, org: Organization) =>
                    org.createdAt
                        ? new Date(org.createdAt).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        : '-',
            },
            {
                key: 'actions',
                header: t('table.actions'),
                sortable: false,
                render: (_value: unknown, org: Organization) => (
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingOrg(org);
                                    setShowEditModal(true);
                                }}
                            >
                                {t('actions.edit')}
                            </Button>
                        )}
                        {canDisable && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDisablingOrg(org);
                                    setShowDisableModal(true);
                                }}
                            >
                                {t('actions.disable')}
                            </Button>
                        )}
                    </div>
                ),
            },
        ];

    return (
        <div>
            {/* Header */}
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    canCreate ? (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            {t('actions.create')}
                        </Button>
                    ) : undefined
                }
            />

            {/* Search & Filters */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                    <Input
                        placeholder={t('search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                    />
                </div>
                <div className="min-w-[200px]">
                    <Select
                        value={planFilter}
                        onChange={(value) => setPlanFilter(value)}
                        options={[
                            { value: 'all', label: t('filters.plan.all') },
                            { value: 'free', label: t('filters.plan.free') },
                            { value: 'starter', label: t('filters.plan.starter') },
                            { value: 'pro', label: t('filters.plan.pro') },
                            { value: 'enterprise', label: t('filters.plan.enterprise') },
                        ]}
                        fullWidth
                    />
                </div>
            </div>

            {/* Table */}
            {filteredOrgs.length === 0 ? (
                <div className="p-8">
                    <EmptyState
                        variant="empty"
                        title="No results"
                        message={`No organizations match your search "${searchQuery}"`}
                    />
                </div>
            ) : (
                <>
                    <Table<Organization> columns={columns} data={paginatedOrgs} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                pageSize={pageSize}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setCurrentPage(1);
                                }}
                                totalItems={filteredOrgs.length}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateOrgModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchOrganizations();
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingOrg && (
                <EditOrgModal
                    org={editingOrg}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingOrg(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setEditingOrg(null);
                        fetchOrganizations();
                    }}
                />
            )}

            {/* Disable Modal */}
            {showDisableModal && disablingOrg && (
                <DisableOrgModal
                    org={disablingOrg}
                    onClose={() => {
                        setShowDisableModal(false);
                        setDisablingOrg(null);
                    }}
                    onSuccess={() => {
                        setShowDisableModal(false);
                        setDisablingOrg(null);
                        fetchOrganizations();
                    }}
                />
            )}
        </div>
    );
}

// =============================================================================
// Create Organization Modal
// =============================================================================

interface CreateOrgModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

function CreateOrgModal({ onClose, onSuccess }: CreateOrgModalProps) {
    const t = useTranslations('v2.orgs.modal.create');
    const tToast = useTranslations('v2.orgs.toast');
    const tValidation = useTranslations('v2.validation');
    const tCommon = useTranslations('v2.common');

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>(
        'free'
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setName(value);
        const autoSlug = value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        setSlug(autoSlug);
    };

    const handleSubmit = async () => {
        // Client-side validation
        if (!name) {
            setError(tValidation('required'));
            return;
        }
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
            setError(tValidation('invalidSlug'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/platform/orgs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, plan }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setError(tToast('forbidden'));
                } else if (response.status === 409) {
                    setError(tValidation('duplicateSlug'));
                } else {
                    setError(data.error?.message || tToast('createError'));
                }
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('createSuccess'));
            onSuccess();
        } catch (err) {
            setError(tToast('createError'));
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label={t('name.label')}
                    placeholder={t('name.placeholder')}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    fullWidth
                />

                <Input
                    label={t('slug.label')}
                    placeholder={t('slug.placeholder')}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    helperText={t('slug.helper')}
                    required
                    fullWidth
                />

                <Select
                    label={t('plan.label')}
                    value={plan}
                    onChange={(value) => setPlan(value as typeof plan)}
                    options={[
                        { value: 'free', label: 'Free' },
                        { value: 'starter', label: 'Starter' },
                        { value: 'pro', label: 'Pro' },
                        { value: 'enterprise', label: 'Enterprise' },
                    ]}
                    fullWidth
                />

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? t('creating') : t('submit')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

// =============================================================================
// Edit Organization Modal
// =============================================================================

interface EditOrgModalProps {
    org: Organization;
    onClose: () => void;
    onSuccess: () => void;
}

function EditOrgModal({ org, onClose, onSuccess }: EditOrgModalProps) {
    const t = useTranslations('v2.orgs.modal.edit');
    const tToast = useTranslations('v2.orgs.toast');
    const tValidation = useTranslations('v2.validation');
    const tCommon = useTranslations('v2.common');

    const [name, setName] = useState(org.name);
    const [slug, setSlug] = useState((org.slug as string) || '');
    const [plan, setPlan] = useState<'free' | 'starter' | 'pro' | 'enterprise'>(
        (org.plan as any) || 'free'
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        // Client-side validation
        if (!name) {
            setError(tValidation('required'));
            return;
        }
        if (slug && !/^[a-z0-9-]+$/.test(slug)) {
            setError(tValidation('invalidSlug'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/platform/orgs/${org.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, plan }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setError(tToast('forbidden'));
                } else if (response.status === 409) {
                    setError(tValidation('duplicateSlug'));
                } else {
                    setError(data.error?.message || tToast('editError'));
                }
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('editSuccess'));
            onSuccess();
        } catch (err) {
            setError(tToast('editError'));
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <Input
                    label="Organization Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                />

                <Input
                    label="Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    required
                    fullWidth
                />

                <Select
                    label="Plan"
                    value={plan}
                    onChange={(value) => setPlan(value as typeof plan)}
                    options={[
                        { value: 'free', label: 'Free' },
                        { value: 'starter', label: 'Starter' },
                        { value: 'pro', label: 'Pro' },
                        { value: 'enterprise', label: 'Enterprise' },
                    ]}
                    fullWidth
                />

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? t('saving') : t('submit')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

// =============================================================================
// Disable Organization Modal
// =============================================================================

interface DisableOrgModalProps {
    org: Organization;
    onClose: () => void;
    onSuccess: () => void;
}

function DisableOrgModal({ org, onClose, onSuccess }: DisableOrgModalProps) {
    const t = useTranslations('v2.orgs.modal.disable');
    const tToast = useTranslations('v2.orgs.toast');
    const tCommon = useTranslations('v2.common');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/platform/orgs/${org.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 403) {
                    setError(tToast('forbidden'));
                } else {
                    setError(data.error?.message || tToast('disableError'));
                }
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('disableSuccess'));
            onSuccess();
        } catch (err) {
            setError(tToast('disableError'));
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <p className="text-sm text-neutral-600">{t('message')}</p>

                <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">{org.name}</p>
                    {org.slug && (
                        <p className="text-xs text-yellow-600 mt-1">({org.slug})</p>
                    )}
                    <p className="text-xs text-yellow-800 mt-2 font-medium">
                        {t('warning')}
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? t('disabling') : t('submit')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
