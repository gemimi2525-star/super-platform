/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STEP-UP AUTHENTICATION SERVICE (FIXED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages step-up authentication for sensitive actions.
 * FIXED: Stable snapshots for useSyncExternalStore compatibility.
 * 
 * @module governance/synapse/stepup/service
 * @version 2.0.0 — SSR-compatible
 */

import { addDecisionLog } from '@/components/os-shell/system-log';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type StepUpStatus =
    | 'IDLE'
    | 'REQUESTED'
    | 'CHALLENGE_SHOWN'
    | 'VERIFIED'
    | 'EXPIRED';

export interface StepUpSession {
    status: StepUpStatus;
    verifiedAt: number | null;
    expiresAt: number | null;
    correlationId: string | null;
    pendingAction: PendingAction | null;
}

export interface PendingAction {
    action: string;
    capabilityId: string;
    payload?: Record<string, unknown>;
    onSuccess?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const STEP_UP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = 'stepup_session';

// ═══════════════════════════════════════════════════════════════════════════
// STATE — MUST BE STABLE REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

// ✅ Single stable state object - only replaced on mutation
let state: StepUpSession = {
    status: 'IDLE',
    verifiedAt: null,
    expiresAt: null,
    correlationId: null,
    pendingAction: null,
};

// ✅ Cached server snapshot - NEVER changes (for SSR)
const SERVER_SNAPSHOT: StepUpSession = {
    status: 'IDLE',
    verifiedAt: null,
    expiresAt: null,
    correlationId: null,
    pendingAction: null,
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach(fn => fn());
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateCorrelationId(): string {
    return `stepup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE API
// ═══════════════════════════════════════════════════════════════════════════

export const StepUpService = {
    /**
     * Subscribe to session changes
     */
    subscribe(callback: () => void) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    },

    /**
     * Get current snapshot - MUST return stable reference
     */
    getSnapshot(): StepUpSession {
        return state;
    },

    /**
     * Get server snapshot - MUST be cached constant
     */
    getServerSnapshot(): StepUpSession {
        return SERVER_SNAPSHOT;
    },

    /**
     * Initialize from localStorage (call once on mount)
     */
    initFromStorage() {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<StepUpSession>;

                // Check if expired
                if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
                    state = {
                        status: 'VERIFIED',
                        verifiedAt: parsed.verifiedAt || null,
                        expiresAt: parsed.expiresAt,
                        correlationId: parsed.correlationId || null,
                        pendingAction: null,
                    };
                    emit();
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (e) {
            console.warn('[StepUp] Failed to load session:', e);
        }
    },

    /**
     * Check if step-up is verified and not expired
     */
    isVerified(): boolean {
        return state.status === 'VERIFIED' && (state.expiresAt ?? 0) > Date.now();
    },

    /**
     * Request step-up for a sensitive action
     * Returns true if already verified, false if challenge needed
     */
    requestStepUp(action: PendingAction): boolean {
        const correlationId = generateCorrelationId();

        addDecisionLog({
            timestamp: Date.now(),
            action: 'stepup.request',
            capabilityId: action.capabilityId,
            decision: 'ALLOW',
            reasonChain: [`Step-up requested for ${action.action}`],
            correlationId,
        });

        if (this.isVerified()) {
            addDecisionLog({
                timestamp: Date.now(),
                action: 'stepup.check',
                capabilityId: action.capabilityId,
                decision: 'ALLOW',
                reasonChain: ['Step-up session still valid'],
                correlationId,
            });
            return true;
        }

        // Need challenge - replace state reference
        state = {
            status: 'REQUESTED',
            verifiedAt: null,
            expiresAt: null,
            correlationId,
            pendingAction: action,
        };
        emit();

        addDecisionLog({
            timestamp: Date.now(),
            action: 'stepup.challenge',
            capabilityId: action.capabilityId,
            decision: 'SKIP',
            reasonChain: ['Step-up verification required'],
            correlationId,
        });

        return false;
    },

    /**
     * Complete step-up verification
     */
    verify(success: boolean) {
        if (!success) {
            addDecisionLog({
                timestamp: Date.now(),
                action: 'stepup.verify',
                capabilityId: state.pendingAction?.capabilityId || 'unknown',
                decision: 'DENY',
                reasonChain: ['Step-up verification failed'],
                correlationId: state.correlationId || undefined,
            });

            state = {
                status: 'IDLE',
                verifiedAt: null,
                expiresAt: null,
                correlationId: null,
                pendingAction: null,
            };
            emit();
            return;
        }

        const now = Date.now();
        const expiresAt = now + STEP_UP_TTL_MS;
        const pendingAction = state.pendingAction;
        const correlationId = state.correlationId;

        state = {
            status: 'VERIFIED',
            verifiedAt: now,
            expiresAt,
            correlationId,
            pendingAction: null,
        };

        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                verifiedAt: now,
                expiresAt,
                correlationId,
            }));
        }

        emit();

        addDecisionLog({
            timestamp: now,
            action: 'stepup.grant',
            capabilityId: pendingAction?.capabilityId || 'unknown',
            decision: 'ALLOW',
            reasonChain: [
                'Step-up verified successfully',
                `Session valid for ${STEP_UP_TTL_MS / 60000} minutes`,
            ],
            correlationId: correlationId || undefined,
        });

        // Execute pending action
        if (pendingAction?.onSuccess) {
            pendingAction.onSuccess();
        }
    },

    /**
     * Cancel step-up request
     */
    cancel() {
        const correlationId = state.correlationId;

        addDecisionLog({
            timestamp: Date.now(),
            action: 'stepup.cancel',
            capabilityId: state.pendingAction?.capabilityId || 'unknown',
            decision: 'DENY',
            reasonChain: ['Step-up cancelled by user'],
            correlationId: correlationId || undefined,
        });

        state = {
            status: 'IDLE',
            verifiedAt: null,
            expiresAt: null,
            correlationId: null,
            pendingAction: null,
        };
        emit();
    },

    /**
     * Clear session (on logout)
     */
    clear() {
        addDecisionLog({
            timestamp: Date.now(),
            action: 'stepup.expire',
            capabilityId: 'system',
            decision: 'ALLOW',
            reasonChain: ['Step-up session cleared'],
        });

        state = {
            status: 'IDLE',
            verifiedAt: null,
            expiresAt: null,
            correlationId: null,
            pendingAction: null,
        };

        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }

        emit();
    },

    /**
     * Get remaining time in ms
     */
    getRemainingTime(): number {
        if (!state.expiresAt) return 0;
        return Math.max(0, state.expiresAt - Date.now());
    },
};
