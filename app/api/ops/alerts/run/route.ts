/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/alerts/run (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cron-triggered alert runner. Evaluates system health, applies dedup,
 * and dispatches to configured channels (Slack, Email, Webhook).
 *
 * Guard: CRON_SECRET (same pattern as /api/worker/tick)
 *
 * Flow:
 *   1. Auth guard → 401 if not authorized
 *   2. getHealthSummary() → single Firestore read
 *   3. evaluateDedup() → check if alert should be sent
 *   4. Dispatch to configured channels
 *   5. Update dedup state
 *   6. Return summary JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHealthSummary } from '@/coreos/ops/metrics';
import {
    evaluateDedup,
    updateAlertState,
    computeFingerprint,
    sendSlack,
    sendEmail,
    postWebhook,
} from '@/lib/ops/alerting';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH GUARD
// ═══════════════════════════════════════════════════════════════════════════

function isCronAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true; // No secret set → open (dev/staging)
    const authHeader = request.headers.get('authorization') ?? '';
    return authHeader === `Bearer ${secret}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

function mapSeverity(status: string, isRecovery: boolean): 'warn' | 'critical' | 'recovery' {
    if (isRecovery) return 'recovery';
    if (status === 'DEGRADED') return 'warn';
    if (status === 'DOWN' || status === 'FAILED') return 'critical';
    return 'warn';
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    // ── Auth Guard ──
    if (!isCronAuthorized(request)) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
            { status: 401 },
        );
    }

    const t0 = Date.now();

    try {
        // 1. Get health summary (single Firestore read)
        const health = await getHealthSummary();
        const now = new Date();
        const traceId = crypto.randomUUID().slice(0, 8);

        // 2. Derive violation codes
        // getHealthSummary returns violationsCount but not the codes directly.
        // We derive from the status to maintain the dedup fingerprint.
        const violationCodes: string[] = [];
        if (health.systemStatus !== 'HEALTHY') {
            // Infer from what getHealthSummary evaluated
            if (health.violationsCount > 0) {
                violationCodes.push(`VIOLATIONS_${health.violationsCount}`);
            }
            violationCodes.push(health.systemStatus);
        }

        // 3. Evaluate dedup
        const dedup = await evaluateDedup(health.systemStatus, violationCodes);

        if (!dedup.shouldSend) {
            return NextResponse.json({
                ok: true,
                sent: [],
                reason: dedup.reason,
                systemStatus: health.systemStatus,
                traceId,
                latencyMs: Date.now() - t0,
                ts: now.toISOString(),
            }, { status: 200 });
        }

        // 4. Build alert payload
        const severity = mapSeverity(health.systemStatus, dedup.isRecovery);

        let message = '';
        if (dedup.isRecovery) {
            message = '✅ System has recovered to HEALTHY status.';
        } else if (dedup.isEscalation30m) {
            message = '⏰ ESCALATION: System has been non-HEALTHY for 30+ minutes.';
        } else if (dedup.isEscalation2h) {
            message = '🚨 CRITICAL ESCALATION: System has been non-HEALTHY for 2+ hours.';
        } else {
            message = `System status changed to ${health.systemStatus}.`;
        }

        const alertPayload = {
            severity,
            systemStatus: health.systemStatus,
            violationsCount: health.violationsCount,
            violationCodes,
            traceId,
            phase: '28B',
            latencyMs: Date.now() - t0,
            ts: now.toISOString(),
            message,
        };

        // 5. Dispatch to all configured channels
        const results: string[] = [];

        // Always try Slack
        const slackOk = await sendSlack(alertPayload);
        if (slackOk) results.push('slack');

        // Email for all alerts (or only escalation if desired)
        const emailOk = await sendEmail(alertPayload);
        if (emailOk) results.push('email');

        // Webhook for critical and escalations
        if (severity === 'critical' || dedup.isEscalation30m || dedup.isEscalation2h || dedup.isRecovery) {
            const webhookOk = await postWebhook(alertPayload);
            if (webhookOk) results.push('webhook');
        }

        // 6. Update dedup state
        const fingerprint = computeFingerprint(health.systemStatus, violationCodes);
        const stateUpdate: Record<string, unknown> = {
            lastFingerprint: fingerprint,
            lastSentAt: Date.now(),
            lastStatus: health.systemStatus,
            lastViolationHash: violationCodes.join(','),
        };

        if (dedup.isRecovery) {
            stateUpdate.recoverySentAt = Date.now();
            stateUpdate.escalation30mSentAt = null;
            stateUpdate.escalation2hSentAt = null;
        }
        if (dedup.isEscalation30m) {
            stateUpdate.escalation30mSentAt = Date.now();
        }
        if (dedup.isEscalation2h) {
            stateUpdate.escalation2hSentAt = Date.now();
        }

        await updateAlertState(stateUpdate);

        return NextResponse.json({
            ok: true,
            sent: results,
            reason: dedup.reason,
            severity,
            systemStatus: health.systemStatus,
            traceId,
            latencyMs: Date.now() - t0,
            ts: now.toISOString(),
        }, { status: 200 });

    } catch (error: any) {
        console.error('[API/ops/alerts/run] Error:', error.message);
        return NextResponse.json(
            { ok: false, error: 'Alert runner failed', ts: new Date().toISOString() },
            { status: 500 },
        );
    }
}
