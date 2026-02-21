/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tenant Store — Client-side Multi-tenant State (Phase 29.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zustand store for managing tenant sessions on the client.
 * Scoped by namespace when multi-tenant is enabled.
 * When flag is OFF, provides a static default tenant.
 */

'use client';

import { create } from 'zustand';
import type { SessionContext, TenantMembership, TenantId } from './types';
import { DEFAULT_TENANT_ID } from './types';

// ─── Store Shape ────────────────────────────────────────────────────────

interface TenantStore {
    /** Current active session */
    session: SessionContext | null;
    /** Available tenant memberships */
    memberships: TenantMembership[];
    /** Loading state */
    loading: boolean;
    /** Multi-tenant flag status */
    multiTenantEnabled: boolean;

    // Actions
    setSession: (s: SessionContext | null) => void;
    setMemberships: (m: TenantMembership[]) => void;
    setLoading: (l: boolean) => void;
    setMultiTenantEnabled: (v: boolean) => void;
    /**
     * Switch to a different tenant.
     * Creates a new session and clears scoped state.
     */
    switchTenant: (tenantId: TenantId) => Promise<void>;
    /**
     * Initialize: fetch memberships and auto-start session.
     */
    initialize: () => Promise<void>;
}

// ─── Default Session (Legacy mode) ──────────────────────────────────────

const LEGACY_SESSION: SessionContext = {
    tenantId: DEFAULT_TENANT_ID,
    userId: 'local-user',
    sessionId: 'legacy-single',
    role: 'owner',
    issuedAt: Date.now(),
    authMode: 'DEV',
};

// ─── Store ──────────────────────────────────────────────────────────────

export const useTenantStore = create<TenantStore>((set, get) => ({
    session: null,
    memberships: [],
    loading: false,
    multiTenantEnabled: false,

    setSession: (s) => set({ session: s }),
    setMemberships: (m) => set({ memberships: m }),
    setLoading: (l) => set({ loading: l }),
    setMultiTenantEnabled: (v) => set({ multiTenantEnabled: v }),

    switchTenant: async (tenantId) => {
        set({ loading: true });
        try {
            // End current session if exists
            const current = get().session;
            if (current && current.sessionId !== 'legacy-single') {
                await fetch('/api/tenants/sessions/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId: current.tenantId,
                        sessionId: current.sessionId,
                    }),
                });
            }

            // Start new session
            const res = await fetch('/api/tenants/sessions/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId }),
            });
            const data = await res.json();

            if (data.sessionId) {
                const membership = get().memberships.find(m => m.tenantId === tenantId);
                set({
                    session: {
                        tenantId,
                        userId: get().session?.userId || 'local-user',
                        sessionId: data.sessionId,
                        role: membership?.role || 'user',
                        issuedAt: Date.now(),
                        authMode: get().session?.authMode || 'DEV',
                    },
                });
            }
        } catch (e) {
            console.warn('[TenantStore] Switch failed:', e);
        } finally {
            set({ loading: false });
        }
    },

    initialize: async () => {
        set({ loading: true });
        try {
            const res = await fetch('/api/tenants/my');
            const data = await res.json();

            const mt = data.multiTenantEnabled === true;
            set({ multiTenantEnabled: mt });

            if (!mt) {
                // Legacy mode — single default tenant
                set({
                    session: LEGACY_SESSION,
                    memberships: data.memberships || [],
                    loading: false,
                });
                return;
            }

            // Multi-tenant mode
            const memberships: TenantMembership[] = data.memberships || [];
            set({ memberships });

            if (memberships.length > 0) {
                // Auto-start session with first tenant
                await get().switchTenant(memberships[0].tenantId);
            }
        } catch (e) {
            console.warn('[TenantStore] Init failed, fallback to legacy:', e);
            set({ session: LEGACY_SESSION, loading: false });
        } finally {
            set({ loading: false });
        }
    },
}));

// ─── Header Injection Helper ────────────────────────────────────────────

/**
 * Get tenant headers for API calls.
 * Call this to add x-tenant-id + x-session-id to any fetch.
 */
export function getTenantHeaders(): Record<string, string> {
    const state = useTenantStore.getState();
    const session = state.session;
    if (!session) return {};

    return {
        'x-tenant-id': session.tenantId,
        'x-session-id': session.sessionId,
    };
}
