/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP-UP HOOK (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hook to interact with step-up service.
 * FIXED: Stable snapshots for useSyncExternalStore compatibility.
 * 
 * @module governance/synapse/stepup/hook
 * @version 2.0.0 — SSR-compatible
 */

'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { StepUpService, type PendingAction } from './service';

/**
 * Hook for step-up authentication
 */
export function useStepUpAuth() {
    // ✅ Initialize from localStorage once on mount (client-only)
    useEffect(() => {
        StepUpService.initFromStorage();
    }, []);

    // ✅ Use stable snapshot functions
    const session = useSyncExternalStore(
        StepUpService.subscribe,
        StepUpService.getSnapshot,
        StepUpService.getServerSnapshot
    );

    const isVerified = StepUpService.isVerified();
    const remainingTime = StepUpService.getRemainingTime();

    const requireStepUp = useCallback((action: PendingAction): boolean => {
        return StepUpService.requestStepUp(action);
    }, []);

    const verify = useCallback((success: boolean) => {
        StepUpService.verify(success);
    }, []);

    const cancel = useCallback(() => {
        StepUpService.cancel();
    }, []);

    const clear = useCallback(() => {
        StepUpService.clear();
    }, []);

    return {
        session,
        isVerified,
        remainingTime,
        isPending: session.status === 'REQUESTED' || session.status === 'CHALLENGE_SHOWN',
        requireStepUp,
        verify,
        cancel,
        clear,
    };
}
