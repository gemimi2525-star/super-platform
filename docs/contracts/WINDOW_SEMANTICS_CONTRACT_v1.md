# Window Semantics Contract — v1.0

> *"Window ≠ App, Window = Context View"*

**Status:** CANONICAL — CONTRACT
**Authority:** SYNAPSE Canonical Pack v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Window ใน SYNAPSE ไม่ใช่ "แอปพลิเคชัน" แบบดั้งเดิม
Window คือ **มุมมองของ Context ที่ถูก activate โดย Capability**

Contract นี้กำหนดว่า:
- Window คืออะไร
- Window ทำอะไรได้
- Window ทำอะไร **ไม่ได้**
- การกระทำใดถือว่า "ละเมิด Calm"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 1: Window Identity

### 1.1 นิยาม

```
Window = Visual Container that renders a Capability's Context
```

Window เป็น:
- **Visualization Layer** — แสดงผล ไม่ใช่ logic
- **Context View** — มุมมองของ context หนึ่ง
- **Capability Projection** — การฉายออกของ Capability บน Desktop
- **State-Driven** — ถูกควบคุมโดย SystemState

### 1.2 Window ≠ App

| Traditional App | SYNAPSE Window |
|----------------|----------------|
| Self-contained | Context View |
| Has own state | Reflects Capability state |
| Manages lifecycle | Kernel manages lifecycle |
| Can run background | No background operation |
| Independent | Dependent on Capability |

### 1.3 Window = Context View

Window คือ "หน้าต่างมอง" ไม่ใช่ "ห้อง"

```
┌────────────────────────────────────────┐
│              CAPABILITY                │
│            (has context)               │
│                  │                     │
│                  ▼                     │
│   ┌──────────────────────────────┐     │
│   │           WINDOW             │     │
│   │   (views that context)       │     │
│   └──────────────────────────────┘     │
└────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 2: Window Lifecycle

### 2.1 Window States

```
[none] → opened → normal → focused
                     ↓        ↓
                minimized ↔ restored
                     ↓
                  closed → [none]
```

| State | Description |
|-------|-------------|
| `normal` | Visible, not focused |
| `focused` | Visible, active |
| `minimized` | Hidden in dock |

### 2.2 State Transitions

| Event | From | To |
|-------|------|-----|
| `WINDOW_OPENED` | none | normal/focused |
| `WINDOW_FOCUSED` | normal | focused |
| `WINDOW_BLURRED` | focused | normal |
| `WINDOW_MINIMIZED` | normal/focused | minimized |
| `WINDOW_RESTORED` | minimized | normal |
| `WINDOW_CLOSED` | any | none |

### 2.3 Z-Index Management

```typescript
// Kernel manages z-index, not window
// Higher z-index = more recently focused
interface Window {
    zIndex: number; // Assigned by WindowManager
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 3: Window Rights (What Window CAN Do)

### 3.1 Allowed Behaviors

| Behavior | Description | Who Triggers |
|----------|-------------|--------------|
| **Render Content** | Display Capability's UI | Automatic |
| **Receive Focus** | Be the active window | User click |
| **Lose Focus** | Become background | Other focus |
| **Minimize** | Go to dock | User action |
| **Restore** | Come back from dock | User action |
| **Close** | Disappear | User action |
| **Request Intent** | Ask kernel for action | User interaction |

### 3.2 Intent Request Pattern

Window ทำอะไรได้ผ่าน Intent เท่านั้น:

```typescript
// Window component can request intent
const openCapability = useOpenCapability();

// This emits intent through kernel
openCapability('user.manage');
```

### 3.3 State Access

Window สามารถ:
- ✅ Read SystemState (via hooks)
- ✅ Read own window state
- ✅ Subscribe to events
- ❌ Write state directly
- ❌ Dispatch events directly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 4: Window Prohibitions (What Window CANNOT Do)

### 4.1 Forbidden Behaviors

| Behavior | Reason |
|----------|--------|
| **Emit Intent Directly** | Must go through kernel hooks |
| **Mutate SystemState** | State is kernel-owned |
| **Create Other Windows** | Only kernel creates windows |
| **Close Other Windows** | Only kernel closes windows |
| **Access Other Window's Context** | Windows are isolated |
| **Run Background Process** | No background in SYNAPSE |
| **Schedule Future Actions** | No automation |
| **Navigate** | No router, no navigation |
| **Push Notifications** | Violates Calm |
| **Auto-Refresh** | Must be user-initiated |

### 4.2 Violation Consequences

ถ้า Window พยายามทำสิ่งต้องห้าม:
1. Action จะ fail
2. Error จะ logged
3. Capability อาจถูก suspend
4. Window อาจถูก force-close

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 5: Window Modes

### 5.1 Mode Types (Phase H Reconciliation)

SYNAPSE uses two separate concepts:

**A) Window Mode (Behavior)** — How many windows allowed
| Mode | Description | Use Case |
|------|-------------|----------|
| `single` | Only one window allowed | Settings, System |
| `multi` | Multiple windows allowed | Documents |
| `multiByContext` | One window per context | Audit by Org |
| `backgroundOnly` | No window (desktop-level) | Finder |

