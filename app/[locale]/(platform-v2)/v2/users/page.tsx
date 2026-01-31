'use client';

/**
 * Platform V2 Users Page - WORLD-CLASS ADMIN PANEL
 * Phase 17.1 - Users list with permission gating
 * 
 * FACELIFT: Enhanced UX with enterprise-grade design
 * - Modern skeleton loading states
 * - Stats overview cards
 * - Premium empty state
 * - Consistent filter bar layout
 * 
 * Compliance: ZERO inline styles, NO legacy imports, 100% design-system
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { Users, UserCheck, UserX, Shield, Search, Filter, RefreshCw, Plus } from 'lucide-react';
import { CreateUserPanel } from './_components/CreateUserPanel';
import { EditUserPanel } from './_components/EditUserPanel';
import type { PlatformUser, PlatformRole } from '@/lib/platform/types';

interface UserRole {
    role: 'owner' | 'admin' | 'user' | null;
}

// =============================================================================
// Stats Card Component
// =============================================================================

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: { value: number; isUp: boolean };
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatsCard({ title, value, icon, trend, variant = 'default' }: StatsCardProps) {
    const variantClasses = {
        default: 'bg-white border-neutral-200',
        success: 'bg-emerald-50 border-emerald-200',
        warning: 'bg-amber-50 border-amber-200',
        danger: 'bg-red-50 border-red-200',
    };

    const iconVariantClasses = {
        default: 'text-neutral-600 bg-neutral-100',
        success: 'text-emerald-600 bg-emerald-100',
        warning: 'text-amber-600 bg-amber-100',
        danger: 'text-red-600 bg-red-100',
    };

    return (
        <div className={`
            flex items-center gap-4 p-4 rounded-xl border shadow-sm
            transition-all duration-200 hover:shadow-md
            ${variantClasses[variant]}
        `}>
            <div className={`
                flex items-center justify-center w-12 h-12 rounded-lg
                ${iconVariantClasses[variant]}
            `}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">{title}</p>
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
            </div>
            {trend && (
                <div className={`text-sm font-medium ${trend.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trend.isUp ? '↑' : '↓'} {trend.value}%
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Skeleton Loading Component
// =============================================================================

function TableSkeleton() {
    return (
        <div className="w-full rounded-lg border border-neutral-200 overflow-hidden shadow-sm bg-white">
            {/* Header skeleton */}
            <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-3 flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 bg-neutral-200 rounded animate-pulse flex-1" />
                ))}
            </div>
            {/* Row skeletons */}
            {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="px-5 py-4 flex gap-4 border-b border-neutral-100">
                    {[1, 2, 3, 4, 5].map((col) => (
                        <div key={col} className="h-4 bg-neutral-100 rounded animate-pulse flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white">
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-3 w-20 bg-neutral-100 rounded animate-pulse mb-2" />
                        <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export default function V2UsersPage() {
    const pathname = usePathname();
    const locale = pathname?.match(/^\/(en|th)\//)?.[1] || 'en';
    const t = useTranslations('v2.users');
    const tCommon = useTranslations('v2.common');

    // State
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(true); // Track role fetch separately
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [userRole, setUserRole] = useState<UserRole['role']>(null);
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [disablingUser, setDisablingUser] = useState<PlatformUser | null>(null);

    // Fetch data on mount
    useEffect(() => {
        fetchUsers();
        fetchUserRole();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            setError(null);
            setForbidden(false);

            const response = await fetch('/api/platform/users');

            if (response.status === 403) {
                setForbidden(true);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserRole() {
        try {
            setRoleLoading(true);
            const response = await fetch('/api/platform/me');
            console.log('[UsersPage] fetchUserRole response status:', response.status);
            if (response.ok) {
                const json = await response.json();
                console.log('[UsersPage] fetchUserRole json:', json);
                // API returns { success: true, data: { role, enabled, isPlatformUser } }
                const data = json.data || json; // Handle both wrapped and unwrapped responses
                console.log('[UsersPage] Setting userRole to:', data.role);
                setUserRole(data.role || null);
                setCurrentUserUid(data.uid || null);
            }
        } catch (err) {
            console.error('Error fetching user role:', err);
        } finally {
            setRoleLoading(false);
        }
    }

    // Permission checks
    const canCreate = userRole === 'owner' || userRole === 'admin';
    const canEdit = userRole === 'owner' || userRole === 'admin';
    const canDisable = userRole === 'owner';

    // Stats calculation
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.enabled).length;
        const disabled = users.filter(u => !u.enabled).length;
        const owners = users.filter(u => u.role === 'owner').length;
        const admins = users.filter(u => u.role === 'admin').length;
        return { total, active, disabled, owners, admins };
    }, [users]);

    // Client-side filtering
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    user.displayName.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.uid.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (roleFilter !== 'all') {
                if (user.role !== roleFilter) {
                    return false;
                }
            }

            if (statusFilter !== 'all') {
                const isActive = user.enabled;
                if (statusFilter === 'active' && !isActive) return false;
                if (statusFilter === 'disabled' && isActive) return false;
            }

            return true;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter]);

    // Role badge variants
    const getRoleVariant = (
        role: PlatformRole
    ): 'neutral' | 'success' | 'warning' | 'danger' | 'info' => {
        switch (role) {
            case 'owner':
                return 'danger';
            case 'admin':
                return 'warning';
            case 'user':
                return 'info';
            default:
                return 'neutral';
        }
    };

    // Status badge variant
    const getStatusVariant = (
        enabled: boolean
    ): 'success' | 'neutral' => {
        return enabled ? 'success' : 'neutral';
    };

    // Table columns
    const columns: Array<{
        key: string;
        header: string;
        sortable?: boolean;
        render?: (value: unknown, row: PlatformUser) => React.ReactNode;
        className?: string;
    }> = [
            {
                key: 'displayName',
                header: t('table.name'),
                sortable: false,
                render: (_value: unknown, user: PlatformUser) => (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-semibold text-neutral-900">{user.displayName}</div>
                            <div className="text-xs text-neutral-500">{user.email}</div>
                        </div>
                    </div>
                ),
            },
            {
                key: 'role',
                header: t('table.role'),
                sortable: false,
                render: (_value: unknown, user: PlatformUser) => (
                    <Badge variant={getRoleVariant(user.role)}>
                        {user.role.toUpperCase()}
                    </Badge>
                ),
            },
            {
                key: 'enabled',
                header: t('table.status'),
                sortable: false,
                render: (_value: unknown, user: PlatformUser) => (
                    <Badge variant={getStatusVariant(user.enabled)}>
                        {user.enabled ? t('filters.status.active') : t('filters.status.disabled')}
                    </Badge>
                ),
            },
            {
                key: 'createdAt',
                header: t('table.createdAt'),
                sortable: false,
                render: (_value: unknown, user: PlatformUser) =>
                    user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(locale, {
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
                render: (_value: unknown, user: PlatformUser) => (
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditingUser(user);
                                    setShowEditModal(true);
                                }}
                            >
                                {t('actions.edit')}
                            </Button>
                        )}
                        {canDisable && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    setDisablingUser(user);
                                    setShowDisableModal(true);
                                }}
                                disabled={user.uid === currentUserUid}
                                title={user.uid === currentUserUid ? t('toast.selfDisableBlocked') : undefined}
                            >
                                {t('actions.disable')}
                            </Button>
                        )}
                    </div>
                ),
            },
        ];

    // Loading State - wait for both users AND role data
    if (loading || roleLoading) {
        return (
            <div className="p-6">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tCommon('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <StatsSkeleton />
                <div className="mb-6 flex gap-4">
                    <div className="flex-1 h-10 bg-neutral-100 rounded-lg animate-pulse" />
                    <div className="w-40 h-10 bg-neutral-100 rounded-lg animate-pulse" />
                    <div className="w-40 h-10 bg-neutral-100 rounded-lg animate-pulse" />
                </div>
                <TableSkeleton />
            </div>
        );
    }

    // Forbidden State (403)
    if (forbidden) {
        return (
            <div className="p-6">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tCommon('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <EmptyState
                        variant="error"
                        title={t('errors.forbidden.title')}
                        message={t('errors.forbidden.message')}
                        icon={<Shield className="w-16 h-16 text-red-300" />}
                    />
                </div>
            </div>
        );
    }

    // Error State (500/network)
    if (error) {
        return (
            <div className="p-6">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tCommon('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                />
                <div className="flex items-center justify-center min-h-[400px]">
                    <EmptyState
                        variant="error"
                        title={t('errors.general.title')}
                        message={t('errors.general.message')}
                        action={{
                            label: 'Retry',
                            onClick: () => fetchUsers(),
                        }}
                    />
                </div>
            </div>
        );
    }

    // Empty State (no data)
    if (users.length === 0) {
        return (
            <div className="p-6">
                <PageHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    breadcrumbs={[
                        { label: tCommon('home'), href: `/${locale}/v2` },
                        { label: t('title') },
                    ]}
                    actions={
                        canCreate ? (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('actions.create')}
                            </Button>
                        ) : undefined
                    }
                />
                <div className="flex items-center justify-center min-h-[400px] bg-white rounded-xl border border-neutral-200">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Users className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t('empty.title')}</h3>
                        <p className="text-neutral-500 mb-6">{t('empty.message')}</p>
                        {canCreate && (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('actions.create')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Create Panel (OS Overlay) */}
                <CreateUserPanel
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchUsers();
                    }}
                    currentUserRole={userRole || 'user'}
                />
            </div>
        );
    }

    // Main content with data
    return (
        <div className="p-6">
            {/* Header with breadcrumbs */}
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                breadcrumbs={[
                    { label: tCommon('home'), href: `/${locale}/v2` },
                    { label: t('title') },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchUsers()}
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        {canCreate && (
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('actions.create')}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Total Users"
                    value={stats.total}
                    icon={<Users className="w-6 h-6" />}
                    variant="default"
                />
                <StatsCard
                    title="Active Users"
                    value={stats.active}
                    icon={<UserCheck className="w-6 h-6" />}
                    variant="success"
                />
                <StatsCard
                    title="Disabled"
                    value={stats.disabled}
                    icon={<UserX className="w-6 h-6" />}
                    variant={stats.disabled > 0 ? 'warning' : 'default'}
                />
                <StatsCard
                    title="Admins & Owners"
                    value={stats.admins + stats.owners}
                    icon={<Shield className="w-6 h-6" />}
                    variant="default"
                />
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4 mb-6 flex-wrap items-center">
                <div className="flex-1 min-w-[280px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder={t('filters.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="min-w-[160px]">
                    <Select
                        value={roleFilter}
                        onChange={(value) => setRoleFilter(value)}
                        options={[
                            { value: 'all', label: t('filters.role.all') },
                            { value: 'owner', label: t('filters.role.owner') },
                            { value: 'admin', label: t('filters.role.admin') },
                            { value: 'user', label: t('filters.role.user') },
                        ]}
                        fullWidth
                    />
                </div>
                <div className="min-w-[160px]">
                    <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        options={[
                            { value: 'all', label: t('filters.status.all') },
                            { value: 'active', label: t('filters.status.active') },
                            { value: 'disabled', label: t('filters.status.disabled') },
                        ]}
                        fullWidth
                    />
                </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-neutral-500">
                Showing {paginatedUsers.length} of {filteredUsers.length} users
                {searchQuery && <span className="ml-1">matching "{searchQuery}"</span>}
            </div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 min-h-[300px] flex items-center justify-center">
                    <EmptyState
                        variant="no-results"
                        title="No results"
                        message={`No users match your search "${searchQuery}"`}
                        icon={<Search className="w-12 h-12 text-neutral-300" />}
                        action={{
                            label: 'Clear filters',
                            onClick: () => {
                                setSearchQuery('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            },
                        }}
                    />
                </div>
            ) : (
                <>
                    <Table columns={columns as unknown as Array<{ key: string; header: string }>} data={paginatedUsers as unknown as Array<Record<string, unknown>>} />

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
                                totalItems={filteredUsers.length}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Create Panel (OS Overlay) */}
            <CreateUserPanel
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchUsers();
                }}
                currentUserRole={userRole || 'user'}
            />

            {/* Edit Panel (OS Overlay) */}
            <EditUserPanel
                isOpen={showEditModal}
                user={editingUser}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                }}
                onSuccess={() => {
                    fetchUsers();
                }}
                currentUserRole={userRole || 'user'}
            />

            {/* Disable Modal */}
            {showDisableModal && disablingUser && (
                <DisableUserModal
                    user={disablingUser}
                    onClose={() => {
                        setShowDisableModal(false);
                        setDisablingUser(null);
                    }}
                    onSuccess={() => {
                        setShowDisableModal(false);
                        setDisablingUser(null);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
}

// =============================================================================
// Create User Modal
// =============================================================================

interface CreateUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: 'owner' | 'admin' | 'user';
}

interface CreatedUserResult {
    email: string;
    temporaryPassword: string;
}

function CreateUserModal({ onClose, onSuccess, currentUserRole }: CreateUserModalProps) {
    const t = useTranslations('v2.users.modal.create');
    const tValidation = useTranslations('v2.users.validation');
    const tToast = useTranslations('v2.users.toast');
    const tCommon = useTranslations('v2.common');

    // State
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);

    // Role options based on current user
    const roleOptions = currentUserRole === 'owner'
        ? [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
        ]
        : [
            { value: 'user', label: 'User' },
        ];

    // Validation
    const validateForm = (): boolean => {
        if (!email) {
            setError(tValidation('required'));
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(tValidation('invalidEmail'));
            return false;
        }
        if (!displayName) {
            setError(tValidation('required'));
            return false;
        }
        if (!role) {
            setError(tValidation('required'));
            return false;
        }
        return true;
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/platform/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, role }),
            });

            const data = await response.json();

            if (response.status === 403) {
                setError(tToast('forbidden'));
                setLoading(false);
                return;
            }

            if (response.status === 409) {
                setError(tValidation('emailInUse'));
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error?.message || tToast('createError'));
                setLoading(false);
                return;
            }

            // Success - show credentials
            setCreatedUser({
                email: data.user.email,
                temporaryPassword: data.temporaryPassword,
            });
            toast.success(tToast('createSuccess'));

        } catch (err) {
            setError(tToast('createError'));
            setLoading(false);
        }
    };

    // If user created successfully, show credentials
    if (createdUser) {
        return (
            <Dialog isOpen={true} onClose={onClose} title={t('success.title')}>
                <div className="space-y-4">
                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                        <p className="text-sm text-yellow-800 font-semibold">
                            {t('success.warning')}
                        </p>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-2">
                        <div>
                            <label className="text-sm font-medium text-neutral-700">
                                {t('success.email')}
                            </label>
                            <code className="block mt-1 bg-neutral-100 px-3 py-2 rounded text-sm font-mono">
                                {createdUser.email}
                            </code>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-700">
                                {t('success.password')}
                            </label>
                            <code className="block mt-1 bg-neutral-100 px-3 py-2 rounded text-sm font-mono">
                                {createdUser.temporaryPassword}
                            </code>
                        </div>
                    </div>

                    {/* Done button */}
                    <Button
                        variant="primary"
                        onClick={() => {
                            onSuccess(); // Refresh user list
                            onClose();   // Close modal
                        }}
                        fullWidth
                    >
                        {t('success.done')}
                    </Button>
                </div>
            </Dialog>
        );
    }

    // Form UI
    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Email */}
                <Input
                    label={t('email.label')}
                    placeholder={t('email.placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    fullWidth
                />

                {/* Display Name */}
                <Input
                    label={t('displayName.label')}
                    placeholder={t('displayName.placeholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    fullWidth
                />

                {/* Role */}
                <Select
                    label={t('role.label')}
                    value={role}
                    onChange={(value) => setRole(value as 'admin' | 'user')}
                    options={roleOptions}
                    fullWidth
                />

                {/* Note */}
                <p className="text-xs text-neutral-500">
                    {t('role.note')}
                </p>

                {/* Actions */}
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
// Edit User Modal
// =============================================================================

interface EditUserModalProps {
    user: PlatformUser;
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: 'owner' | 'admin' | 'user';
}

function EditUserModal({ user, onClose, onSuccess, currentUserRole }: EditUserModalProps) {
    const t = useTranslations('v2.users.modal.edit');
    const tValidation = useTranslations('v2.users.validation');
    const tToast = useTranslations('v2.users.toast');
    const tCommon = useTranslations('v2.common');

    // State
    const [displayName, setDisplayName] = useState(user.displayName);
    const [role, setRole] = useState<'admin' | 'user'>(user.role as 'admin' | 'user');
    const [enabled, setEnabled] = useState(user.enabled);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Role options based on current user
    const roleOptions = currentUserRole === 'owner'
        ? [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
        ]
        : [
            { value: 'user', label: 'User' },
        ];

    // Status options
    const statusOptions = [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.disabled') },
    ];

    // Permission: only Owner can edit status
    const canEditStatus = currentUserRole === 'owner';

    // Validation
    const validateForm = (): boolean => {
        if (!displayName) {
            setError(tValidation('required'));
            return false;
        }
        if (!role) {
            setError(tValidation('required'));
            return false;
        }
        return true;
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/platform/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    role,
                    // Only send enabled if Owner
                    ...(canEditStatus ? { enabled } : {}),
                }),
            });

            const data = await response.json();

            if (response.status === 403) {
                setError(tToast('editForbidden'));
                setLoading(false);
                return;
            }

            if (response.status === 404) {
                setError(tToast('notFound'));
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error?.message || tToast('editError'));
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('editSuccess'));
            onSuccess(); // Refresh + close

        } catch (err) {
            setError(tToast('editError'));
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Email (readonly) */}
                <div>
                    <label className="text-sm font-medium text-neutral-700">
                        {t('email.label')}
                    </label>
                    <div className="mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-600">
                        {user.email}
                    </div>
                </div>

                {/* Display Name */}
                <Input
                    label={t('displayName.label')}
                    placeholder={t('displayName.placeholder')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    fullWidth
                />

                {/* Role */}
                <Select
                    label={t('role.label')}
                    value={role}
                    onChange={(value) => setRole(value as 'admin' | 'user')}
                    options={roleOptions}
                    fullWidth
                />

                {/* Status - Owner only */}
                {canEditStatus && (
                    <Select
                        label={t('status.label')}
                        value={enabled.toString()}
                        onChange={(value) => setEnabled(value === 'true')}
                        options={statusOptions}
                        fullWidth
                    />
                )}

                {/* Actions */}
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
// Disable User Modal
// =============================================================================

interface DisableUserModalProps {
    user: PlatformUser;
    onClose: () => void;
    onSuccess: () => void;
}

function DisableUserModal({ user, onClose, onSuccess }: DisableUserModalProps) {
    const t = useTranslations('v2.users.modal.disable');
    const tToast = useTranslations('v2.users.toast');
    const tCommon = useTranslations('v2.common');

    // State
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validation: require exact "DISABLE" text
    const isConfirmed = confirmText === 'DISABLE';

    // Submit
    const handleSubmit = async () => {
        if (!isConfirmed) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/platform/users/${user.uid}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.status === 403) {
                setError(tToast('disableForbidden'));
                setLoading(false);
                return;
            }

            if (response.status === 404) {
                setError(tToast('notFound'));
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error?.message || tToast('disableError'));
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('disableSuccess'));
            onSuccess(); // Refresh + close

        } catch (err) {
            setError(tToast('disableError'));
            setLoading(false);
        }
    };

    return (
        <Dialog isOpen={true} onClose={onClose} title={t('title')}>
            <div className="space-y-4">
                {/* Warning message */}
                <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">
                        {t('message')}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* User info */}
                <div>
                    <label className="text-sm font-medium text-neutral-700">
                        {t('userLabel')}
                    </label>
                    <div className="mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded">
                        <div className="font-semibold text-neutral-900">{user.displayName}</div>
                        <div className="text-sm text-neutral-600">{user.email}</div>
                    </div>
                </div>

                {/* Confirmation input */}
                <Input
                    label={t('confirmLabel')}
                    placeholder={t('confirmPlaceholder')}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    required
                    fullWidth
                />

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} fullWidth>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSubmit}
                        disabled={loading || !isConfirmed}
                        fullWidth
                    >
                        {loading ? t('disabling') : t('submit')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
