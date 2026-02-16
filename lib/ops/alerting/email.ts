/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Alerting — Email Sender via Resend (Phase 28B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Minimal email sender using Resend API (no SDK dependency).
 * Falls back gracefully if not configured.
 *
 * Env: RESEND_API_KEY, ALERT_EMAIL_TO, ALERT_EMAIL_FROM
 */

export interface EmailAlertPayload {
    severity: 'warn' | 'critical' | 'recovery';
    systemStatus: string;
    violationsCount: number;
    violationCodes: string[];
    traceId: string;
    phase: string;
    ts: string;
    message?: string;
}

const SEVERITY_SUBJECT: Record<string, string> = {
    warn: '⚠️ DEGRADED',
    critical: '🚨 CRITICAL',
    recovery: '✅ RECOVERED',
};

/**
 * Send an alert email via Resend API.
 * No SDK dependency — uses raw fetch to POST to Resend.
 * Returns true if sent successfully, false if not configured or failed.
 */
export async function sendEmail(payload: EmailAlertPayload): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ALERT_EMAIL_TO;
    const from = process.env.ALERT_EMAIL_FROM ?? 'APICOREDATA Ops <ops@apicoredata.com>';

    if (!apiKey || !to) {
        console.log('[Alert/Email] RESEND_API_KEY or ALERT_EMAIL_TO not configured — skipping');
        return false;
    }

    const subjectPrefix = SEVERITY_SUBJECT[payload.severity] ?? '📢 ALERT';
    const subject = `${subjectPrefix} — APICOREDATA (${payload.phase})`;

    const html = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${payload.severity === 'recovery' ? '#22c55e' : payload.severity === 'critical' ? '#ef4444' : '#f59e0b'};">
                ${subjectPrefix} — System Status: ${payload.systemStatus}
            </h2>
            ${payload.message ? `<p>${payload.message}</p>` : ''}
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
                <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Severity</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${payload.severity}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Violations</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${payload.violationsCount} (${payload.violationCodes.join(', ') || 'none'})</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Phase</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${payload.phase}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Trace ID</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${payload.traceId}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Time</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${payload.ts}</td></tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8;">Automated alert from APICOREDATA Ops — Phase ${payload.phase}</p>
        </div>
    `;

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: to.split(',').map(e => e.trim()),
                subject,
                html,
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.warn(`[Alert/Email] Resend returned ${res.status}: ${body}`);
            return false;
        }

        console.log(`[Alert/Email] ✅ Sent ${payload.severity} alert to ${to} (trace: ${payload.traceId})`);
        return true;
    } catch (err: any) {
        console.error(`[Alert/Email] Failed:`, err.message);
        return false;
    }
}
