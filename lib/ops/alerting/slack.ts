/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Alerting — Slack Webhook Sender (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sends alert notifications to Slack via Incoming Webhook.
 * No sensitive data is included in the payload.
 *
 * Env: ALERT_SLACK_WEBHOOK_URL
 */

export interface SlackAlertPayload {
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

const SEVERITY_COLORS: Record<string, string> = {
    warn: '#f59e0b',      // amber
    critical: '#ef4444',   // red
    recovery: '#22c55e',   // green
};

const SEVERITY_EMOJI: Record<string, string> = {
    warn: '⚠️',
    critical: '🚨',
    recovery: '✅',
};

/**
 * Send an alert to Slack via Incoming Webhook.
 * Returns true if sent successfully, false if not configured or failed.
 */
export async function sendSlack(payload: SlackAlertPayload): Promise<boolean> {
    const webhookUrl = process.env.ALERT_SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[Alert/Slack] ALERT_SLACK_WEBHOOK_URL not configured — skipping');
        return false;
    }

    const emoji = SEVERITY_EMOJI[payload.severity] ?? '📢';
    const color = SEVERITY_COLORS[payload.severity] ?? '#64748b';

    const blocks = {
        text: `${emoji} APICOREDATA Alert: ${payload.systemStatus}`,
        attachments: [
            {
                color,
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: [
                                `*${emoji} System Status: ${payload.systemStatus}*`,
                                payload.message ?? '',
                                '',
                                `*Severity:* ${payload.severity}`,
                                `*Violations:* ${payload.violationsCount} (${payload.violationCodes.join(', ') || 'none'})`,
                                `*Phase:* ${payload.phase}`,
                                `*Trace:* \`${payload.traceId}\``,
                                payload.latencyMs ? `*Latency:* ${payload.latencyMs}ms` : '',
                                `*Time:* ${payload.ts}`,
                            ].filter(Boolean).join('\n'),
                        },
                    },
                ],
            },
        ],
    };

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blocks),
        });

        if (!res.ok) {
            console.warn(`[Alert/Slack] Webhook returned ${res.status}`);
            return false;
        }

        console.log(`[Alert/Slack] ✅ Sent ${payload.severity} alert (trace: ${payload.traceId})`);
        return true;
    } catch (err: any) {
        console.error(`[Alert/Slack] Failed:`, err.message);
        return false;
    }
}
