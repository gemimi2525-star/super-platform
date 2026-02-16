/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Alerting — Generic Webhook Sender (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Posts alert payload to a generic webhook endpoint.
 * Designed for future integrations (PagerDuty, Opsgenie, Discord, etc).
 *
 * Env: ALERT_WEBHOOK_URL
 */

export interface WebhookAlertPayload {
    severity: 'warn' | 'critical' | 'recovery';
    systemStatus: string;
    violationsCount: number;
    violationCodes: string[];
    traceId: string;
    phase: string;
    latencyMs?: number;
    ts: string;
    message?: string;
}

/**
 * Post alert payload to a generic webhook URL.
 * Returns true if sent successfully, false if not configured or failed.
 */
export async function postWebhook(payload: WebhookAlertPayload): Promise<boolean> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[Alert/Webhook] ALERT_WEBHOOK_URL not configured — skipping');
        return false;
    }

    const body = {
        source: 'apicoredata-ops',
        event: 'system_alert',
        ...payload,
    };

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.warn(`[Alert/Webhook] Webhook returned ${res.status}`);
            return false;
        }

        console.log(`[Alert/Webhook] ✅ Sent ${payload.severity} alert (trace: ${payload.traceId})`);
        return true;
    } catch (err: any) {
        console.error(`[Alert/Webhook] Failed:`, err.message);
        return false;
    }
}
