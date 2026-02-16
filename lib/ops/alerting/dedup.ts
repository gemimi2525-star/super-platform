/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Alerting — Dedup Engine (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Prevents alert spam by storing fingerprints in Firestore.
 * Tracks last alert status and enables recovery notifications.
 *
 * Firestore collection: ops_alert_state/{env}
 *
 * Fields:
 *   - lastFingerprint: string (hash of status + violation codes)
 *   - lastSentAt: number (epoch ms)
 *   - lastStatus: string
 *   - lastViolationHash: string
 *   - recoverySentAt: number | null
 *   - escalation30mSentAt: number | null
 *   - escalation2hSentAt: number | null
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

const COLLECTION = 'ops_alert_state';
const DEFAULT_TTL_SECONDS = 900; // 15 minutes

export interface AlertState {
    lastFingerprint: string;
    lastSentAt: number;
    lastStatus: string;
    lastViolationHash: string;
    recoverySentAt: number | null;
    escalation30mSentAt: number | null;
    escalation2hSentAt: number | null;
}

export interface DedupDecision {
    shouldSend: boolean;
    reason: string;
    isRecovery: boolean;
    isEscalation30m: boolean;
    isEscalation2h: boolean;
}

/**
 * Compute a fingerprint from status + violation codes.
 */
export function computeFingerprint(status: string, violationCodes: string[]): string {
    const raw = `${status}:${violationCodes.sort().join(',')}`;
    return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Get the current alert state from Firestore.
 */
export async function getAlertState(): Promise<AlertState | null> {
    try {
        const db = getAdminFirestore();
        const env = process.env.NODE_ENV || 'production';
        const doc = await db.collection(COLLECTION).doc(env).get();
        if (!doc.exists) return null;
        return doc.data() as AlertState;
    } catch (err: any) {
        console.warn('[Alert/Dedup] getAlertState error:', err.message);
        return null;
    }
}

/**
 * Update the alert state in Firestore.
 */
export async function updateAlertState(state: Partial<AlertState>): Promise<void> {
    try {
        const db = getAdminFirestore();
        const env = process.env.NODE_ENV || 'production';
        await db.collection(COLLECTION).doc(env).set(state, { merge: true });
    } catch (err: any) {
        console.warn('[Alert/Dedup] updateAlertState error:', err.message);
    }
}

/**
 * Evaluate whether an alert should be sent based on dedup rules.
 *
 * Rules:
 * 1. If fingerprint matches and TTL hasn't expired → suppress
 * 2. If status changed to HEALTHY after non-HEALTHY → send recovery
 * 3. If non-HEALTHY for > 30 min and no escalation sent → escalate
 * 4. If non-HEALTHY for > 2h and no 2h escalation sent → critical escalate
 */
export async function evaluateDedup(
    currentStatus: string,
    violationCodes: string[],
): Promise<DedupDecision> {
    const now = Date.now();
    const ttlMs = (parseInt(process.env.ALERT_DEDUP_TTL_SECONDS ?? '', 10) || DEFAULT_TTL_SECONDS) * 1000;
    const fingerprint = computeFingerprint(currentStatus, violationCodes);
    const state = await getAlertState();

    // No previous state → always send
    if (!state) {
        if (currentStatus === 'HEALTHY') {
            return { shouldSend: false, reason: 'initial_healthy', isRecovery: false, isEscalation30m: false, isEscalation2h: false };
        }
        return { shouldSend: true, reason: 'first_alert', isRecovery: false, isEscalation30m: false, isEscalation2h: false };
    }

    // Recovery: was non-HEALTHY, now HEALTHY
    if (currentStatus === 'HEALTHY' && state.lastStatus !== 'HEALTHY') {
        return { shouldSend: true, reason: 'recovery', isRecovery: true, isEscalation30m: false, isEscalation2h: false };
    }

    // Currently HEALTHY and was HEALTHY → no alert needed
    if (currentStatus === 'HEALTHY') {
        return { shouldSend: false, reason: 'still_healthy', isRecovery: false, isEscalation30m: false, isEscalation2h: false };
    }

    // Non-HEALTHY: check dedup
    if (fingerprint === state.lastFingerprint && (now - state.lastSentAt) < ttlMs) {
        // Within TTL — but check for escalation
        const timeSinceFirst = now - state.lastSentAt;

        // 2h escalation check
        const enable2h = process.env.ALERT_ESCALATE_2H !== 'false';
        if (enable2h && timeSinceFirst >= 2 * 60 * 60_000 && !state.escalation2hSentAt) {
            return { shouldSend: true, reason: 'escalation_2h', isRecovery: false, isEscalation30m: false, isEscalation2h: true };
        }

        // 30m escalation check
        const enable30m = process.env.ALERT_ESCALATE_30M !== 'false';
        if (enable30m && timeSinceFirst >= 30 * 60_000 && !state.escalation30mSentAt) {
            return { shouldSend: true, reason: 'escalation_30m', isRecovery: false, isEscalation30m: true, isEscalation2h: false };
        }

        return { shouldSend: false, reason: 'dedup_suppressed', isRecovery: false, isEscalation30m: false, isEscalation2h: false };
    }

    // Fingerprint changed or TTL expired → send
    return { shouldSend: true, reason: 'new_or_expired', isRecovery: false, isEscalation30m: false, isEscalation2h: false };
}
