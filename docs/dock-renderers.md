# Dock Renderers — Inventory & Anti-Duplicate Rules

> **Phase 39D Hardening** — Single Source of Truth Documentation

## Dock Renderer Components

| Component | File | Hook Used | Status |
|-----------|------|-----------|--------|
| `DockBar` | `components/os-shell/DockBar.tsx` | `useDockCapabilities()` from `@/governance/synapse` | **ACTIVE** — mounted in `/os` route |
| `Dock()` | `coreos/desktop-ui.tsx` (line 688) | `useDockCapabilities()` from `./react` | **UNUSED** — `CoreOSDesktop` is never imported/mounted |

## Mount Hierarchy

```
app/os/page.tsx
  └─ OSShell (components/os-shell/OSShell.tsx)
       ├─ TopBar
       ├─ CalmDesktop
       ├─ WindowChrome (per window)
       ├─ DockBar ← THE SINGLE ACTIVE DOCK ✅
       ├─ StepUpModal
       └─ SystemLogPanel
```

## `useDockCapabilities()` Hook Implementations

| Location | Import Source | Has Hub-Shortcut Filter? |
|----------|-------------|------------------------|
| `governance/synapse/hooks.tsx` (line 250) | `./synapse-adapter` → `coreos/index` | ✅ `HUB_SHORTCUT_IDS` filter |
| `coreos/react.tsx` (line 216) | `./index` (coreos) | ❌ No filter (legacy) |

**Re-export chain**: `@/governance/synapse` → `governance/synapse/index.ts` → `governance/synapse/hooks.tsx` (filtered version)

## Data Flow

```
coreos/manifests/*.ts (showInDock: false)
  → CoreOSCapabilityGraph.getDockCapabilities() filters by showInDock
    → useDockCapabilities() hook adds HUB_SHORTCUT_IDS filter
      → DockBar.tsx adds HUB_SHORTCUT_CAPABILITIES filter
        → visibleCapabilities.map() renders 4 icons
```

## Anti-Duplicate Rules

> [!CAUTION]
> **RULE**: Only ONE dock container may be mounted in the global shell at any time.

1. `/os` route MUST use `OSShell` → `DockBar` — no other dock component
2. `CoreOSDesktop` (`coreos/desktop-ui.tsx`) exists as legacy reference only — MUST NOT be imported or mounted
3. Any new dock implementation MUST use `useDockCapabilities()` from `@/governance/synapse` (not from `coreos/react`)
4. The `HUB_SHORTCUT_IDS` filter MUST remain in the hook — do not remove without updating all dock consumers

## Canonical Dock Icons (Phase 39D)

| Icon | Capability ID | Title |
|------|--------------|-------|
| 🎛️ | `ops.center` | Ops Center |
| 🧠 | `brain.assist` | Brain |
| 📝 | `core.notes` | Notes |
| 🖥️ | `system.hub` | System Hub |

## Hidden Capabilities (accessible via System Hub tabs)

| Capability ID | Reason Hidden |
|--------------|---------------|
| `core.settings` | System Hub → General tab |
| `user.manage` | System Hub → Users tab |
| `org.manage` | System Hub → Organization tab |
| `audit.view` | System Hub → Audit tab |
| `system.configure` | System Hub → Configuration tab |
