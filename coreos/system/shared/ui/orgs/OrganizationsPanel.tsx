'use client';

/**
 * Organizations Panel — Phase 27C.2 (Standalone Fix)
 *
 * Goal: make build PASS by removing missing-module imports.
 * - No external imports beyond React.
 * - Provides: CRUD (mock in-memory), optional API mode, search, badges, modal, basic governance logging.
 *
 * NOTE:
 * - dataSourceMode="api" will try to call /api/orgs endpoints (you can change URLs below).
 * - dataSourceMode="mock" uses in-memory state only (safe for dev/build).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type OrgPlan = 'free' | 'pro' | 'enterprise';
type OrgStatus = 'active' | 'suspended' | 'pending';

export type OrgRecord = {
    id: string;
    name: string;
    plan: OrgPlan;
    status: OrgStatus;
    createdAtISO?: string;
};

type OrgFormData = {
    name: string;
    plan: OrgPlan;
    status: OrgStatus;
};

type OrgsDataSource = {
    list(): Promise<OrgRecord[]>;
    create(input: OrgFormData): Promise<OrgRecord>;
    update(id: string, input: OrgFormData): Promise<OrgRecord>;
    remove(id: string): Promise<void>;
};

// ──────────────────────────────────────────────────────────────────────────────
// Small UI helpers (standalone, no external deps)
// ──────────────────────────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(' ');
}

function StatusBadge({ value }: { value: OrgStatus }) {
    const label =
        value === 'active' ? 'ACTIVE' : value === 'suspended' ? 'SUSPENDED' : 'PENDING';

    const style: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.4px',
        border: '1px solid rgba(0,0,0,0.12)',
        userSelect: 'none',
    };

    // color accents (kept simple, no external theme)
    if (value === 'active') {
        style.background = 'rgba(46, 125, 50, 0.14)';
        style.border = '1px solid rgba(46, 125, 50, 0.35)';
    } else if (value === 'suspended') {
        style.background = 'rgba(211, 47, 47, 0.14)';
        style.border = '1px solid rgba(211, 47, 47, 0.35)';
    } else {
        style.background = 'rgba(245, 124, 0, 0.14)';
        style.border = '1px solid rgba(245, 124, 0, 0.35)';
    }

    return <span style={style}>{label}</span>;
}

function PlanBadge({ value }: { value: OrgPlan }) {
    const label = value.toUpperCase();
    const style: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.4px',
        border: '1px solid rgba(0,0,0,0.12)',
        background: 'rgba(25, 118, 210, 0.12)',
        borderColor: 'rgba(25, 118, 210, 0.35)',
        userSelect: 'none',
    };
    if (value === 'enterprise') {
        style.background = 'rgba(123, 31, 162, 0.12)';
        style.borderColor = 'rgba(123, 31, 162, 0.35)';
    } else if (value === 'pro') {
        style.background = 'rgba(2, 136, 209, 0.12)';
        style.borderColor = 'rgba(2, 136, 209, 0.35)';
    }
    return <span style={style}>{label}</span>;
}

function SearchInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? 'Search...'}
            style={{
                width: 260,
                maxWidth: '100%',
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.18)',
                outline: 'none',
                fontSize: 13,
            }}
        />
    );
}

function Button({
    children,
    onClick,
    variant = 'primary',
    disabled,
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'ghost' | 'danger';
    disabled?: boolean;
}) {
    const base: React.CSSProperties = {
        padding: '8px 12px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        border: '1px solid rgba(0,0,0,0.12)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none',
    };

    if (variant === 'primary') {
        base.background = '#0B57D0';
        base.color = '#fff';
        base.border = '1px solid rgba(11, 87, 208, 0.35)';
    } else if (variant === 'danger') {
        base.background = 'rgba(211, 47, 47, 0.12)';
        base.border = '1px solid rgba(211, 47, 47, 0.35)';
        base.color = '#8B1D1D';
    } else {
        base.background = 'transparent';
    }

    return (
        <button type="button" style={base} onClick={disabled ? undefined : onClick}>
            {children}
        </button>
    );
}

function FieldLabel({ children, isDark = false }: { children: React.ReactNode; isDark?: boolean }) {
    return (
        <div style={{
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 6,
            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
        }}>
            {children}
        </div>
    );
}

function Modal({
    open,
    title,
    children,
    onClose,
    isDark = false,
}: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    isDark?: boolean;
}) {
    if (!open) return null;

    // Phase 27C.6: Theme-aware modal styles
    const modalBg = isDark ? '#1C1F26' : '#fff';
    const modalText = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
    const headerBorder = isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)';
    const closeBtnColor = isDark ? 'rgba(255,255,255,0.7)' : undefined;

    return (
        <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{
                position: 'fixed',
                inset: 0,
                background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    width: 520,
                    maxWidth: '100%',
                    background: modalBg,
                    color: modalText,
                    borderRadius: 16,
                    boxShadow: isDark
                        ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
                        : '0 10px 30px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '14px 16px',
                        borderBottom: headerBorder,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <div style={{ fontSize: 14, fontWeight: 800, color: modalText }}>{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: 18,
                            cursor: 'pointer',
                            color: closeBtnColor,
                            padding: '4px 8px',
                            borderRadius: 6,
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div style={{ padding: 16 }}>{children}</div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Governance helper (standalone)
// ──────────────────────────────────────────────────────────────────────────────

function useGovernedMutation() {
    const log = useCallback((event: string, payload?: any) => {
        // keep as console log only (safe for build)
        // eslint-disable-next-line no-console
        console.log(`[Governed] ${event}`, payload ?? {});
    }, []);

    const governedCreate = useCallback(async <T,>(fn: () => Promise<T>, meta?: any) => {
        log('CREATE_REQUEST', meta);
        const out = await fn();
        log('CREATE_DONE', meta);
        return out;
    }, [log]);

    const governedUpdate = useCallback(async <T,>(fn: () => Promise<T>, meta?: any) => {
        log('UPDATE_REQUEST', meta);
        const out = await fn();
        log('UPDATE_DONE', meta);
        return out;
    }, [log]);

    const governedDelete = useCallback(async <T,>(fn: () => Promise<T>, meta?: any) => {
        log('DELETE_REQUEST', meta);
        const out = await fn();
        log('DELETE_DONE', meta);
        return out;
    }, [log]);

    return { governedCreate, governedUpdate, governedDelete, log };
}

// ──────────────────────────────────────────────────────────────────────────────
// Data sources (API + Mock)
// ──────────────────────────────────────────────────────────────────────────────

const API_BASE = '/api/platform/orgs'; // Phase 27C.5: Fixed from /api/orgs (404) to canonical endpoint

function jsonHeaders() {
    return { 'Content-Type': 'application/json' };
}

/** Parse error body from API response for user-facing message */
async function parseApiError(res: Response, fallback: string): Promise<string> {
    try {
        const body = await res.json();
        if (res.status === 503) {
            return 'Service Temporarily Unavailable (Quota Exceeded). Please retry later.';
        }
        return body?.error?.message || body?.error || fallback;
    } catch {
        if (res.status === 503) return 'Service Temporarily Unavailable (Quota Exceeded). Please retry later.';
        return fallback;
    }
}

