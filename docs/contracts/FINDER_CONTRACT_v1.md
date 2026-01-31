# Finder Contract — v1.0

> *"Finder = Intent Origin, ไม่ใช่ App Store"*

**Status:** CANONICAL — CONTRACT
**Authority:** SYNAPSE Architectural Constitution v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Finder Contract กำหนดบทบาทและข้อจำกัดของ Finder ใน SYNAPSE
Finder คือ **Intent Origin** — จุดเริ่มต้นของ Human Intent
Finder ไม่ใช่ App Marketplace, ไม่ใช่ Launcher ที่มีชีวิตของตัวเอง

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 1: Finder Role Definition

### 1.1 What Finder IS

| Role | Description |
|------|-------------|
| **Intent Origin** | จุดที่ Human Intent เกิดขึ้น |
| **Capability Discovery Surface** | แสดง capabilities ที่มีให้เลือก |
| **Launch Surface** | เมื่อ user เลือก → emit intent → kernel handles |

### 1.2 What Finder is NOT

| NOT | Reason |
|-----|--------|
| ❌ App Marketplace | Finder ไม่ขาย/แนะนำ apps |
| ❌ Dashboard | Finder ไม่แสดง widgets/cards/summary |
| ❌ Notification Center | Finder ไม่แจ้งเตือน |
| ❌ AI Assistant | Finder ไม่มีอำนาจตัดสินใจ |
| ❌ Smart Launcher | Finder ไม่เดาว่า user ต้องการอะไร |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 2: Finder Behavioral Contract

### 2.1 MUST (ต้องทำ)

| Requirement | Rationale |
|-------------|-----------|
| Show only Registry-listed capabilities | ไม่มีอยู่ใน Registry = ไม่มีอยู่จริง |
| Respect showInDock manifest property | ถ้า showInDock=false → ไม่แสดง (หรือต้อง search) |
| Emit intent via kernel.emit() only | ทุก action ต้องผ่าน kernel |
| Display title/icon from Manifest | Single source of truth |
| Be stateless | ไม่เก็บ state นอกจาก search input |

### 2.2 MUST NOT (ห้ามทำ)

| Prohibition | Reason |
|-------------|--------|
| ❌ Auto-open any capability | ละเมิด Human Intent Authority |
| ❌ Recommend capabilities | ละเมิด Calm-by-Default |
| ❌ Show "Recently Used" | ละเมิด Calm (memory = attention grab) |
| ❌ Push notifications | ละเมิด Calm-by-Default |
| ❌ Display badges/counts | ละเมิด Calm-by-Default |
| ❌ Prioritize/sort by usage | เป็น AI authority ที่ซ่อนเร้น |
| ❌ Show capabilities not in Registry | ละเมิด Registry as Truth |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 3: Finder Output Contract

### 3.1 The Only Valid Output

```
Finder Output = Human Intent Selection
```

| Output Type | Valid? | Notes |
|-------------|--------|-------|
| User clicks capability → emit intent | ✅ | Only valid action |
| Auto-emit intent | ❌ | BLOCKED |
| Scheduled emit | ❌ | BLOCKED |
| AI-suggested emit | ❌ | BLOCKED |

### 3.2 Intent Flow

```
┌─────────────────────────────────────────────────────────┐
│                      FINDER                             │
│                                                         │
│  1. Display Registry capabilities                       │
│  2. User sees → User clicks                            │
│  3. Finder emits: kernel.emit(OPEN_CAPABILITY intent)  │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      KERNEL                             │
│                                                         │
│  4. Route through Policy Engine                         │
│  5. Execute based on policy result                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 4: Finder Listing Rules

### 4.1 What Appears in Finder

| Condition | Appears in Finder? |
|-----------|-------------------|
| In Registry + showInDock=true | ✅ Always visible |
| In Registry + showInDock=false | ⚠️ Searchable only |
| In Registry + certificationTier='experimental' | ✅ With visual indicator |
| NOT in Registry | ❌ Never |

### 4.2 Sort Order

Finder MUST use a **deterministic, alphabetical** sort order.

| Sort Method | Allowed? |
|-------------|----------|
| Alphabetical by title | ✅ |
| By usage/frequency | ❌ (AI pattern) |
| By recency | ❌ (Calm violation) |
| By tier | ⚠️ Only as secondary sort |

### 4.3 Search

| Search Behavior | Allowed? |
|-----------------|----------|
| Filter by title | ✅ |
| Filter by ID | ✅ |
| Fuzzy/AI search | ❌ (Non-deterministic) |
| Suggestion while typing | ❌ (Calm violation) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 5: Calm Preservation

### 5.1 Finder Visual State

| State | Description |
|-------|-------------|
| Idle | No Finder visible (desktop only) |
| Active | Finder visible, showing capabilities |
| Searching | User typing, filtered list shown |

### 5.2 Forbidden Visual Elements

| Element | Status | Reason |
|---------|--------|--------|
| Badges | ❌ BLOCKED | Attention grab |
| Unread counts | ❌ BLOCKED | Attention grab |
| Pulsing/bouncing icons | ❌ BLOCKED | Calm violation |
| "New" indicators | ❌ BLOCKED | Attention grab |
| Promotional banners | ❌ BLOCKED | Not intent-driven |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ส่วนที่ 6: Implementation Notes

### 6.1 Finder reads from:

```typescript
// Single source of truth
const capabilities = capabilityGraph.getDockCapabilities();
```

### 6.2 Finder emits via:

```typescript
// Only valid action
kernel.emit(IntentFactory.openCapability(capabilityId));
```

### 6.3 Finder does NOT:

```typescript
// ❌ FORBIDDEN
capabilities.filter(c => usageTracker.getFrequency(c.id) > 5);
capabilities.sort((a, b) => b.lastUsed - a.lastUsed);
window.open(/* anything */);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Finder คือ "ประตู" ไม่ใช่ "พนักงานขาย"

> **Finder shows → Human chooses → Intent emits**
>
> Finder ไม่แนะนำ, ไม่เลือกให้, ไม่คิดแทน

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Finder Contract v1.0*
*Canonical — Contract*
