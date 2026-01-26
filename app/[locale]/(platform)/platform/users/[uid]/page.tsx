'use client';

/**
 * Platform User Detail Page
 * 
 * View and edit individual user:
 * - Update role
 * - Update permissions
 * - Enable/disable user
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@super-platform/ui';
import type { PlatformUser, PlatformRole, PlatformPermission } from '@/lib/platform/types';
import { PLATFORM_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '@/lib/platform/types';

const ROLE_COLORS: Record<PlatformRole, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-800',
};

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const uid = params.uid as string;

    const [user, setUser] = useState<PlatformUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit state
    const [editRole, setEditRole] = useState<PlatformRole>('user');
    const [editEnabled, setEditEnabled] = useState(true);
    const [customPermissions, setCustomPermissions] = useState<string[]>([]);

    useEffect(() => {
        fetchUser();
    }, [uid]);

    async function fetchUser() {
        try {
            setLoading(true);
            const res = await fetch(`/api/platform/users/${uid}`);
            if (!res.ok) {
                throw new Error('Failed to fetch user');
            }
            const data = await res.json();
            setUser(data.user);
            setEditRole(data.user.role);
            setEditEnabled(data.user.enabled);
            setCustomPermissions(data.user.permissions || []);
        } catch (err) {
            setError('Failed to load user');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const res = await fetch(`/api/platform/users/${uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: editRole,
                    enabled: editEnabled,
                    permissions: customPermissions,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            setSuccess('User updated successfully');
            fetchUser();
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to disable this user? They will no longer be able to log in.')) {
            return;
        }

        try {
            const res = await fetch(`/api/platform/users/${uid}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to disable user');
            }

            router.push('/platform/users');
        } catch (err: unknown) {
            setError((err as Error).message);
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">Loading user...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8">
                <div className="text-red-600">User not found</div>
            </div>
        );
    }

    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[editRole] || [];

    return (
        <div className="p-8 space-y-6 max-w-3xl">
            {/* Back button */}
            <button
                onClick={() => router.push('/platform/users')}
                className="text-blue-600 hover:underline flex items-center gap-1"
            >
                ← Back to Users
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[user.role]}`}>
                    {user.role.toUpperCase()}
                </span>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* User Info */}
            <Card>
                <h2 className="text-lg font-semibold mb-4">User Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">UID</span>
                        <p className="font-mono text-xs mt-1">{user.uid}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Created</span>
                        <p className="mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Last Login</span>
                        <p className="mt-1">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Status</span>
                        <p className="mt-1">{user.enabled ? '✅ Active' : '❌ Disabled'}</p>
                    </div>
                </div>
            </Card>

            {/* Edit Role */}
            <Card>
                <h2 className="text-lg font-semibold mb-4">Role & Status</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as PlatformRole)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            disabled={user.role === 'owner'}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {user.role === 'owner' && <option value="owner">Owner</option>}
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="enabled"
                            checked={editEnabled}
                            onChange={(e) => setEditEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600"
                            disabled={user.role === 'owner'}
                        />
                        <label htmlFor="enabled" className="text-sm text-gray-700">
                            User is enabled and can log in
                        </label>
                    </div>
                </div>
            </Card>

            {/* Permissions */}
            <Card>
                <h2 className="text-lg font-semibold mb-4">Permissions</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Role default permissions are shown in gray. Check additional permissions to grant them.
                </p>
                <div className="space-y-2">
                    {Object.entries(PLATFORM_PERMISSIONS).map(([key, desc]) => {
                        const isRoleDefault = rolePermissions.includes(key as PlatformPermission);
                        const isCustom = customPermissions.includes(key);
                        const isChecked = isRoleDefault || isCustom;

                        return (
                            <label key={key} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isRoleDefault}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setCustomPermissions([...customPermissions, key]);
                                        } else {
                                            setCustomPermissions(customPermissions.filter(p => p !== key));
                                        }
                                    }}
                                    className="w-4 h-4 mt-0.5 text-blue-600"
                                />
                                <div>
                                    <span className={`text-sm font-mono ${isRoleDefault ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {key}
                                    </span>
                                    <p className="text-xs text-gray-500">{desc}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving || user.role === 'owner'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>

                {user.role !== 'owner' && (
                    <button
                        onClick={handleDelete}
                        className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                        Disable User
                    </button>
                )}
            </div>
        </div>
    );
}
