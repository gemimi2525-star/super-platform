'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Step-Up Gate Hook — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Wraps useStepUpAuth() with a cleaner API for shared panels.
 * requireStepUp() is SYNCHRONOUS — returns boolean immediately.
 *
 * @module coreos/system/shared/hooks/useStepUpGate
 * @version 1.0.1
 */

import { useStepUpAuth } from '@/governance/synapse/stepup';
import { useCallback } from 'react';

export function useStepUpGate() {
    const { requireStepUp, isVerified } = useStepUpAuth();

    const ensureVerified = useCallback(
        (opts?: { reason?: string; onSuccess?: () => void }): boolean => {
            return requireStepUp({
                action: opts?.reason || 'This action requires additional verification',
                capabilityId: 'system',
                onSuccess: opts?.onSuccess,
            });
        },
        [requireStepUp]
    );

    return { ensureVerified, isVerified };
}
