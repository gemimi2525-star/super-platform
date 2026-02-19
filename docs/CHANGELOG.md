# Changelog

All notable changes to APICOREDATA Platform.

---

## [v0.40.0] — 2026-02-19

**Parity Baseline** — Phase 39F + 40A.3 + 40A.4
SHA: `b616941` | Tag: `v0.40.0`

### 🔧 Dev Experience
- **Phase 40A.3**: Fix `dev-worker.sh` default port from 3001 → 3000
- **Phase 40A.4**: Full 4-layer parity sync (Local/GitHub/Vercel/Production)
- **Housekeeping**: All 9 smoke scripts defaulting to port 3000

### 🖥️ Window/Shell + State Migration
- **Phase 39–39F**: State migration, canonical surface dedup, dock canonicalization, Ops Center naming
- **Phase 38**: Registry/Dock dedup + ghost cleanup

### 📁 VFS (Virtual Filesystem)
- **Phase 37B–37C**: VFS duplicate remediation + deterministic auto-remediation engine
- **Phase 36**: Offline kernel layer + Service Worker deterministic cache

### ⚖️ Kernel/Governance
- **Phase 35A–35D**: Ops access policy, runtime policy engine, tool firewall, autonomous governance enforcement
- **Phase 33A**: Controlled fail injection + enforcement gate (safe prod fallback)
- **Phase 32.5**: Wire SYNAPSE governance into integrity check + CORE_FREEZE.md in bundle

### 📊 Ops Center / Audit / Integrity
- **Phase 34–34.4**: Integrity Transparency Layer, Ledger endpoint, replay protection, ledger drilldown
- **Phase 32–32.1**: Audit Taxonomy (46 events, 9 groups) + Trace Correlation + Role-Based Redaction
- **Phase 31.8**: Guard dev-mode + audit bypass + ops visibility

---

## [v0.32.5] — 2026-02-13

**Governance Wiring Baseline**
- Phase 32.5 regression gates
- SYNAPSE governance wired into integrity check

## [v0.32.4] — 2026-02-12

- Version bump for governance wiring

## [v0.32.3] — 2026-02-12

- ENV safeguard + descriptive errorCode parity

## [v0.32.2] — 2026-02-11

- Self-report parity — version, lockedTag, phase from package.json

## [v0.32.1] — 2026-02-11

- Audit traceId search hardening — no 500 guarantee

## [v0.32.0] — 2026-02-10

- Phase 32.4: severity/actor/event filters as post-query (avoid composite index)

## [v0.31.0] — 2026-02-09

- Phase 31.8: Guard dev-mode + audit bypass + ops visibility

## [v0.30] — 2026-02-08

- Phase 30: Signed Integrity — HMAC SHA-256 enterprise hardening

## [v0.29] — 2026-02-08

- Phase 29: Firebase Integrity Layer

## [v0.28b] — 2026-02-07

- Phase 28B: Automated alerting & escalation