**B) Window Display (Visual Surface)** — How window appears
| Display | Description | Use Case |
|---------|-------------|----------|
| `window` | Standard desktop window | Most capabilities |
| `modal` | Blocking overlay | Step-up, confirmations |

### 5.2 Reconciliation Note

> **Phase H Clarification:**
> - `windowMode` controls **behavior** (identity/multiplicity)
> - `windowDisplay` controls **visual surface** (window vs modal)
> - These are orthogonal concerns
> - Default `windowDisplay` = `'window'` if not specified

### 5.3 Mode Rules

```typescript
interface CapabilityManifest {
    windowMode: 'single' | 'multi' | 'multiByContext' | 'backgroundOnly';
    windowDisplay?: 'window' | 'modal'; // default: 'window'
}
```

> ⚠️ `windowMode: 'backgroundOnly'` means capability has no visible window (e.g., Finder IS the desktop, not a window on it)

### 5.4 Single Instance Constraint

```typescript
// If windowMode: 'single'
// Only one window can exist for this capability
// Opening again → focus existing window
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 6: Calm Violations

### 6.1 What Violates Calm?

Window interaction ที่ถือว่า **ละเมิด Calm**:

| Violation | Description |
|-----------|-------------|
| **Auto-open** | Window opens without user intent |
| **Auto-focus** | Window grabs focus without permission |
| **Push Alert** | Window shows notification unprompted |
| **Shake/Bounce** | Window animates to grab attention |
| **Sound** | Window makes noise |
| **Badge/Dot** | Window shows persistent unread indicator |
| **Periodic Update** | Window refreshes data without request |
| **Modal Stack** | Multiple modals blocking interaction |

### 6.2 Calm-Preserving Patterns

| Pattern | Description |
|---------|-------------|
| **User-Initiated** | Window opens only when user clicks |
| **Quiet Focus** | Focus transition is smooth, not jarring |
| **Clean Close** | Window closes completely, no residue |
| **Minimize to Dock** | Out of sight, out of mind |
| **No Memory** | Closed window doesn't persist state |

### 6.3 Calm Score (Conceptual)

```
Calm Score = 0 (perfect) to 10 (noisy)

+1 for each: auto-action, sound, animation, notification
+2 for each: modal, blocking action
+3 for each: forced focus grab

Score > 3 = Window violates Calm
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 7: Window Data Structure

### 7.1 Window Interface

```typescript
interface Window {
    // Identity
    id: WindowId;
    capabilityId: CapabilityId;
    
    // Display
    title: string;
    icon?: string;
    zIndex: number;
    
    // State
    state: 'normal' | 'focused' | 'minimized';
    
    // Context
    contextId?: string;
    
    // Metadata
    openedAt: number;
    correlationId: CorrelationId;
}
```

### 7.2 State Ownership

```
Window state is OWNED by:
- WindowManager (creates, updates, destroys)
- StateStore (persists)
- Kernel (orchestrates)

Window component only READS state
Window component NEVER WRITES state
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 8: Desktop Integration

### 8.1 Desktop as Window Container

```
┌──────────────────────────────────────────────────────────┐
│                       MENU BAR                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                      DESKTOP                             │
│                   (Window Container)                     │
│                                                          │
│     ┌──────────┐     ┌──────────┐                       │
│     │ Window A │     │ Window B │                       │
│     │ (z=2)    │     │ (z=1)    │                       │
│     └──────────┘     └──────────┘                       │
│                                                          │
│                    [Calm State]                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                        DOCK                              │
│              [Minimized Windows Here]                    │
└──────────────────────────────────────────────────────────┘
```

### 8.2 Calm Desktop State

เมื่อไม่มี Window:
- Desktop ว่างเปล่า
- ไม่มี text
- ไม่มี CTA
- ไม่มี suggestions
- **เพียงแค่ Dock**

```
CalmDesktop = {
    windows: {},
    focused: null,
    mode: 'calm'
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Window ใน SYNAPSE เป็น "หน้าต่าง" ไม่ใช่ "บ้าน"
Window มองเข้าไปใน Context — ไม่ใช่เป็น Context เอง

> **Window ที่ดี: เงียบ รอ และแสดงผลเมื่อถูกเรียก**
> **Window ที่แย่: กรี๊ด กระโดด และต้องการความสนใจ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Window Semantics Contract v1.0*
*Canonical — Contract*