const orgsApiDataSource: OrgsDataSource = {
    async list() {
        const res = await fetch(`${API_BASE}`, { method: 'GET' });
        if (!res.ok) throw new Error(await parseApiError(res, `Failed to load organizations (${res.status})`));
        const data = (await res.json()) as { organizations?: OrgRecord[]; items?: OrgRecord[] } | OrgRecord[];
        if (Array.isArray(data)) return data;
        return data.organizations ?? data.items ?? [];
    },
    async create(input) {
        const res = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: jsonHeaders(),
            body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await parseApiError(res, `Create failed (${res.status})`));
        return (await res.json()) as OrgRecord;
    },
    async update(id, input) {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: jsonHeaders(),
            body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await parseApiError(res, `Update failed (${res.status})`));
        return (await res.json()) as OrgRecord;
    },
    async remove(id) {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await parseApiError(res, `Delete failed (${res.status})`));
    },
};

// In-memory mock store (module-level)
const mockStore: { items: OrgRecord[]; seeded: boolean } = { items: [], seeded: false };

function seedMockOnce() {
    if (mockStore.seeded) return;
    mockStore.items = [
        {
            id: 'org_demo_001',
            name: 'APICOREDATA Demo Org',
            plan: 'pro',
            status: 'active',
            createdAtISO: new Date(Date.now() - 864e5 * 10).toISOString(),
        },
        {
            id: 'org_demo_002',
            name: 'System Hub Sandbox',
            plan: 'free',
            status: 'pending',
            createdAtISO: new Date(Date.now() - 864e5 * 2).toISOString(),
        },
    ];
    mockStore.seeded = true;
}

