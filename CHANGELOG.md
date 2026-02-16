# Changelog

All notable changes to the APICOREDATA Platform will be documented in this file.

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
