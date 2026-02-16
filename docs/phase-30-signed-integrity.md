# Phase 30 — Signed Integrity (Enterprise Hardening)

## Overview

Phase 30 adds **HMAC SHA-256 signatures** to the integrity endpoint response, enabling external consumers to verify that the payload has not been tampered with in transit.

This builds on Phase 29's integrity endpoint (`/api/platform/integrity`) without breaking changes — the only addition is a new `signature` field.

## Signature Algorithm

| Property | Value |
|----------|-------|
| Algorithm | HMAC SHA-256 |
| Secret | `INTEGRITY_HMAC_SECRET` (server-only env var) |
| Canonical Form | JSON with sorted keys (deterministic) |
| Output | 64-character hex string |
| Unsigned Mode | Returns `"unsigned"` when secret is not set |

### How Signing Works

1. The integrity helper produces the full response payload
2. The `signature` field is excluded from the signing input
3. The payload is serialized to **canonical JSON** (all keys sorted recursively)
4. An HMAC SHA-256 digest is computed using `INTEGRITY_HMAC_SECRET`
5. The hex-encoded signature is appended to the response as `signature`

### Canonical JSON Example

Given this payload:
```json
{"status":"DEGRADED","checks":{"firebase":{"ok":true}}}
```

The canonical form sorts keys at every level:
```json
{"checks":{"firebase":{"ok":true}},"status":"DEGRADED"}
```

## Environment Variables

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `INTEGRITY_HMAC_SECRET` | Recommended | Server-only | HMAC signing key. Must be a strong, random secret (32+ chars). |

When `INTEGRITY_HMAC_SECRET` is not set, the endpoint returns `"signature": "unsigned"` — the endpoint remains functional but unsigned.

## Response Schema (Updated)

```json
{
  "status": "OK | DEGRADED",
  "checks": {
    "firebase": { "ok": true, "latencyMs": 123, "mode": "firestore" },
    "auth": { "mode": "REAL", "ok": true },
    "governance": { "kernelFrozen": "unknown", "hashValid": "unknown", "ok": false },
    "build": { "sha": "abc1234", "lockedTag": "v0.30", "ok": true }
  },
  "errorCodes": [],
  "ts": "2026-02-16T10:00:00.000Z",
  "phase": "30",
  "version": "v0.30",
  "signature": "a1b2c3d4e5f6..."
}
```

## Error Codes

All Phase 29 error codes remain unchanged:

| Code | Meaning |
|------|---------|
| `FIREBASE_UNREACHABLE` | Firestore read/write failed |
| `FIREBASE_PERMISSION_DENIED` | Firestore permission error |
| `AUTH_NOT_REAL` | Dev bypass mode active |
| `AUTH_MODE_UNKNOWN` | Cannot determine auth mode |
| `GOVERNANCE_UNKNOWN` | SYNAPSE helpers not available |
| `BUILD_SHA_MISSING` | No commit SHA available |
| `INTERNAL_ERROR` | Unhandled error (catch-all) |

## Verification Script

```bash
# Verify signature (requires secret + jq + openssl)
INTEGRITY_HMAC_SECRET=<secret> ./scripts/verify-integrity.sh

# Verify against a custom URL
INTEGRITY_HMAC_SECRET=<secret> ./scripts/verify-integrity.sh http://localhost:3000/api/platform/integrity
```

The script:
1. Fetches the endpoint
2. Extracts and removes the `signature` field
3. Recomputes HMAC SHA-256 on the canonical payload
4. Compares signatures
5. Runs a tamper detection test

## Production Gates

| Gate | Description |
|------|-------------|
| G30-1 | `signature` field present in response |
| G30-2 | Signature verifies correctly with the secret |
| G30-3 | Tampered payload produces different signature |
| G30-4 | No secret leak in response body |
| G30-5 | Latency < 700ms |
