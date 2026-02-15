'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Org Modal — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Create/Edit organization form modal. Extracted from OrganizationsApp.tsx.
 *
 * @module coreos/system/shared/ui/orgs/OrgModal
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import type { OrgRecord, OrgFormData, OrgPlan, OrgStatus } from '../../types';

interface OrgModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: OrgRecord;
    onSave: (data: OrgFormData) => void;
    onCancel: () => void;
    variant?: 'light' | 'dark';
}

export function OrgModal({ isOpen, mode, initialData, onSave, onCancel, variant = 'light' }: OrgModalProps) {
    const [formData, setFormData] = useState<OrgFormData>({
        name: '',
        slug: '',
        plan: 'free',
        domain: '',
        status: 'active',
    });

    const isDark = variant === 'dark';

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                slug: initialData.slug || '',
                plan: initialData.plan || 'free',
                domain: initialData.domain || '',
                status: initialData.status || 'active',
            });
        } else {
            setFormData({ name: '', slug: '', plan: 'free', domain: '', status: 'active' });
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
        marginBottom: 6,
        fontSize: 13,
        fontWeight: 500,
        color: isDark ? '#aaa' : '#333',
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
        }}>
            <div style={{
                background: isDark ? '#1e1e1e' : '#fff',
                borderRadius: 12,
                padding: 24,
                width: '90%',
                maxWidth: 500,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: isDark ? '#e0e0e0' : '#333' }}>
                    {mode === 'create' ? '🏢 Create Organization' : '✏️ Edit Organization'}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Organization Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="organization-slug"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Plan</label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrgPlan })}
                            style={inputStyle}
                        >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Domain</label>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            placeholder="example.com"
                            style={inputStyle}
                        />
                    </div>

                    {mode === 'edit' && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as OrgStatus })}
                                style={inputStyle}
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                padding: '8px 16px',
                                background: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14,
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
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {mode === 'create' ? 'Create' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
