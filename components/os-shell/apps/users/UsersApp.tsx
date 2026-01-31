/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USERS APP — Main Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * MVP Users management app with list, search, create, edit.
 * All actions go through governance adapter + step-up authentication.
 * 
 * @module components/os-shell/apps/users/UsersApp
 * @version 3.0.0 — Phase X Step-up Authentication
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AppProps } from '../registry';
import type { User, UserFormData, UserRole, UserStatus, UsersDataSource } from './types';
import { mockDataSource } from './mock';
import { apiDataSource } from './datasources/api';
import { tokens } from '../../tokens';
import { getStateStore } from '@/governance/synapse';
import { addDecisionLog } from '../../system-log';
import { useStepUpAuth } from '@/governance/synapse/stepup';

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toggle between mock and real data source
 * Set to 'api' to use real data, 'mock' for development
 */
const DATA_SOURCE_MODE: 'mock' | 'api' = 'api';

function getDataSource(): UsersDataSource {
    return DATA_SOURCE_MODE === 'api' ? apiDataSource : mockDataSource;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ModalState {
    isOpen: boolean;
    mode: 'create' | 'edit';
    userId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION BANNER
// ═══════════════════════════════════════════════════════════════════════════

function PermissionBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div
            style={{
                padding: '10px 16px',
                background: 'rgba(255, 95, 87, 0.1)',
                border: '1px solid rgba(255, 95, 87, 0.3)',
                borderRadius: 8,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                color: '#c44',
            }}
        >
            <span>🔒 {message}</span>
            <button
                onClick={onDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: 12,
                }}
            >
                ✕
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// USER MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface UserModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: User;
    onSave: (data: UserFormData) => void;
    onCancel: () => void;
}

