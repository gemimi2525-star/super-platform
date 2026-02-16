/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Alerting — Barrel Export (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { sendSlack, type SlackAlertPayload } from './slack';
export { sendEmail, type EmailAlertPayload } from './email';
export { postWebhook, type WebhookAlertPayload } from './webhook';
export {
    computeFingerprint,
    evaluateDedup,
    getAlertState,
    updateAlertState,
    type AlertState,
    type DedupDecision,
} from './dedup';
