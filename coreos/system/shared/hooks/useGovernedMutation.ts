'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Governed Mutation Hook — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Combines step-up auth + decision logging into a single hook.
 * Step-up is synchronous (returns boolean, triggers modal on false).
 *
 * @module coreos/system/shared/hooks/useGovernedMutation
 * @version 1.0.1
 */

import { useCallback } from 'react';
import { useStepUpGate } from './useStepUpGate';
import { useDecisionLogger, type DecisionAction } from './useDecisionLogger';

interface GovernedOptions {
    action: DecisionAction;
    entityId?: string;
    reason?: string;
    skipStepUp?: boolean;
}

export function useGovernedMutation() {
    const { ensureVerified, isVerified } = useStepUpGate();
    const { log } = useDecisionLogger();

    /**
     * Execute a governed mutation:
     * 1. Require step-up (synchronous gate)
     * 2. If verified → execute mutation → log success
     * 3. If denied → log deny
     */
    const governedExecute = useCallback(
        async <T>(
            fn: () => Promise<T>,
            opts: GovernedOptions
        ): Promise<T | null> => {
            // Step-up gate (synchronous)
            if (!opts.skipStepUp) {
                const verified = ensureVerified({
                    reason: opts.reason || `Step-up required for ${opts.action}`,
                });
                if (!verified) {
                    log({
                        action: opts.action.replace(/\.\w+$/, '.deny') as DecisionAction,
                        entityId: opts.entityId,
                        decision: 'DENY',
                        detail: `Step-up denied for ${opts.action}`,
                    });
                    return null;
                }
            }

            try {
                const result = await fn();
                log({
                    action: opts.action,
                    entityId: opts.entityId,
                    decision: 'ALLOW',
                    detail: `${opts.action} completed`,
                });
                return result;
            } catch (error) {
                console.error(`[GovernedMutation] ${opts.action} failed:`, error);
                throw error;
            }
        },
        [ensureVerified, log]
    );

    const governedCreate = useCallback(
        <T>(fn: () => Promise<T>, opts: Omit<GovernedOptions, 'action'> & { action?: DecisionAction }) =>
            governedExecute(fn, { action: opts.action || 'users.create', ...opts }),
        [governedExecute]
    );

    const governedUpdate = useCallback(
        <T>(fn: () => Promise<T>, opts: Omit<GovernedOptions, 'action'> & { action?: DecisionAction }) =>
            governedExecute(fn, { action: opts.action || 'users.update', ...opts }),
        [governedExecute]
    );

    const governedDelete = useCallback(
        <T>(fn: () => Promise<T>, opts: Omit<GovernedOptions, 'action'> & { action?: DecisionAction }) =>
            governedExecute(fn, { action: opts.action || 'users.delete', ...opts }),
        [governedExecute]
    );

    return {
        governedExecute,
        governedCreate,
        governedUpdate,
        governedDelete,
        isVerified,
        log,
    };
}
