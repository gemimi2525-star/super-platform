/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Session Context Provider (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * React Context for propagating SessionContext through the UI tree.
 * When multi-tenant is disabled, provides null (backward compatible).
 */

'use client';

import { createContext, useContext } from 'react';
import type { SessionContext } from './types';

// ─── Context ────────────────────────────────────────────────────────────

const SessionCtx = createContext<SessionContext | null>(null);

/**
 * SessionProvider — wraps children with session context.
 * Pass `value={null}` when multi-tenant is disabled.
 */
export const SessionProvider = SessionCtx.Provider;

/**
 * useSessionContext — access the current session context.
 * Returns null when multi-tenant is disabled.
 */
export function useSessionContext(): SessionContext | null {
    return useContext(SessionCtx);
}

/**
 * useRequiredSessionContext — access session context or throw.
 * Use in components that MUST have tenant context.
 */
export function useRequiredSessionContext(): SessionContext {
    const ctx = useContext(SessionCtx);
    if (!ctx) {
        throw new Error('[Phase 29] SessionContext required but not available. Is multi-tenant enabled?');
    }
    return ctx;
}

// ─── Server-side helpers ────────────────────────────────────────────────

/**
 * Extract session headers from a Request.
 */
export function extractSessionHeaders(req: Request): {
    tenantId: string | null;
    sessionId: string | null;
    traceId: string | null;
} {
    return {
        tenantId: req.headers.get('x-tenant-id'),
        sessionId: req.headers.get('x-session-id'),
        traceId: req.headers.get('x-trace-id'),
    };
}
