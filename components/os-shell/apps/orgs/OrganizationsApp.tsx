/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORGANIZATIONS APP — Main Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * MVP Organizations management app with list, search, create, edit.
 * All sensitive actions go through step-up authentication + governance.
 * 
 * @module components/os-shell/apps/orgs/OrganizationsApp
 * @version 1.0.0 — Phase XII
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { AppProps } from '../registry';
import type { Organization, OrganizationFormData, OrganizationPlan, OrganizationStatus, OrganizationsDataSource } from './types';
import { mockDataSource } from './datasources/mock';
import { apiDataSource } from './datasources/api';
import { tokens } from '../../tokens';
import { addDecisionLog } from '../../system-log';
import { useStepUpAuth } from '@/governance/synapse/stepup';

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DATA_SOURCE_MODE: 'mock' | 'api' = 'api';

function getDataSource(): OrganizationsDataSource {
    return DATA_SOURCE_MODE === 'api' ? apiDataSource : mockDataSource;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ModalState {
    isOpen: boolean;
    mode: 'create' | 'edit';
    orgId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORG MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface OrgModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: Organization;
    onSave: (data: OrganizationFormData) => void;
    onCancel: () => void;
}

function OrgModal({ isOpen, mode, initialData, onSave, onCancel }: OrgModalProps) {
    const [formData, setFormData] = useState<OrganizationFormData>({
        name: '',
        slug: '',
        plan: 'free',
        domain: '',
        status: 'active',
    });

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
            setFormData({
                name: '',
                slug: '',
                plan: 'free',
                domain: '',
                status: 'active',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: 24,
                width: '90%',
                maxWidth: 500,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600 }}>
                    {mode === 'create' ? '🏢 Create Organization' : '✏️ Edit Organization'}
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            Organization Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            Slug
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="organization-slug"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            Plan
                        </label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrganizationPlan })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            Domain
                        </label>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            placeholder="example.com"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        />
                    </div>

                    {mode === 'edit' && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as OrganizationStatus })}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: 6,
                                    fontSize: 14,
                                }}
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
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 14,
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

// ═══════════════════════════════════════════════════════════════════════════
// PLAN BADGE
// ═══════════════════════════════════════════════════════════════════════════

function PlanBadge({ plan }: { plan?: OrganizationPlan }) {
    const colors = {
        free: { bg: '#f0f0f0', text: '#666' },
        starter: { bg: '#e3f2fd', text: '#1976d2' },
        pro: { bg: '#e8f5e9', text: '#388e3c' },
        enterprise: { bg: '#f3e5f5', text: '#7b1fa2' },
    };

    const color = colors[plan || 'free'];

    return (
        <span style={{
            padding: '4px 10px',
            background: color.bg,
            color: color.text,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'capitalize',
        }}>
            {plan || 'free'}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status?: OrganizationStatus }) {
    const colors = {
        active: { bg: '#e8f5e9', text: '#388e3c' },
        suspended: { bg: '#fff3e0', text: '#f57c00' },
        disabled: { bg: '#ffebee', text: '#c62828' },
    };

    const color = colors[status || 'active'];

    return (
        <span style={{
            padding: '4px 10px',
            background: color.bg,
            color: color.text,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'capitalize',
        }}>
            {status || 'active'}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OrganizationsApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: 'create' });
    const [editingOrg, setEditingOrg] = useState<Organization | undefined>();

    const { requireStepUp } = useStepUpAuth();

    // Load organizations
    const loadOrgs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDataSource().listOrganizations();
            setOrgs(data);

            addDecisionLog({
                timestamp: Date.now(),
                action: 'orgs.view',
                capabilityId: 'org.manage',
                decision: 'ALLOW',
                reasonChain: ['User has orgs.read permission'],
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load organizations');
            addDecisionLog({
                timestamp: Date.now(),
                action: 'orgs.view',
                capabilityId: 'org.manage',
                decision: 'DENY',
                reasonChain: ['Failed to load organizations'],
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrgs();
    }, [loadOrgs]);

    // Handle create with step-up
    const handleCreate = () => {
        const verified = requireStepUp({
            action: 'create organization',
            capabilityId: 'org.manage',
            onSuccess: () => {
                setEditingOrg(undefined);
                setModal({ isOpen: true, mode: 'create' });
            },
        });

        if (verified) {
            setEditingOrg(undefined);
            setModal({ isOpen: true, mode: 'create' });
        }
    };

    // Handle edit with step-up
    const handleEdit = (org: Organization) => {
        const verified = requireStepUp({
            action: 'edit organization',
            capabilityId: 'org.manage',
            onSuccess: () => {
                setEditingOrg(org);
                setModal({ isOpen: true, mode: 'edit', orgId: org.id });
            },
        });

        if (verified) {
            setEditingOrg(org);
            setModal({ isOpen: true, mode: 'edit', orgId: org.id });
        }
    };

    // Handle save
    const handleSave = async (data: OrganizationFormData) => {
        try {
            if (modal.mode === 'create') {
                await getDataSource().createOrganization(data);

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'orgs.create',
                    capabilityId: 'org.manage',
                    decision: 'ALLOW',
                    reasonChain: ['Organization created successfully'],
                });
            } else if (modal.orgId) {
                await getDataSource().updateOrganization(modal.orgId, data);

                addDecisionLog({
                    timestamp: Date.now(),
                    action: 'orgs.update',
                    capabilityId: 'org.manage',
                    decision: 'ALLOW',
                    reasonChain: ['Organization updated successfully'],
                });
            }

            setModal({ isOpen: false, mode: 'create' });
            loadOrgs();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save organization');
        }
    };

    // Filter organizations
    const filteredOrgs = orgs.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: tokens.fontFamily,
            padding: 20,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
            }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                    🏢 Organizations
                </h2>
                <button
                    onClick={handleCreate}
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
                    + Create Organization
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        fontSize: 14,
                    }}
                />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                        Loading organizations...
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: 16,
                        background: '#ffebee',
                        border: '1px solid #ef5350',
                        borderRadius: 8,
                        color: '#c62828',
                        marginBottom: 16,
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {!loading && !error && filteredOrgs.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: 60,
                        color: '#888',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                        <div style={{ fontSize: 16, marginBottom: 8 }}>No organizations found</div>
                        <div style={{ fontSize: 13 }}>
                            {searchQuery ? 'Try a different search' : 'Create your first organization'}
                        </div>
                    </div>
                )}

                {!loading && !error && filteredOrgs.length > 0 && (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                    }}>
                        <thead>
                            <tr style={{
                                borderBottom: '2px solid #eee',
                                textAlign: 'left',
                            }}>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Name</th>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Slug</th>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Plan</th>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Domain</th>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Status</th>
                                <th style={{ padding: '12px 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrgs.map(org => (
                                <tr key={org.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '12px 8px', fontSize: 14 }}>{org.name}</td>
                                    <td style={{ padding: '12px 8px', fontSize: 13, color: '#666' }}>{org.slug || '-'}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <PlanBadge plan={org.plan} />
                                    </td>
                                    <td style={{ padding: '12px 8px', fontSize: 13, color: '#666' }}>{org.domain || '-'}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <StatusBadge status={org.status} />
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <button
                                            onClick={() => handleEdit(org)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#f5f5f5',
                                                border: 'none',
                                                borderRadius: 4,
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
            <OrgModal
                isOpen={modal.isOpen}
                mode={modal.mode}
                initialData={editingOrg}
                onSave={handleSave}
                onCancel={() => setModal({ isOpen: false, mode: 'create' })}
            />
        </div>
    );
}
