'use client';

/**
 * Platform Users Management Page
 * 
 * List all platform users with ability to:
 * - Create new users
 * - Edit user roles
 * - Enable/disable users
 * 
 * UI: Migrated to Design System patterns + Reusable Components (2026-01-21)
 * Logic: Preserved from original implementation
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { Card } from '@super-platform/ui';
import { PageHeader } from '@/components/PageHeader';
import type { PlatformUser, PlatformRole } from '@/lib/platform/types';
import {
    TableToolbar,
    TableLoadingSkeleton,
    TableEmptyState,
    TableErrorAlert,
    DataTableFooter
} from '@/components/platform/tables';

// Role badge colors (Design System tokens)
const ROLE_COLORS: Record<PlatformRole, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-[#E6F1FC] text-[#0F6FDE]',
    user: 'bg-[#F5F5F5] text-[#525252]',
};

// Demo users dataset (development only)
const DEMO_USERS: PlatformUser[] = [
    {
        uid: 'demo-1',
        email: 'john.smith@example.com',
        displayName: 'John Smith',
        role: 'admin',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-01-15T10:30:00Z' as any,
        updatedAt: '2024-01-15T10:30:00Z' as any,
    },
    {
        uid: 'demo-2',
        email: 'very-long-email-address-to-test-truncation-feature@example-with-very-long-domain-name.com',
        displayName: 'Sarah Johnson',
        role: 'user',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-02-20T14:45:00Z' as any,
        updatedAt: '2024-02-20T14:45:00Z' as any,
    },
    {
        uid: 'demo-3',
        email: 'สมชาย.วงศ์ไทย@example.co.th',
        displayName: 'สมชาย วงศ์ไทย',
        role: 'user',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-03-10T09:15:00Z' as any,
        updatedAt: '2024-03-10T09:15:00Z' as any,
    },
    {
        uid: 'demo-4',
        email: '王小明@example.cn',
        displayName: '王小明',
        role: 'admin',
        permissions: [],
        enabled: false,
        createdBy: 'system',
        createdAt: '2024-01-25T16:20:00Z' as any,
        updatedAt: '2024-01-25T16:20:00Z' as any,
    },
    {
        uid: 'demo-5',
        email: 'maria.garcia@empresa-muy-larga-para-probar-el-truncado.es',
        displayName: 'María García',
        role: 'user',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-04-05T11:00:00Z' as any,
        updatedAt: '2024-04-05T11:00:00Z' as any,
    },
    {
        uid: 'demo-6',
        email: 'disabled.user@example.com',
        displayName: 'Disabled User',
        role: 'user',
        permissions: [],
        enabled: false,
        createdBy: 'system',
        createdAt: '2024-02-14T08:30:00Z' as any,
        updatedAt: '2024-02-14T08:30:00Z' as any,
    },
    {
        uid: 'demo-7',
        email: 'platform.owner@company.com',
        displayName: 'Platform Owner',
        role: 'owner',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2023-12-01T00:00:00Z' as any,
        updatedAt: '2023-12-01T00:00:00Z' as any,
    },
    {
        uid: 'demo-8',
        email: 'ณัฐวุฒิ.สุขสวัสดิ์@example.th',
        displayName: 'ณัฐวุฒิ สุขสวัสดิ์',
        role: 'admin',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-03-20T13:45:00Z' as any,
        updatedAt: '2024-03-20T13:45:00Z' as any,
    },
    {
        uid: 'demo-9',
        email: 'inactive.admin@oldcompany.com',
        displayName: 'Inactive Admin',
        role: 'admin',
        permissions: [],
        enabled: false,
        createdBy: 'system',
        createdAt: '2023-11-15T10:00:00Z' as any,
        updatedAt: '2023-11-15T10:00:00Z' as any,
    },
    {
        uid: 'demo-10',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-05-01T12:00:00Z' as any,
        updatedAt: '2024-05-01T12:00:00Z' as any,
    },
    {
        uid: 'demo-11',
        email: '李明華@測試公司.台灣',
        displayName: '李明華',
        role: 'user',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-04-15T15:30:00Z' as any,
        updatedAt: '2024-04-15T15:30:00Z' as any,
    },
    {
        uid: 'demo-12',
        email: 'super-administrator-with-very-long-name@enterprise-organization.com',
        displayName: 'Super Administrator',
        role: 'admin',
        permissions: [],
        enabled: true,
        createdBy: 'system',
        createdAt: '2024-01-10T07:00:00Z' as any,
        updatedAt: '2024-01-10T07:00:00Z' as any,
    },
];

export default function PlatformUsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.match(/^\/([a-z]{2})\//)?.[1] || 'en';
    const t = useTranslations('platform.userManagement');
    const tRoles = useTranslations('platform.roles');
    const tCommon = useTranslations('common');

    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [density, setDensity] = useState<'default' | 'dense'>('default');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Platform role for permission gating
    const [platformRole, setPlatformRole] = useState<string | null>(null);

    // Demo mode detection (development only)
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setIsDemoMode(params.get('demo') === '1' && process.env.NODE_ENV === 'development');
        }
    }, []);

    // Fetch platform role for permission gating
    useEffect(() => {
        async function fetchPlatformRole() {
            try {
                const res = await fetch('/api/platform/me');
                if (res.ok) {
                    const data = await res.json();
                    setPlatformRole(data.role || null);
                }
            } catch (err) {
                console.error('Failed to fetch platform role:', err);
            }
        }
        fetchPlatformRole();
    }, []);

    // Permission checks based on platformRole
    const canCreateUser = platformRole === 'owner' || platformRole === 'admin';
    const canEditUser = platformRole === 'owner' || platformRole === 'admin';

    // ⚠️ PRESERVED: Original data fetching logic
    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const res = await fetch('/api/platform/users');
            if (!res.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data.users || []);
            setError(null); // Clear error on success
        } catch (err) {
            console.error(err);

            // Demo data fallback (development only)
            if (isDemoMode) {
                setUsers(DEMO_USERS);
                setError(null);
            } else {
                setError(t('noUsers'));
            }
        } finally {
            setLoading(false);
        }
    }

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Selection handlers (demo-only)
    const handleSelectAll = () => {
        if (selectedRows.size === filteredUsers.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredUsers.map(u => u.uid)));
        }
    };

    const handleSelectRow = (uid: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(uid)) {
            newSelected.delete(uid);
        } else {
            newSelected.add(uid);
        }
        setSelectedRows(newSelected);
    };

    return (
        <div className="space-y-6">
            {/* Header - Design System Pattern */}
            <PageHeader
                title={t('title')}
                description={t('subtitle')}
                action={!loading && users.length > 0 && canCreateUser ? (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg hover:bg-[#0A5AC4] transition-colors duration-150 font-medium text-sm whitespace-nowrap"
                    >
                        ➕ {t('createUser')}
                    </button>
                ) : undefined}
            />

            {/* Error Banner - Design System Alert Pattern */}
            {error && (
                <TableErrorAlert
                    message={error}
                    onRetry={fetchUsers}
                    retryLabel={t('retryButton')}
                />
            )}

            {/* Toolbar - Reusable Component */}
            <TableToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('searchPlaceholder')}
                selectedCount={selectedRows.size}
                selectedCountLabel={t('selectedCount', { count: selectedRows.size })}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={setRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                rowsPerPageLabel={(count) => t('rowsPerPage', { count })}
                density={density}
                onDensityChange={setDensity}
                densityLabels={{
                    default: t('densityDefault'),
                    dense: t('densityDense')
                }}
            />

            {/* Users Table - Design System Pattern */}
            <Card>
                {loading ? (
                    // Loading State - Reusable Component
                    <div className="p-6">
                        <TableLoadingSkeleton rows={5} />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    // Empty State - Reusable Component
                    <TableEmptyState
                        icon="👥"
                        title={searchQuery ? t('noUsersMatch') : t('noUsers')}
                        description={searchQuery
                            ? t('emptySearchMessage', { query: searchQuery })
                            : t('emptyStateMessage')}
                        action={!searchQuery && canCreateUser ? (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-[#0F6FDE] text-white rounded-lg hover:bg-[#0A5AC4] transition-colors font-medium text-sm whitespace-nowrap"
                            >
                                ➕ {t('createUser')}
                            </button>
                        ) : undefined}
                    />
                ) : (
                    /* Content Wrapper */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                        {/* Mobile View: Card List (< md) */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredUsers.slice(0, rowsPerPage).map((user) => (
                                <div key={user.uid} className={`p-4 flex flex-col gap-3 ${selectedRows.has(user.uid) ? 'bg-blue-50/50' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(user.uid)}
                                            onChange={() => handleSelectRow(user.uid)}
                                            className="mt-1 w-4 h-4 text-[#0F6FDE] border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#0F6FDE] focus:ring-opacity-20"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-900 truncate">
                                                    {user.displayName}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ROLE_COLORS[user.role]}`}>
                                                    {tRoles(user.role).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 truncate mb-1">{user.email}</div>

                                            <div className="flex items-center gap-2 text-xs">
                                                {user.enabled ? (
                                                    <span className="flex items-center gap-1 text-[#0F8A4D]">
                                                        <span className="w-1.5 h-1.5 bg-[#0F8A4D] rounded-full"></span>
                                                        {t('active')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[#8E8E8E]">
                                                        <span className="w-1.5 h-1.5 bg-[#B4B4B4] rounded-full"></span>
                                                        {t('disabled')}
                                                    </span>
                                                )}
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-400">Created {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-gray-50 mt-1 pl-7">
                                        {canEditUser && (
                                            <button
                                                onClick={() => router.push(`/${locale}/platform/users/${user.uid}`)}
                                                className="text-[#0F6FDE] hover:underline text-sm font-medium"
                                            >
                                                {t('edit')} →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View: Table (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
                                    <tr>
                                        {/* Select all checkbox */}
                                        <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.size === filteredUsers.length && filteredUsers.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-[#0F6FDE] border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#0F6FDE] focus:ring-opacity-20"
                                            />
                                        </th>
                                        <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                            {t('user')}
                                        </th>
                                        <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                            {t('role')}
                                        </th>
                                        <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                            {t('status')}
                                        </th>
                                        <th className={`text-left ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                            {t('created')}
                                        </th>
                                        <th className={`text-right ${density === 'dense' ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider`}>
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E8E8E8]">
                                    {filteredUsers.slice(0, rowsPerPage).map((user) => (
                                        <tr
                                            key={user.uid}
                                            className={`hover:bg-[#F5F5F5] transition-colors duration-150 ${selectedRows.has(user.uid) ? 'bg-[#E6F1FC]' : ''
                                                }`}
                                        >
                                            {/* Selection checkbox */}
                                            <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.has(user.uid)}
                                                    onChange={() => handleSelectRow(user.uid)}
                                                    className="w-4 h-4 text-[#0F6FDE] border-[#E8E8E8] rounded focus:ring-2 focus:ring-[#0F6FDE] focus:ring-opacity-20"
                                                />
                                            </td>
                                            <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                                <div className="max-w-[300px]">
                                                    <div className="font-medium text-[#242424] truncate" title={user.displayName}>
                                                        {user.displayName}
                                                    </div>
                                                    <div className="text-sm text-[#8E8E8E] truncate" title={user.email}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                                                    {tRoles(user.role).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className={density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'}>
                                                {user.enabled ? (
                                                    <span className="flex items-center gap-1.5 text-[#0F8A4D] text-sm">
                                                        <span className="w-2 h-2 bg-[#0F8A4D] rounded-full"></span>
                                                        {t('active')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-[#8E8E8E] text-sm">
                                                        <span className="w-2 h-2 bg-[#B4B4B4] rounded-full"></span>
                                                        {t('disabled')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`${density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'} text-sm text-[#8E8E8E]`}>
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className={`${density === 'dense' ? 'px-4 py-2' : 'px-6 py-4'} text-right`}>
                                                {canEditUser && (
                                                    <button
                                                        onClick={() => router.push(`/${locale}/platform/users/${user.uid}`)}
                                                        className="text-[#0F6FDE] hover:underline text-sm font-medium"
                                                    >
                                                        {t('edit')} →
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>     {/* Pagination Footer - Reusable Component */}
                        {
                            filteredUsers.length > 0 && (
                                <DataTableFooter
                                    from={1}
                                    to={Math.min(rowsPerPage, filteredUsers.length)}
                                    total={filteredUsers.length}
                                    paginationText={t('paginationText', {
                                        from: 1,
                                        to: Math.min(rowsPerPage, filteredUsers.length),
                                        total: filteredUsers.length
                                    })}
                                />
                            )
                        }
                    </div >
                )
                }
            </Card >

            {/* Create User Modal - Preserved Original */}
            {
                showCreateModal && (
                    <CreateUserModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            fetchUsers();
                        }}
                    />
                )
            }
        </div >
    );
}

// =============================================================================
// Create User Modal - PRESERVED ORIGINAL IMPLEMENTATION
// =============================================================================

interface CreateUserModalProps {
    onClose: () => void;
    onCreated: () => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
    const t = useTranslations('platform.userManagement');
    const tRoles = useTranslations('platform.roles');
    const tCommon = useTranslations('common');

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<PlatformRole>('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);

    // ⚠️ PRESERVED: Original submit handler
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/platform/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle 403 Forbidden specifically
                if (res.status === 403) {
                    setError(t('error.forbidden'));
                    return;
                }
                throw new Error(data.error || 'Failed to create user');
            }

            setCreatedUser({
                email: data.user.email,
                password: data.temporaryPassword,
            });

        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                {createdUser ? (
                    // Success state - show credentials
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-4xl mb-2">✅</div>
                            <h2 className="text-xl font-bold text-gray-900">{t('userCreated')}</h2>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-yellow-800 font-medium">
                                ⚠️ {t('saveCredentials')}
                            </p>
                            <div className="space-y-1">
                                <div className="text-sm">
                                    <span className="font-medium">{t('email')}:</span> {createdUser.email}
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium">{t('password')}:</span>{' '}
                                    <code className="bg-gray-100 px-2 py-1 rounded">{createdUser.password}</code>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onCreated}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {t('done')}
                        </button>
                    </div>
                ) : (
                    // Form state
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{t('createNewUser')}</h2>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('displayName')}</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as PlatformRole)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="user">{tRoles('user')}</option>
                                <option value="admin">{tRoles('admin')}</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('roleNote')}
                            </p>
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
                                {loading ? t('creating') : t('createUser')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
