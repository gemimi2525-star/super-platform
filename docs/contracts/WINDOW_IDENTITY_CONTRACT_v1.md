# Window Identity Contract — v1.0

> *"Window = Context View + Manifest Identity"*

**Status:** CANONICAL — CONTRACT
**Authority:** SYNAPSE Architectural Constitution v1.0
**Effective:** 2026-01-30
**Version:** 1.0
**Related:** Window Semantics Contract v1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Window Identity Contract กำหนดว่า Window จะถูก **ระบุตัวตน** อย่างไร
ทุก Window มี identity ที่มาจาก Manifest เป็นหลัก

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 1: Window Identity Components

### 1.1 Identity Structure

```
Window Identity = {
    windowId:     unique runtime ID (system-generated)
    capabilityId: from Manifest
    title:        from Manifest + optional context suffix
    icon:         from Manifest
    contextId:    from intent (for multiByContext mode)
}
```

### 1.2 Identity Sources

| Component | Source | Mutable? |
|-----------|--------|----------|
| **windowId** | System (runtime) | ❌ Immutable after creation |
| **capabilityId** | Manifest | ❌ Immutable |
| **title** | Manifest.title | ⚠️ Context suffix only |
| **icon** | Manifest.icon | ❌ Immutable |
| **contextId** | Intent.payload | ❌ Immutable after creation |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 2: Title Rules

### 2.1 Base Title

```
Base Title = Manifest.title
```

| Constraint | Value |
|------------|-------|
| Minimum length | 2 characters |
| Maximum length | 30 characters |
| Character set | Unicode (no control chars) |
| Case | Title Case preferred |

### 2.2 Title Format by Window Mode

| Window Mode | Title Format | Example |
|-------------|--------------|---------|
| `single` | `{base}` | "System Settings" |
| `multi` | `{base}` | "User Management" |
| `multiByContext` | `{base} — {contextName}` | "Audit Logs — Acme Corp" |

### 2.3 Context Suffix Rules

For `multiByContext` windows:

```
Full Title = "{Base Title} — {Context Name}"
```

| Rule | Description |
|------|-------------|
| Separator | ` — ` (em dash with spaces) |
| Context name max | 20 characters |
| Truncation | Context name truncated with `…` |
| No context | Base title only |

**Examples:**
- `Audit Logs — Acme Corporation` (full)
- `Audit Logs — Very Long Comp…` (truncated)
- `Audit Logs` (no context)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 3: Icon Rules

### 3.1 Icon Source

```
Icon = Manifest.icon
```

| Constraint | Value |
|------------|-------|
| Type | Single emoji or icon name |
| Fallback | ❓ if not specified |
| Override | ❌ Not allowed |

### 3.2 Icon Display

| Location | Icon Shown? |
|----------|-------------|
| Window title bar | ✅ |
| Dock | ✅ |
| Finder | ✅ |
| Window switcher | ✅ |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 4: Window Mode to Identity Mapping

### 4.1 Single Mode

```
windowMode: 'single'
```

| Behavior | Description |
|----------|-------------|
| Max windows | 1 |
| Identity | Capability ID uniquely identifies |
| Re-open | Focus existing window |

### 4.2 Multi Mode

```
windowMode: 'multi'
```

| Behavior | Description |
|----------|-------------|
| Max windows | Unlimited |
| Identity | windowId uniquely identifies |
| Re-open | Creates new window |

### 4.3 Multi By Context Mode

```
windowMode: 'multiByContext'
```

| Behavior | Description |
|----------|-------------|
| Max windows | 1 per context |
| Identity | capabilityId + contextId uniquely identifies |
| Re-open same context | Focus existing window |
| Re-open different context | Creates new window |

### 4.4 Background Only Mode

```
windowMode: 'backgroundOnly'
```

| Behavior | Description |
|----------|-------------|
| Windows | 0 (no window) |
| Identity | N/A |
| Example | `core.finder` (it IS the desktop) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 5: Window ID Generation

### 5.1 Format

```
windowId = "win-{timestamp}-{random}"
```

| Component | Description |
|-----------|-------------|
| prefix | Always `win-` |
| timestamp | Date.now() |
| random | 6 random alphanumeric chars |

**Example:** `win-1706611963000-a3b2c1`

### 5.2 Uniqueness

| Rule | Description |
|------|-------------|
| System-wide unique | No two windows have same ID |
| Session-bound | IDs not persisted across restarts |
| Collision handling | Re-generate if collision detected |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 6: Identity Immutability

### 6.1 What Cannot Change After Creation

| Property | Changeable? |
|----------|-------------|
| windowId | ❌ |
| capabilityId | ❌ |
| icon | ❌ |
| contextId | ❌ |

### 6.2 What Can Change (Constrained)

| Property | Changeable? | Constraint |
|----------|-------------|------------|
| title | ⚠️ | Context suffix only, not base |
| state | ✅ | active/minimized/hidden |
| zIndex | ✅ | Based on focus order |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 7: Enforcement

### 7.1 Validation at Creation

Before creating a window, the system MUST validate:

```typescript
function validateWindowIdentity(
    manifest: CapabilityManifest,
    contextId?: string
): ValidationResult {
    const errors = [];
    
    // Title validation
    if (manifest.title.length < 2) {
        errors.push('Title too short (min 2 chars)');
    }
    if (manifest.title.length > 30) {
        errors.push('Title too long (max 30 chars)');
    }
    
    // Icon validation
    if (!manifest.icon) {
        errors.push('Icon is required');
    }
    
    // Context validation for multiByContext
    if (manifest.windowMode === 'multiByContext' && !contextId) {
        errors.push('contextId required for multiByContext');
    }
    
    return { valid: errors.length === 0, errors };
}
```

### 7.2 Runtime Enforcement

| Event | Enforcement |
|-------|-------------|
| Window creation | Validate identity |
| Title update attempt | Block if changing base title |
| Icon update attempt | Block |
| CapabilityId update attempt | Block |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Window Identity มาจาก Manifest เท่านั้น

> **Manifest = Truth**
> **Window = Instance of Truth**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Window Identity Contract v1.0*
*Canonical — Contract*
