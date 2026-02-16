# Changelog

All notable changes to the APICOREDATA Platform will be documented in this file.

## [Phase 29 — v0.29] — 2026-02-16

### Added
- **Firebase Integrity API** — `GET /api/platform/integrity` (JSON-only, no PII, safe Firestore probe)
- **Integrity Helper** — `lib/ops/integrity/getIntegrity.ts` with 4 checks (firebase, auth, governance, build)
- **Smoke Script** — `scripts/smoke-integrity.sh` for schema validation
- **Phase 29 Docs** — `docs/phase-29-integrity.md` (uptime vs integrity, error codes, UptimeRobot guide)

### Production
- Commit: `1d62ed1` (integrity code via `57fa1b3`)
- Tag: `v0.29`
- Gates: G29-1→5 ✅ (DEGRADED expected — governance unknown, build SHA server-only)
- Evidence: `docs/phase-29-evidence.md`

## [Phase 28B — v0.28b] — 2026-02-16

### Added
- **Automated Alert Runner** — `GET /api/ops/alerts/run` (CRON_SECRET guarded, 5-min Pro cron)
- **Alert Senders** — Slack, Email (Resend), Webhook modules (`lib/ops/alerting/`)
- **Dedup Engine** — Firestore-backed fingerprinting, 15m TTL, 30m/2h escalation tiers
- **Alerting Status Card** — Ops Center UI shows cron, guard, dedup, and escalation config

### Changed
- **Vercel Pro Upgrade** — Cron schedule upgraded from `0 */12 * * *` to `*/5 * * * *`

### Production
- Commit: `7a18de5`
- Tag: `v0.28b`
- Gates: G28B-1 ✅ G28B-7 ✅ (G28B-2→6 config-dependent)

## [Phase 28A — v0.28a] — 2026-02-16

### Added
- **Public Health Summary** — `GET /api/ops/health/summary` (read-only, single Firestore read, <300ms)
- **Incident Card** — Ops Center UI shows cause analysis, next actions, and Copy Report button when DEGRADED
- **Monitoring Runbook** — `docs/phase-28-monitoring.md` with threshold table, 3-endpoint check, CRON_SECRET guide

### Production
- Commit: `dc433a8`
- Tag: `v0.28a`
- 5 verification gates PASS

## [Phase 27C — v0.27c-hotfix] — 2026-02-15

### Fixed
- **WORKER_HEARTBEAT_LOST false positive** — stale Firestore counters from old workers caused Ops Center to show DEGRADED
- **Git remote URL mismatch** — uppercase `Super-Platform` vs lowercase `super-platform` broke Vercel deploy webhook

### Added
- `/api/worker/tick` — Vercel Cron heartbeat endpoint (`system-cron` worker)
- `getFreshHeartbeatCount()` — age-aware counter check (ignores stale counters > 2× threshold)
- Vercel Cron config — daily heartbeat insurance (`0 0 * * *`, Hobby plan)
- Evidence docs: `docs/phase-27c-evidence.md`, `docs/phase-27c-incident-closure.md`

### Security
- `/api/worker/tick` — `CRON_SECRET` Bearer token guard
- `/api/ops/diag/firestore` — auth guard (admin/owner only via `getAuthContext`)

### Production
- Commit: `f5dc967`
- Tag: `v0.27c-hotfix`

## [Phase 21A] — 2026-02-12

### Fixed
- **Immutable Audit Chain** — `undo()` no longer mutates original audit entries
- `verifyAuditChain()` now returns `valid: true` after execute + undo sequences
- New `ROLLBACK` entry type appended instead of mutating `EXECUTION` entries
- Double-undo detected via ROLLBACK entry lookup (not mutation check)
- Legacy tolerance: v1 entries skipped during hash verification

### Added
- `entryType`, `referencesEntryId`, `auditVersion` fields on `ExecutionAuditEntry`
- Semantic validation in `verifyAuditChain()` (ROLLBACK must reference valid EXECUTION)
- 6 vitest tests for chain integrity (`coreos/brain/execution.test.ts`)

## [Phase 20] — 2026-02-12

### Added
- **Agent Execution Engine** — gated execution pipeline with Ed25519 signed approvals
- `/api/brain/execute` — protected execute endpoint (kill-switch ON by default)
- `coreos/brain/execution.ts` — ExecutionEngine with validate, execute, undo, audit
- `coreos/brain/snapshot.ts` — Snapshot/rollback system for safe undo operations
- Nonce replay protection — each approval nonce is single-use
- Rate limiting — max 10 executions per minute
- Audit chain — SHA-256 linked hash chain for execution history
- Kill switch — `BRAIN_AGENT_KILL` env var blocks all execution when `true`

### Security
- Production default: `BRAIN_AGENT_KILL=true` (execution disabled)
- Scope restriction: Phase 20 allows only `core.notes`
- All execution requires cryptographic Ed25519 signature verification

### Production
- Commit: `af8e1a5`
- Deployment: `3YSjjrpxB`
- Tag: `phase20-prod`