function UserModal({ isOpen, mode, initialData, onSave, onCancel }: UserModalProps) {
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        role: 'user',
        status: 'active',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                role: initialData.role,
                status: initialData.status,
            });
        } else {
            setFormData({ name: '', email: '', role: 'user', status: 'active' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    width: 360,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
            >
                <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>
                    {mode === 'create' ? 'Create User' : 'Edit User'}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                padding: '8px 16px',
                                background: '#f0f0f0',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 16px',
                                background: '#007AFF',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                            }}
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: UserStatus }) {
    const colors = {
        active: { bg: '#e6f7e6', text: '#1a7f1a' },
        inactive: { bg: '#f0f0f0', text: '#666' },
        pending: { bg: '#fff3e0', text: '#e65100' },
    };
    const c = colors[status];

    return (
        <span
            style={{
                padding: '2px 8px',
                background: c.bg,
                color: c.text,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
            }}
        >
            {status}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE BADGE
// ═══════════════════════════════════════════════════════════════════════════

function RoleBadge({ role }: { role: UserRole }) {
    const colors = {
        owner: { bg: '#fce4ec', text: '#c2185b' },
        admin: { bg: '#e3f2fd', text: '#1565c0' },
        user: { bg: '#f3e5f5', text: '#7b1fa2' },
        viewer: { bg: '#f5f5f5', text: '#666' },
    };
    const c = colors[role];

    return (
        <span
            style={{
                padding: '2px 8px',
                background: c.bg,
                color: c.text,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
            }}
        >
            {role}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UsersApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'create' });
    const [editingUser, setEditingUser] = useState<User | undefined>();
    const [permissionError, setPermissionError] = useState<string | null>(null);

    // Load users
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const dataSource = getDataSource();
            const data = await dataSource.listUsers();
            setUsers(data);
        } catch (error) {
            console.error('[UsersApp] Failed to load users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter users by search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    // Check permission via governance
    const checkPermission = useCallback((action: string): boolean => {
        const state = getStateStore().getState();

        // Simple permission check based on role
        // In real implementation, this would emit an intent and wait for decision
        const userRole = state.security.role as string;

        if (action === 'create' || action === 'edit') {
            if (userRole === 'viewer') {
                addDecisionLog({
                    timestamp: Date.now(),
                    action: `users.${action}`,
                    capabilityId: 'core.users',
                    decision: 'DENY',
                    reasonChain: ['Viewers cannot create or edit users'],
                    failedRule: 'role.write_access',
                });
                return false;
            }
        }

        addDecisionLog({
            timestamp: Date.now(),
            action: `users.${action}`,
            capabilityId: 'core.users',
            decision: 'ALLOW',
            reasonChain: ['User has write access'],
        });
        return true;
    }, []);

    // Get step-up auth
    const { requireStepUp, isVerified } = useStepUpAuth();

    // Handle create with step-up
    const handleCreate = () => {
        if (!checkPermission('create')) {
            setPermissionError('Permission denied: You cannot create users');
            return;
        }

        // Require step-up for sensitive action
        const verified = requireStepUp({
            action: 'create user',
            capabilityId: 'core.users',
            onSuccess: () => {
                setEditingUser(undefined);
                setModal({ isOpen: true, mode: 'create' });
            },
        });

        if (verified) {
            // Already verified - proceed directly
            setEditingUser(undefined);
            setModal({ isOpen: true, mode: 'create' });
        }
    };

    // Handle edit with step-up
    const handleEdit = (user: User) => {
        if (!checkPermission('edit')) {
            setPermissionError('Permission denied: You cannot edit users');
            return;
        }

        // Require step-up for sensitive action
        const verified = requireStepUp({
            action: 'edit user',
            capabilityId: 'core.users',
            onSuccess: () => {
                setEditingUser(user);
                setModal({ isOpen: true, mode: 'edit', userId: user.id });
            },
        });

        if (verified) {
            // Already verified - proceed directly
            setEditingUser(user);
            setModal({ isOpen: true, mode: 'edit', userId: user.id });
        }
    };

    // Handle save
    const handleSave = async (data: UserFormData) => {
        try {
            const dataSource = getDataSource();
            if (modal.mode === 'create') {
                await dataSource.createUser(data);
                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'users.create_success',
                    capabilityId: 'core.users',
                    decision: 'ALLOW',
                    reasonChain: ['User created successfully'],
                });
            } else if (modal.userId) {
                await dataSource.updateUser(modal.userId, data);
                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'users.update_success',
                    capabilityId: 'core.users',
                    decision: 'ALLOW',
                    reasonChain: ['User updated successfully'],
                });
            }
            setModal({ isOpen: false, mode: 'create' });
            loadUsers();
        } catch (error) {
            console.error('[UsersApp] Failed to save user:', error);
            setPermissionError(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: tokens.fontFamily,
                position: 'relative',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    👤 Users
                </h2>
                <div style={{ flex: 1 }} />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #ddd',
                        borderRadius: 6,
                        fontSize: 13,
                        width: 180,
                    }}
                />
                <button
                    onClick={handleCreate}
                    style={{
                        padding: '6px 14px',
                        background: '#007AFF',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    + New User
                </button>
            </div>

            {/* Permission Error */}
            {permissionError && (
                <div style={{ padding: '12px 20px 0' }}>
                    <PermissionBanner
                        message={permissionError}
                        onDismiss={() => setPermissionError(null)}
                    />
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                        Loading...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                        {search ? 'No users found' : 'No users yet'}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    NAME
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    EMAIL
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    ROLE
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    STATUS
                                </th>
                                <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    ACTIONS
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr
                                    key={user.id}
                                    style={{
                                        borderBottom: '1px solid #f5f5f5',
                                    }}
                                >
                                    <td style={{ padding: '12px', fontSize: 13 }}>
                                        {user.name}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>
                                        {user.email}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#007AFF',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <UserModal
                isOpen={modal.isOpen}
                mode={modal.mode}
                initialData={editingUser}
                onSave={handleSave}
                onCancel={() => setModal({ isOpen: false, mode: 'create' })}
            />
        </div>
    );
}
