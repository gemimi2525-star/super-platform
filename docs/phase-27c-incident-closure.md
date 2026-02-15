# Phase 27C — Incident Closure Report

> **Incident:** `WORKER_HEARTBEAT_LOST` → System: DEGRADED  
> **Status:** ✅ RESOLVED  
> **Resolution SHA:** `f5dc967`  
> **Date:** 2026-02-15

---

## Root Cause

Two independent issues combined to produce a false `DEGRADED` system status:

### 1. Stale Firestore Counters (Primary)
Old `worker_heartbeat_total` counters from previous Go-worker runs remained in Firestore. The threshold engine counted these counters and detected zero active workers → triggered `WORKER_HEARTBEAT_LOST`.

**Why it happened:** The threshold engine assumed "counters exist = workers should exist." On a serverless platform (Vercel), no persistent workers run — counters from past runs are inherently stale.

### 2. Git Remote URL Mismatch (Deployment Blocker)
GitHub silently renamed the repository from `Super-Platform` (uppercase) to `super-platform` (lowercase). The local git remote URL was not updated, so pushes appeared to succeed but did not trigger Vercel's Git Integration webhook.

**Why it happened:** GitHub repo renames are transparent to git push but break webhook URL matching.

---

## Fix Applied

| Component | Change | File |
|-----------|--------|------|
| **Cron Heartbeat** | New `/api/worker/tick` sends periodic `system-cron` heartbeat | `app/api/worker/tick/route.ts` |
| **Age-Aware Check** | `getFreshHeartbeatCount()` counts only counters updated within 2× threshold window | `coreos/ops/metrics.ts` |
| **Threshold Logic** | Skip DEGRADED when `freshHeartbeatCount === 0` (no workers expected) | `coreos/ops/threshold-engine.ts` |
| **Summary Route** | Parallel fetch + pass freshHeartbeatCount | `app/api/ops/metrics/summary/route.ts` |
| **Cron Config** | `0 0 * * *` in vercel.json (Hobby plan = daily min) | `vercel.json` |
| **Git Remote** | Fixed to lowercase `super-platform.git` | local `.git/config` |

---

## Prevention

| What | How |
|------|-----|
| **False positives from stale counters** | Age-aware check ignores counters older than 2× threshold window |
| **Serverless heartbeat gap** | Vercel Cron sends daily heartbeat as insurance |
| **Deployment failures from repo renames** | Document: always verify `git remote -v` matches Vercel Git Integration URL |
| **Unauthorized cron trigger** | `CRON_SECRET` Bearer token guard on `/api/worker/tick` |
| **Diagnostic endpoint exposure** | Auth guard (admin/owner) on `/api/ops/diag/firestore` |

---

## What to Monitor

| Metric / Endpoint | Threshold | Action |
|-------------------|-----------|--------|
| `GET /api/ops/diag/firestore` | `ok:false` | Check Firestore quota/permissions — may need Blaze plan limits review |
| `GET /api/platform/users` | 5xx for > 2 minutes | Check Firestore + cache layer — PERSISTENT_STALE should absorb transient failures |
| `GET /api/ops/metrics/summary` → `systemStatus` | `!= HEALTHY` for > 3 minutes | Check threshold violations — likely a real issue if heartbeat is fresh |
| Vercel Cron logs | `/api/worker/tick` fails | Check CRON_SECRET env var or Firestore connectivity |
| `X-Cache` header pattern | Stuck on `MISS` (never HIT) | Cache not warming — check TTL config or first-request pattern |

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| ~16:00 | Noticed Ops Center showing DEGRADED |
| 16:15 | Root cause identified: stale heartbeat counters |
| 16:18 | Code fix pushed (SHA 4207a7c) — stuck on deploy |
| 16:19 | Discovered git remote URL mismatch |
| 16:20 | Fixed remote URL, pushed real commit (SHA f5dc967) |
| 16:21 | Vercel auto-deploy triggered, build succeeded |
| 16:21 | `/api/worker/tick` verified: `ok:true` |
| 16:22 | Ops Center: **System: HEALTHY** confirmed |
| 16:30 | Full 6-gate verification passed |
