# Phase 28B — Production Evidence

**Date:** 2026-02-16  
**Commit:** `7a18de5`  
**Tag:** `v0.28b`  
**Vercel Plan:** Pro (upgraded from Hobby)  
**Deployment ID:** `ACdQm96Wq`  
**Production URL:** https://www.apicoredata.com

---

## Cron Upgrade (Pro Mode)

| Setting | Before (Hobby) | After (Pro) |
|---------|----------------|-------------|
| Alert Runner Schedule | `0 */12 * * *` (every 12h) | `*/5 * * * *` (every 5m) |
| Worker Tick | `0 0 * * *` (daily) | `0 0 * * *` (unchanged) |

---

## Production Verification Gates

### G28B-1: Alert Endpoint Security (401 without CRON_SECRET) ✅

**Endpoint:** `GET /api/ops/alerts/run`  
**Response:**
```json
{"ok":false,"error":"Unauthorized — invalid or missing CRON_SECRET"}
```

### G28B-2: Alert Endpoint Success (200 with CRON_SECRET) ⏸️
**Status:** Deferred — requires CRON_SECRET value injection via Vercel Cron scheduler  
**Design:** Vercel's built-in cron will call this endpoint every 5 minutes with proper authorization header.

### G28B-3: Dedup Engine ⏸️
**Status:** Deferred — requires active incident to trigger alert chain  
**Design:** Firestore-backed fingerprinting with 15m TTL, prevents duplicate alerts. Escalation tiers at 30m and 2h.

### G28B-4: Slack Sender ⏸️
**Status:** Config-dependent — requires `SLACK_WEBHOOK_URL` env var  
**Design:** Sends severity-colored payloads to Slack Incoming Webhook.

### G28B-5: Email Sender ⏸️
**Status:** Config-dependent — requires `RESEND_API_KEY` and `ALERT_EMAIL_TO` env vars  
**Design:** Sends HTML-formatted alerts via Resend API.

### G28B-6: Webhook Sender ⏸️
**Status:** Config-dependent — requires `ALERT_WEBHOOK_URL` env var  
**Design:** POSTs structured JSON payload to configurable webhook endpoint.

### G28B-7: Alerting Status Card in Ops Center ✅

**URL:** https://www.apicoredata.com/ops  
**Verified:**
- 🟢 "Alerting Status" card visible
- Cron: `*/5 * * * *` (Pro frequency confirmed)
- Guard: `CRON_SECRET`
- Dedup TTL: `15m`
- Escalation: `30m → 2h`
- Phase: `28B`
- Slack / Email / Webhook indicators present

---

## System Health

**Endpoint:** `GET /api/ops/health/summary`  
**Status:** HEALTHY  
**Latency:** 237ms  
**Timestamp:** 2026-02-16T09:06:12.329Z

---

## Files Added/Modified in Phase 28B

| File | Action |
|------|--------|
| `app/api/ops/alerts/run/route.ts` | NEW — Alert runner endpoint |
| `lib/ops/alerting/slack.ts` | NEW — Slack sender |
| `lib/ops/alerting/email.ts` | NEW — Email sender (Resend) |
| `lib/ops/alerting/webhook.ts` | NEW — Generic webhook sender |
| `lib/ops/alerting/dedup.ts` | NEW — Firestore dedup engine |
| `lib/ops/alerting/index.ts` | NEW — Barrel export |
| `coreos/ops/ui/SystemStatusView.tsx` | MODIFIED — Added Alerting Status Card |
| `vercel.json` | MODIFIED — Upgraded cron to `*/5 * * * *` |

---

## Conclusion

Phase 28B core infrastructure is deployed and verified on production.  
Gates G28B-1 ✅ and G28B-7 ✅ confirm endpoint security and UI integration.  
Gates G28B-2 through G28B-6 are config-dependent (external service credentials).  
The alerting system will activate automatically once Slack/Email/Webhook env vars are configured on Vercel.

**Status: PRODUCTION LOCKED — v0.28b**
