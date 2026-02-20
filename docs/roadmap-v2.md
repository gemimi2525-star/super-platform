# Roadmap v2.0 — APICOREDATA Platform

> **Canonical Roadmap** — reflects production reality at baseline `v0.44.2` @ `3e48b6d`
> Last updated: 2026-02-20

---

## System Overview

| Metric | Value |
|:---|:---|
| **Production SHA** | `3e48b6d` |
| **Baseline Tag** | `v0.44.2` |
| **Kernel** | ❄️ Frozen |
| **Governance** | Lock-in active (hashValid, kernelFrozen) |
| **Architecture** | Next.js 16 + Zustand + Firebase + Vercel |

---

## A) Frozen / Stable Foundation ✅ DONE

> These phases are **frozen in production** and must not regress.
> Any modification requires formal governance review + re-stamp parity.

| Phase | Description | Tag/SHA | Status |
|:---|:---|:---|:---|
| Governance Kernel | SYNAPSE governance, integrity contract, hash validation | ❄️ Frozen | ✅ Locked |
| Shell + Dock (17X/17X.2) | Window manager, dock icons, menu bar, single-instance | Stable | ✅ |
| VFS (15A) | Virtual filesystem, permission matrix, scheme validation | Stable | ✅ |
| Security (15A.3) | Auth gate, RBAC escalation, enforcement gate | Stable | ✅ |
| Offline Kernel (36 + 15C) | Service worker, offline banner, DevBadge | Stable | ✅ |
| Cross-Device (15D) | Session persistence, snapshot restore | Stable | ✅ |
| Global Search (17N) | Spotlight overlay, fuzzy search | Stable | ✅ |
| Process Model (15B) | State machine, process store, SHA-256 argsHash, dock dots | `v0.44.2` / `3e48b6d` | ✅ |
| Intent System (15B.2) | Intent resolution, IPC protocol | Stable | ✅ |
| App Runtime (16) | Manifest spec, capability model, RuntimeHost, SDK bridge | Stable | ✅ |
| System Hub (27A) | Unified settings hub, tab routing | Stable | ✅ |
| Ops Center (28/29/30) | Auditing, monitoring, integrity transparency | Stable | ✅ |

**System Completeness**: ~70% of core OS kernel
**Risk**: LOW — All frozen, governance-locked, regression-protected

---

## B) Operational Hardening (Ongoing Backlog)

> Small but important improvements that harden the existing foundation.
> No new features — only strengthening what exists.

| Item | Priority | Effort | Depends On |
|:---|:---|:---|:---|
| Telemetry/Audit UX polish | Medium | S | Ops Center |
| Incident UX (error recovery flows) | Medium | M | Governance |
| Performance budgets (dock/overlay/window resize) | Medium | S | Shell |
| Build minutes optimization (skip unchanged projects) | Low | S | Vercel config |
| Test coverage expansion (process store, VFS edge cases) | Medium | M | 15B, 15A |
| Accessibility baseline (keyboard nav, screen reader labels) | High | M | Shell + Dock |

**System Completeness**: These are polish items, not blockers
**Risk**: LOW — No architectural changes, incremental improvements

---

## C) Experience Layer (Canonical Next Phases)

> New user-facing features built on top of the frozen foundation.
> Ordered by dependency chain and user impact.

### Priority Order

#### 1. 🔔 Phase 18 — Notification Center
**Why first**: Direct consumer of Process Model 15B (processes emit notifications).
Enables real-time feedback loop: process state change → notification → user awareness.

| Aspect | Detail |
|:---|:---|
| Depends on | Process Model (15B), Audit taxonomy, Governance |
| Unlocks | Real-time UX, cross-app communication awareness |
| Effort | L (2-3 sessions) |
| Spec | [`docs/phase-18-spec.md`](file:///Users/jukkritsuwannakum/APICOREDATA/docs/phase-18-spec.md) |

#### 2. 🖱️ Drag & Drop Framework
**Why second**: Enables spatial interaction patterns (file manager, window arrangement).
Foundation for dock customization, desktop icons, file drag-to-app.

| Aspect | Detail |
|:---|:---|
| Depends on | Shell (17X), VFS (15A) |
| Unlocks | Desktop icons, file operations, dock rearrangement |
| Effort | M (1-2 sessions) |

#### 3. 🖥️ Virtual Desktops (Spaces)
**Why third**: Requires mature window management + process model.
Multiple desktop workspaces with independent process scopes.

| Aspect | Detail |
|:---|:---|
| Depends on | Shell (17X), Process Model (15B), Drag & Drop |
| Unlocks | Workspace organization, multi-context workflows |
| Effort | L (2-3 sessions) |

#### 4. 🎨 Appearance Manager Completion
**Why fourth**: Theme system exists but needs completion (font selection, accent colors, wallpapers).

| Aspect | Detail |
|:---|:---|
| Depends on | System Hub (27A), Shell |
| Unlocks | User personalization, brand customization |
| Effort | M (1-2 sessions) |

#### 5. ♿ Accessibility Baseline
**Why fifth**: Foundational but can be integrated incrementally alongside other work.

| Aspect | Detail |
|:---|:---|
| Depends on | All UI components |
| Unlocks | WCAG compliance, broader user base |
| Effort | M (ongoing) |

**System Completeness**: These bring platform from ~70% → ~90% of desktop OS features
**Risk**: MEDIUM — New UI surface area, requires careful governance integration

---

## D) Developer Platform (Later)

> SDK, plugin system, and third-party extensibility.
> Built after Experience Layer stabilizes.

| Item | Priority | Effort | Depends On |
|:---|:---|:---|:---|
| Extensibility model (apps/plugins) | High | XL | App Runtime (16), Process Model (15B) |
| SDK manifests + permission review flows | High | L | Capability Model, Governance |
| Advanced search indexing / content providers | Medium | L | Global Search (17N), VFS (15A) |
| Marketplace / app catalog | Low | XL | Extensibility model |
| Developer documentation site | Medium | M | All of the above |

**System Completeness**: These bring platform from ~90% → full developer ecosystem
**Risk**: HIGH — Largest scope, requires stable Experience Layer first

---

## Decision Log

| Date | Decision | Rationale |
|:---|:---|:---|
| 2026-02-20 | Phase 18 (Notification Center) is next | Natural consumer of Process Model 15B; enables real-time feedback |
| 2026-02-20 | Roadmap v2.0 replaces ad-hoc phase numbering | Previous phase numbers were non-sequential; v2.0 reflects production truth |
| 2026-02-20 | Baseline registry (`docs/baseline.md`) created | Single source of truth for version/tag/SHA alignment |
