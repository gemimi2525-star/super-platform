# Manifest / UI Consistency Rules — v1.1

> *"Manifest → UI: One-way Truth Flow"*

**Status:** CANONICAL — SPECIFICATION
**Authority:** SYNAPSE Governance Framework
**Effective:** 2026-01-30
**Version:** 1.1 (Phase H Reconciliation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase H Reconciliation Note

> **windowMode vs windowDisplay (v1.1 Clarification)**
>
> SYNAPSE separates two concerns:
> - **`windowMode`** — Behavior (single/multi/multiByContext/backgroundOnly)
> - **`windowDisplay`** — Visual surface type (window/modal)
>
> These are orthogonal. A `single` mode capability may display as `window` or `modal`.
> Default `windowDisplay` = `'window'` if not specified.

## บทนำ

Manifest/UI Consistency Rules กำหนดความสัมพันธ์ระหว่าง Manifest และ UI
เพื่อให้ UI ไม่ drift จาก Manifest และรักษา Single Source of Truth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 1: Core Consistency Rules

### Rule 1: showInDock implies hasUI

```
IF showInDock = true
THEN hasUI MUST = true
```

| showInDock | hasUI | Valid? |
|------------|-------|--------|
| ✅ true | ✅ true | ✅ |
| ✅ true | ❌ false | ❌ INVALID |
| ❌ false | ✅ true | ✅ (searchable only) |
| ❌ false | ❌ false | ✅ (background capability) |

**Rationale:** If a capability appears in Dock, clicking it must open a window.

---

### Rule 2: windowMode cannot be 'none'

```
windowMode ∈ { 'single', 'multi', 'multiByContext', 'backgroundOnly' }
windowMode ≠ 'none'
```

| windowMode | Valid? |
|------------|--------|
| `single` | ✅ |
| `multi` | ✅ |
| `multiByContext` | ✅ |
| `backgroundOnly` | ✅ |
| `none` | ❌ BLOCKED |
| `undefined` | ❌ BLOCKED |

**Rationale:** Every capability must have explicit window behavior defined.

---

### Rule 3: hasUI determines windowMode validity

```
IF hasUI = false
THEN windowMode MUST = 'backgroundOnly'

IF hasUI = true
THEN windowMode MUST ∈ { 'single', 'multi', 'multiByContext' }
```

| hasUI | windowMode | Valid? |
|-------|------------|--------|
| ✅ true | `single` | ✅ |
| ✅ true | `multi` | ✅ |
| ✅ true | `multiByContext` | ✅ |
| ✅ true | `backgroundOnly` | ❌ INVALID |
| ❌ false | `backgroundOnly` | ✅ |
| ❌ false | `single` | ❌ INVALID |
| ❌ false | `multi` | ❌ INVALID |
| ❌ false | `multiByContext` | ❌ INVALID |

---

### Rule 4: Title constraints

```
title.length >= 2
title.length <= 30
title is human-readable
```

| Title | Valid? | Issue |
|-------|--------|-------|
| "Settings" | ✅ | |
| "User Management" | ✅ | |
| "X" | ❌ | Too short (1 char) |
| "This is an extremely long title..." | ❌ | Too long (>30 chars) |
| "" | ❌ | Empty |

---

### Rule 5: Icon is required

```
icon MUST be defined
icon MUST be non-empty
```

| Icon | Valid? |
|------|--------|
| "⚙️" | ✅ |
| "📊" | ✅ |
| "" | ❌ |
| undefined | ❌ |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 2: Finder Listing Rules

### Rule 6: Finder shows only Registry-listed capabilities

```
Finder.capabilities ⊆ Registry.capabilities
```

| State | In Finder? |
|-------|------------|
| In Registry + showInDock=true | ✅ Visible |
| In Registry + showInDock=false | ⚠️ Searchable only |
| NOT in Registry | ❌ Never shown |

---

### Rule 7: Finder visibility flags

```
Fingder Visible = showInDock = true
Finder Searchable = showInDock = false AND hasUI = true
Finder Hidden = hasUI = false
```

| showInDock | hasUI | Finder Behavior |
|------------|-------|-----------------|
| ✅ true | ✅ true | Always visible in grid |
| ❌ false | ✅ true | Searchable only |
| ❌ false | ❌ false | Not in Finder (background) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 3: Reserved/Blocked ID Rules

### Rule 8: Reserved namespace enforcement

| Namespace | Status | Who can use |
|-----------|--------|-------------|
| `core.*` | Reserved | System only |
| `user.*` | Reserved | System only |
| `org.*` | Reserved | System only |
| `audit.*` | Reserved | System only |
| `system.*` | Reserved | System only |
| `plugin.*` | Open | Third-party (certified) |
| `custom.*` | Open | Custom (certified) |

---

### Rule 9: Blocked IDs

These IDs are permanently blocked per architectural principles:

| ID | Reason |
|----|--------|
| `core.dashboard` | Violates Calm-by-Default |
| `core.chat` | Not SYNAPSE paradigm |
| `*.launcher` | Finder is the launcher |
| `*.widget` | Widget pattern blocked |
| `*.sidebar` | Sidebar pattern blocked |
| `*.notification` | Push pattern blocked |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 4: Terminology Rules

### Rule 10: Forbidden terminology in documentation/code

The following terms are **BLOCKED** in canonical docs and manifest comments:

| Term | Alternative |
|------|-------------|
| "dashboard" | "view", "report view", "context view" |
| "widget" | "capability", "window" |
| "app" | "capability" |
| "launcher" | "finder" |
| "notification center" | (not applicable) |
| "task manager" | (not applicable) |

**Enforcement:**
- Scenario runner scans manifest files for forbidden terms
- Code review checklist includes terminology check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 5: Enforcement Gate Integration

### Validation Function Requirements

The `validateManifestRegistry()` function MUST check:

```typescript
interface ManifestConsistencyChecks {
    // Rule 1
    showInDockImpliesHasUI: boolean;
    
    // Rule 2
    windowModeNotNone: boolean;
    
    // Rule 3
    hasUIWindowModeConsistency: boolean;
    
    // Rule 4
    titleLengthValid: boolean;
    
    // Rule 5
    iconPresent: boolean;
    
    // Rule 9
    notBlockedId: boolean;
}
```

### Error Types

| Error Type | Description |
|------------|-------------|
| `showInDock_hasUI_mismatch` | showInDock=true but hasUI=false |
| `invalid_window_mode` | windowMode is 'none' or undefined |
| `hasUI_windowMode_mismatch` | hasUI/windowMode inconsistent |
| `title_too_short` | title.length < 2 |
| `title_too_long` | title.length > 30 |
| `missing_icon` | icon is empty or undefined |
| `blocked_id` | ID is in blocked list |
| `reserved_namespace` | Using reserved namespace without authorization |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 6: Relationship with Other Contracts

| Contract | How Rules Apply |
|----------|-----------------|
| **Finder Contract** | Rules 6, 7 (listing behavior) |
| **Dock Contract** | Rule 1 (showInDock/hasUI) |
| **Window Identity Contract** | Rules 4, 5 (title/icon) |
| **Window Semantics Contract** | Rules 2, 3 (windowMode) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Manifest กำหนด Truth
UI แสดง Truth
ไม่มีช่องให้ UI deviate

> **Manifest → UI: One-way**
> **UI → Manifest: Not allowed**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Manifest / UI Consistency Rules v1.0*
*Canonical — Specification*
