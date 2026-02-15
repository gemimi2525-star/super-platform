'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * User Modal — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Create/Edit user form modal. Extracted from UsersApp.tsx.
 *
 * @module coreos/system/shared/ui/users/UserModal
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import type { UserRecord, UserFormData, UserRole, UserStatus } from '../../types';

interface UserModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: UserRecord;
    onSave: (data: UserFormData) => void;
    onCancel: () => void;
    variant?: 'light' | 'dark';
}

export function UserModal({ isOpen, mode, initialData, onSave, onCancel, variant = 'light' }: UserModalProps) {
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        role: 'user',
        status: 'active',
    });

    const isDark = variant === 'dark';

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

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #ddd',
        borderRadius: 6,
        fontSize: 14,
        background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        color: isDark ? '#e0e0e0' : '#333',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 12,
        color: isDark ? '#aaa' : '#666',
        marginBottom: 4,
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
            }}
        >
            <div
                style={{
                    background: isDark ? '#1e1e1e' : '#fff',
                    borderRadius: 12,
                    padding: 24,
                    width: 360,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
            >
                <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: isDark ? '#e0e0e0' : '#333' }}>
                    {mode === 'create' ? 'Create User' : 'Edit User'}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                            style={inputStyle}
                        >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>Status</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                            style={inputStyle}
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
                                background: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                color: isDark ? '#ccc' : '#333',
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