const orgsMockDataSource: OrgsDataSource = {
    async list() {
        seedMockOnce();
        // simulate latency
        await new Promise((r) => setTimeout(r, 180));
        return [...mockStore.items];
    },
    async create(input) {
        await new Promise((r) => setTimeout(r, 150));
        const item: OrgRecord = {
            id: `org_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
            name: input.name.trim(),
            plan: input.plan,
            status: input.status,
            createdAtISO: new Date().toISOString(),
        };
        mockStore.items = [item, ...mockStore.items];
        return item;
    },
    async update(id, input) {
        await new Promise((r) => setTimeout(r, 150));
        const idx = mockStore.items.findIndex((x) => x.id === id);
        if (idx === -1) throw new Error('Org not found');
        const updated: OrgRecord = {
            ...mockStore.items[idx],
            name: input.name.trim(),
            plan: input.plan,
            status: input.status,
        };
        mockStore.items = [
            ...mockStore.items.slice(0, idx),
            updated,
            ...mockStore.items.slice(idx + 1),
        ];
        return updated;
    },
    async remove(id) {
        await new Promise((r) => setTimeout(r, 120));
        mockStore.items = mockStore.items.filter((x) => x.id !== id);
    },
};

function getDataSource(mode: 'api' | 'mock'): OrgsDataSource {
    return mode === 'api' ? orgsApiDataSource : orgsMockDataSource;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────

export interface OrganizationsPanelProps {
    /** 'light' for legacy OS Shell, 'dark' for System Hub */
    variant?: 'light' | 'dark';
    /** Data source mode */
    dataSourceMode?: 'api' | 'mock';
    /** Compact mode (fewer columns) */
    compact?: boolean;
}

export function OrganizationsPanel({
    variant = 'light',
    dataSourceMode = 'api',
    compact = false,
}: OrganizationsPanelProps) {
    const isDark = variant === 'dark';
    const ds = useMemo(() => getDataSource(dataSourceMode), [dataSourceMode]);

    const { governedCreate, governedUpdate, governedDelete } = useGovernedMutation();

    const [orgs, setOrgs] = useState<OrgRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return orgs;
        return orgs.filter((o) => (o.name ?? '').toLowerCase().includes(s));
    }, [orgs, search]);

    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; orgId?: string }>({
        open: false,
        mode: 'create',
    });

    const editingOrg = useMemo(() => {
        if (!modal.open || modal.mode !== 'edit' || !modal.orgId) return undefined;
        return orgs.find((o) => o.id === modal.orgId);
    }, [modal, orgs]);

    const [form, setForm] = useState<OrgFormData>({
        name: '',
        plan: 'free',
        status: 'active',
    });

    const [saving, setSaving] = useState(false);
    const mountedRef = useRef(true);
    // Phase 27C-stab: Quota backoff guard — skip auto-refresh after 503
    const quotaBackoffRef = useRef(false);
    // Phase 27C-stab: Dedupe guard — prevent double-fetch from re-renders
    const fetchInFlightRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadOrgs = useCallback(async (force = false) => {
        // Dedupe: skip if fetch already in progress
        if (fetchInFlightRef.current) return;
        // Backoff: skip auto-fetch after 503 (user must click Retry)
        if (quotaBackoffRef.current && !force) return;

        fetchInFlightRef.current = true;
        setLoading(true);
        setLoadError(null);
        try {
            const data = await ds.list();
            if (!mountedRef.current) return;
            setOrgs(data);
            quotaBackoffRef.current = false; // Reset backoff on success
        } catch (err: any) {
            if (!mountedRef.current) return;
            const msg = err?.message || 'Failed to load organizations';
            // Detect 503 / quota errors → enable backoff
            if (msg.includes('503') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('unavailable')) {
                quotaBackoffRef.current = true;
                setLoadError('Service Temporarily Unavailable (Quota Exceeded). Please retry later.');
            } else {
                setLoadError(msg);
            }
        } finally {
            fetchInFlightRef.current = false;
            if (mountedRef.current) setLoading(false);
        }
    }, [ds]);

    // Manual retry (bypasses backoff)
    const retryLoadOrgs = useCallback(() => {
        quotaBackoffRef.current = false;
        loadOrgs(true);
    }, [loadOrgs]);

    useEffect(() => {
        loadOrgs();
    }, [loadOrgs]);

    const openCreate = useCallback(() => {
        setForm({ name: '', plan: 'free', status: 'active' });
        setModal({ open: true, mode: 'create' });
    }, []);

    const openEdit = useCallback((org: OrgRecord) => {
        setForm({ name: org.name ?? '', plan: org.plan, status: org.status });
        setModal({ open: true, mode: 'edit', orgId: org.id });
    }, []);

    const closeModal = useCallback(() => {
        setModal({ open: false, mode: 'create' });
        setSaving(false);
    }, []);

    const onSubmit = useCallback(async () => {
        const name = form.name.trim();
        if (!name) {
            alert('Name is required');
            return;
        }
        setSaving(true);
        try {
            if (modal.mode === 'create') {
                const created = await governedCreate(() => ds.create({ ...form, name }), {
                    name,
                });
                if (!mountedRef.current) return;
                setOrgs((prev) => [created, ...prev]);
                closeModal();
            } else {
                const id = modal.orgId;
                if (!id) throw new Error('Missing org id');
                const updated = await governedUpdate(() => ds.update(id, { ...form, name }), {
                    id,
                    name,
                });
                if (!mountedRef.current) return;
                setOrgs((prev) => prev.map((o) => (o.id === id ? updated : o)));
                closeModal();
            }
        } catch (err: any) {
            alert(err?.message || 'Save failed');
            setSaving(false);
        }
    }, [form, modal, ds, governedCreate, governedUpdate, closeModal]);

    const onDelete = useCallback(
        async (org: OrgRecord) => {
            const ok = confirm(`Delete organization "${org.name}" ?`);
            if (!ok) return;
            try {
                await governedDelete(() => ds.remove(org.id), { id: org.id });
                if (!mountedRef.current) return;
                setOrgs((prev) => prev.filter((x) => x.id !== org.id));
            } catch (err: any) {
                alert(err?.message || 'Delete failed');
            }
        },
        [ds, governedDelete]
    );

    // ── Styles (simple + deterministic)
    const pageStyle: React.CSSProperties = {
        padding: 20,
        height: '100%',
        overflow: 'auto',
        color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.86)',
        background: isDark ? '#0E1116' : '#FFFFFF',
    };

    const cardStyle: React.CSSProperties = {
        borderRadius: 16,
        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        boxShadow: isDark ? 'none' : '0 6px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
    };

    const tableHeaderStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        padding: '10px 12px',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)',
        opacity: 0.85,
    };

    const rowStyle: React.CSSProperties = {
        padding: '12px 12px',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        display: 'grid',
        gridTemplateColumns: compact ? '1fr 120px 130px 120px' : '1.6fr 140px 140px 180px 160px',
        gap: 10,
        alignItems: 'center',
    };

    const cellMuted: React.CSSProperties = { opacity: 0.8, fontSize: 13 };

    return (
        <div style={pageStyle}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 14,
                }}
            >
                <div>
                    <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>
                        🏢 Organizations <span style={{ opacity: 0.7 }}>({filtered.length})</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Mode: <b>{dataSourceMode}</b> • Variant: <b>{variant}</b>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search organizations..." />
                    <Button variant="ghost" onClick={loadOrgs} disabled={loading}>
                        ⟳ Refresh
                    </Button>
                    <Button onClick={openCreate}>＋ New</Button>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={tableHeaderStyle}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: compact
                                ? '1fr 120px 130px 120px'
                                : '1.6fr 140px 140px 180px 160px',
                            gap: 10,
                        }}
                    >
                        <div>Name</div>
                        <div>Plan</div>
                        <div>Status</div>
                        {!compact && <div>Created</div>}
                        <div>Actions</div>
                    </div>
                </div>

                {loading && (
                    <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>Loading…</div>
                )}

                {!loading && loadError && (
                    <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: '#B3261E' }}>
                            Failed to load
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>{loadError}</div>
                        <Button onClick={retryLoadOrgs}>Retry</Button>
                    </div>
                )}

                {!loading && !loadError && filtered.length === 0 && (
                    <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>No organizations found.</div>
                )}

                {!loading &&
                    !loadError &&
                    filtered.map((org) => (
                        <div key={org.id} style={rowStyle}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800 }}>{org.name}</div>
                                <div style={{ fontSize: 12, opacity: 0.65 }}>{org.id}</div>
                            </div>
                            <div>
                                <PlanBadge value={org.plan} />
                            </div>
                            <div>
                                <StatusBadge value={org.status} />
                            </div>
                            {!compact && (
                                <div style={cellMuted}>{org.createdAtISO ? org.createdAtISO : '—'}</div>
                            )}
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <Button variant="ghost" onClick={() => openEdit(org)}>
                                    Edit
                                </Button>
                                <Button variant="danger" onClick={() => onDelete(org)}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
            </div>

            <Modal
                open={modal.open}
                title={modal.mode === 'create' ? 'Create Organization' : 'Edit Organization'}
                onClose={closeModal}
                isDark={isDark}
            >
                {/* Phase 27C.6: Variant-aware modal form */}
                {(() => {
                    // Shared input/select styles for dark/light
                    const inputStyle: React.CSSProperties = {
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.18)',
                        fontSize: 13,
                        background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
                        color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)',
                        outline: 'none',
                    };
                    const selectStyle: React.CSSProperties = {
                        ...inputStyle,
                        appearance: 'auto' as const,
                    };

                    return (
                        <div style={{ display: 'grid', gap: 14 }}>
                            {/* Name field */}
                            <div>
                                <FieldLabel isDark={isDark}>Name</FieldLabel>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Organization name"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Plan + Status row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <FieldLabel isDark={isDark}>Plan</FieldLabel>
                                    <select
                                        value={form.plan}
                                        onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value as OrgPlan }))}
                                        style={selectStyle}
                                    >
                                        <option value="free">free</option>
                                        <option value="pro">pro</option>
                                        <option value="enterprise">enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <FieldLabel isDark={isDark}>Status</FieldLabel>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as OrgStatus }))}
                                        style={selectStyle}
                                    >
                                        <option value="active">active</option>
                                        <option value="pending">pending</option>
                                        <option value="suspended">suspended</option>
                                    </select>
                                </div>
                            </div>

                            {/* Edit info */}
                            {modal.mode === 'edit' && editingOrg && (
                                <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    Editing: <b>{editingOrg.id}</b>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                                <Button variant="ghost" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button onClick={onSubmit} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                            </div>

                            {/* Tip */}
                            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
                                Tip: API endpoint is <b>{API_BASE}</b> (GET/POST/PUT/DELETE)
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
