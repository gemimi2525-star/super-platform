# Dock Contract — v1.0

> *"Dock = Calm Presence, ไม่ใช่ Task Manager"*

**Status:** CANONICAL — CONTRACT
**Authority:** SYNAPSE Architectural Constitution v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Dock Contract กำหนดว่า Dock จะ **แสดงอะไรได้** และ **ห้ามแสดงอะไร**
Dock เป็น Calm Presence — ไม่เรียกร้องความสนใจ, ไม่จัดการ tasks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 1: Dock Role Definition

### 1.1 What Dock IS

| Role | Description |
|------|-------------|
| **Calm Presence** | อยู่เงียบๆ ไม่เรียกร้องความสนใจ |
| **Pinned Capabilities Display** | แสดง capabilities ที่ user pin ไว้ |
| **Running Windows Indicator** | แสดงว่ามี window ของ capability นั้นเปิดอยู่ |
| **Quick Launch Surface** | คลิก = emit intent (เหมือน Finder) |

### 1.2 What Dock is NOT

| NOT | Reason |
|-----|--------|
| ❌ Task Manager | Dock ไม่จัดการ processes |
| ❌ Notification Center | Dock ไม่แจ้งเตือน |
| ❌ Status Bar | Dock ไม่แสดง system status |
| ❌ Activity Monitor | Dock ไม่แสดง CPU/memory/usage |
| ❌ Widget Container | Dock ไม่มี widgets |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 2: Dock Contents

### 2.1 What Dock Contains

Dock contains **EXACTLY** two types of items:

| Item Type | Source | Visual Indicator |
|-----------|--------|------------------|
| **Pinned Capabilities** | User explicit choice | Icon (static) |
| **Running Windows** | WindowManager state | Icon + running dot |

### 2.2 Pinned Capabilities

```
Pinned = User explicitly added to Dock
```

| Rule | Description |
|------|-------------|
| User adds | ✅ Explicit action only |
| User removes | ✅ Explicit action only |
| Auto-add on launch | ❌ BLOCKED |
| Suggest adding | ❌ BLOCKED |
| Usage-based auto-pin | ❌ BLOCKED (AI pattern) |

### 2.3 Running Windows (Minimized Presence)

```
Running = Window exists in WindowManager for this capability
```

| State | Dock Visual |
|-------|-------------|
| Window active | Icon + running indicator (dot) |
| Window minimized | Icon + running indicator (same) |
| No window | Icon only (if pinned) or not shown |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 3: Dock Behavioral Contract

### 3.1 MUST (ต้องทำ)

| Requirement | Rationale |
|-------------|-----------|
| Show pinned capabilities | User expectation |
| Show running window indicators | State visibility |
| Emit intent on click | Intent-driven |
| Stay calm | Calm-by-Default |

### 3.2 MUST NOT (ห้ามทำ)

| Prohibition | Reason |
|-------------|--------|
| ❌ Show badges | Calm violation |
| ❌ Show unread counts | Calm violation |
| ❌ Bounce icons | Calm violation (attention grab) |
| ❌ Play sounds | Calm violation |
| ❌ Show alerts | Calm violation |
| ❌ Auto-add items | Human Authority violation |
| ❌ Suggest removals | AI authority |
| ❌ Show "frequent" items | AI pattern |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 4: Dock Visual Rules

### 4.1 Allowed Visual Elements

| Element | Status | Max Animation |
|---------|--------|---------------|
| Static icon | ✅ | None |
| Running indicator (dot) | ✅ | None (static) |
| Hover tooltip (title) | ✅ | Fade in (subtle) |
| Click feedback | ✅ | Scale (0.95x, instant) |

### 4.2 Forbidden Visual Elements

| Element | Status | Reason |
|---------|--------|--------|
| Badges | ❌ BLOCKED | Attention grab |
| Counts (unread/notification) | ❌ BLOCKED | Attention grab |
| Progress indicators | ❌ BLOCKED | Implies background work |
| Bouncing animation | ❌ BLOCKED | macOS pattern but Calm violation |
| Pulsing glow | ❌ BLOCKED | Attention grab |
| Color changes (alerts) | ❌ BLOCKED | Attention grab |

### 4.3 Dock Layout

| Layout Aspect | Constraint |
|---------------|------------|
| Position | Bottom (fixed) or User-configurable side |
| Size | Fixed or User-configurable |
| Items | No reflow/shuffle without user action |
| Order | Stable, user-defined |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 5: Dock Interaction Model

### 5.1 Click Actions

| Click Type | Action |
|------------|--------|
| Left click (not running) | Emit OPEN_CAPABILITY intent |
| Left click (running) | Focus existing window |
| Right click | Show context menu (minimal) |

### 5.2 Context Menu (Minimal)

| Option | Condition | Action |
|--------|-----------|--------|
| "Show Window" | If running | Focus window |
| "Close Window" | If running | Emit CLOSE_WINDOW intent |
| "Remove from Dock" | If pinned | Unpin |
| "Keep in Dock" | If running but not pinned | Pin |

**Forbidden context menu items:**
- ❌ "Open at Login"
- ❌ "Show Recent Items"
- ❌ "Force Quit"
- ❌ Any notification settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 6: Dock State

### 6.1 Dock is Derived State

Dock does NOT own state. Dock derives from:

```typescript
// Dock reads from:
const pinned = userPreferences.pinnedCapabilities; // User-owned
const running = windowManager.getRunningCapabilityIds(); // WindowManager-owned

// Dock displays:
const dockItems = [...new Set([...pinned, ...running])];
```

### 6.2 State Update

| Event | Dock Updates? | How? |
|-------|---------------|------|
| Window opened | ✅ | WindowManager subscription |
| Window closed | ✅ | WindowManager subscription |
| User pins | ✅ | User action → update preferences |
| User unpins | ✅ | User action → update preferences |
| Capability certified | ❌ | Not automatic (user must pin) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 7: Relationship with Finder

| Aspect | Finder | Dock |
|--------|--------|------|
| **Purpose** | Discovery | Quick access |
| **Visibility** | On-demand | Always visible |
| **Content** | All showInDock capabilities | Pinned + Running only |
| **User choice** | Search and select | Pin explicitly |
| **Calm** | Must be calm | Must be even more calm |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Dock คือ "ทางลัด" ไม่ใช่ "ผู้จัดการ"

> **Dock shows presence, not importance**
>
> Dock ไม่บอกว่าอะไรสำคัญ, แค่บอกว่าอะไรอยู่ตรงนี้

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Dock Contract v1.0*
*Canonical — Contract*
