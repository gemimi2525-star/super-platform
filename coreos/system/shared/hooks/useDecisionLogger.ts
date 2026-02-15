'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Decision Logger Hook — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Typed wrapper around addDecisionLog that matches DecisionLogEntry shape.
 *
 * @module coreos/system/shared/hooks/useDecisionLogger
 * @version 1.0.1
 */

import { useCallback } from 'react';
import { addDecisionLog } from '@/components/os-shell/system-log';

export type DecisionAction =
    | 'users.view'
    | 'users.create'
    | 'users.update'
    | 'users.delete'
    | 'users.deny'
    | 'orgs.view'
    | 'orgs.create'
    | 'orgs.update'
    | 'orgs.delete'
    | 'orgs.deny'
    | 'config.view'
    | 'config.update'
    | 'settings.view'
    | 'settings.update';

export interface DecisionMeta {
    action: DecisionAction;
    entityId?: string;
    decision?: 'ALLOW' | 'DENY' | 'SKIP';
    detail?: string;
}

export function useDecisionLogger() {
    const log = useCallback((meta: DecisionMeta) => {
        addDecisionLog({
            timestamp: Date.now(),
            action: meta.action,
            capabilityId: meta.entityId || 'system',
            decision: meta.decision || 'ALLOW',
            reasonChain: meta.detail ? [meta.detail] : undefined,
        });
    }, []);

    return { log };
}
