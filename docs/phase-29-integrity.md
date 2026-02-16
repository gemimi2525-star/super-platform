# Phase 29 — Firebase Integrity Layer

## Purpose

**Integrity ≠ Uptime.** Uptime checks verify that an endpoint responds, but integrity checks verify that the underlying systems are connected, authenticated, and in their expected state.

`GET /api/platform/integrity` answers: *"Is the platform's foundation sound right now?"*

---

## Endpoint

```
GET /api/platform/integrity
```

**Always returns HTTP 200** with a JSON body containing `status: "OK"` or `status: "DEGRADED"`.
No redirects, no HTML, no PII, no stack traces.

Header: `Cache-Control: no-store`

---

## Example Response

```json
{
  "status": "OK",
  "checks": {
    "firebase": { "ok": true, "latencyMs": 85, "mode": "firestore" },
    "auth": { "mode": "REAL", "ok": true },
    "governance": { "kernelFrozen": "unknown", "hashValid": "unknown", "ok": false },
    "build": { "sha": "eac2496", "lockedTag": "v0.29", "ok": true }
  },
  "errorCodes": ["GOVERNANCE_UNKNOWN"],
  "ts": "2026-02-16T08:00:00.000Z",
  "phase": "29",
  "version": "v0.29"
}
```

---

## Checks

| Check | What It Validates | ok=true When |
|-------|-------------------|--------------|
| **firebase** | Firestore connectivity (read + write `ops/integrity-probe`) | Read + write succeed |
| **auth** | Authentication mode is REAL (not mock/bypass) | Mode is `REAL` |
| **governance** | SYNAPSE kernel frozen + hash chain valid | Both `true` (currently `unknown`) |
| **build** | Build commit SHA is present | SHA is non-empty string |

---

## Error Codes

| Code | Meaning |
|------|---------|
| `FIREBASE_UNREACHABLE` | Firestore read/write timed out or errored |
| `FIREBASE_PERMISSION_DENIED` | Firestore security rules blocked the probe |
| `AUTH_NOT_REAL` | Auth is in MOCK/DEV_BYPASS mode (not production-safe) |
| `AUTH_MODE_UNKNOWN` | Cannot determine auth mode |
| `GOVERNANCE_UNKNOWN` | SYNAPSE helpers not yet wired |
| `BUILD_SHA_MISSING` | `VERCEL_GIT_COMMIT_SHA` not available |
| `BUILD_TAG_MISSING` | Locked release tag not found |
| `INTERNAL_ERROR` | Unhandled error (safe fallback) |

---

## Monitoring with UptimeRobot

### Free Plan (HTTP 200 Check)
1. Add HTTP(s) monitor for `https://www.apicoredata.com/api/platform/integrity`
2. Check interval: 5 minutes
3. Alert on non-200 response

### Pro Plan (Keyword/JSON Check)
1. Monitor for keyword `"status":"OK"` in response body
2. Alert when keyword is **missing** (means DEGRADED or error)

---

## Smoke Test

```bash
# Production
./scripts/smoke-integrity.sh

# Custom URL
BASE_URL=http://localhost:3000 ./scripts/smoke-integrity.sh
```

---

## Future Enhancements
- Wire SYNAPSE governance helpers when kernel freeze/hash chain modules are available
- Add JSON-body monitoring when paid monitoring tools are provisioned
- Integrate with Ops Center dashboard as a persistent integrity indicator
