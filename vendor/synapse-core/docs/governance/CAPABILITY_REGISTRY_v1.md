# Capability Registry — v1.0

> *"ทะเบียนกลางของทุก Capability ที่ถูกกฎหมาย"*

**Status:** CANONICAL — REGISTRY
**Authority:** SYNAPSE Canonical Pack v1.0 + Certification Model v1.0
**Effective:** 2026-01-30
**Version:** 1.0
**Last Updated:** 2026-01-30T15:51:59+07:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Capability Registry คือ **แหล่งข้อมูลกลาง** ของทุก Capability ที่ได้รับอนุญาตให้ทำงานใน SYNAPSE

**กฎเหล็ก:**
- ถ้าไม่อยู่ใน Registry → ไม่มีอยู่จริง
- ถ้าอยู่ใน Registry → ผ่าน Certification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Registry Statistics

```
Total Capabilities     : 7
├─ CORE               : 6 (incl. core.finder)
├─ CERTIFIED          : 0
├─ EXPERIMENTAL       : 1 (plugin.analytics)
└─ REJECTED/BLOCKED   : (not listed)

Last Registry Update   : 2026-01-30
Next Review Due        : 2026-02-28
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CORE Tier Capabilities

> Core capabilities are system-built and immutable.
> They define the foundational functions of SYNAPSE.

---

### 1. core.settings

| Property | Value |
|----------|-------|
| **ID** | `core.settings` |
| **Title** | Settings |
| **Icon** | ⚙️ |
| **Tier** | 🔒 CORE |
| **Required Policies** | `settings.read` |
| **Single Instance** | ✅ Yes |
| **Requires Step-Up** | ❌ No |
| **Window Mode** | `window` |
| **Status** | ✅ ACTIVE |

**Description:**
ระบบจัดการการตั้งค่าหลักของ SYNAPSE

**Certification:**
- Tier: CORE (Built-in)
- Certified: N/A (System)

---

### 2. user.manage

| Property | Value |
|----------|-------|
| **ID** | `user.manage` |
| **Title** | Users |
| **Icon** | 👤 |
| **Tier** | 🔒 CORE |
| **Required Policies** | `users.read`, `users.write` |
| **Single Instance** | ✅ Yes |
| **Requires Step-Up** | ✅ Yes |
| **Step-Up Message** | "Verify your identity to access user management" |
| **Window Mode** | `window` |
| **Status** | ✅ ACTIVE |

**Description:**
ระบบจัดการผู้ใช้งาน ต้องการ step-up authentication เนื่องจากเป็นข้อมูล sensitive

**Certification:**
- Tier: CORE (Built-in)
- Certified: N/A (System)

---

### 3. org.manage

| Property | Value |
|----------|-------|
| **ID** | `org.manage` |
| **Title** | Organizations |
| **Icon** | 🏢 |
| **Tier** | 🔒 CORE |
| **Required Policies** | `orgs.read` |
| **Single Instance** | ✅ Yes |
| **Requires Step-Up** | ❌ No |
| **Window Mode** | `window` |
| **Status** | ✅ ACTIVE |

**Description:**
ระบบจัดการองค์กร/หน่วยงาน

**Certification:**
- Tier: CORE (Built-in)
- Certified: N/A (System)

---

### 4. audit.view

| Property | Value |
|----------|-------|
| **ID** | `audit.view` |
| **Title** | Audit Logs |
| **Icon** | 📋 |
| **Tier** | 🔒 CORE |
| **Required Policies** | `audit.view` |
| **Single Instance** | ❌ No |
| **Requires Step-Up** | ❌ No |
| **Window Mode** | `window` |
| **Status** | ✅ ACTIVE |

**Description:**
ดู Audit logs ของระบบ สามารถเปิดหลาย window ได้

**Certification:**
- Tier: CORE (Built-in)
- Certified: N/A (System)

---

### 5. system.configure

| Property | Value |
|----------|-------|
| **ID** | `system.configure` |
| **Title** | System |
| **Icon** | 🔧 |
| **Tier** | 🔒 CORE |
| **Required Policies** | `system.admin` |
| **Single Instance** | ✅ Yes |
| **Requires Step-Up** | ✅ Yes |
| **Step-Up Message** | "Verify your identity to access system configuration" |
| **Window Mode** | `window` |
| **Status** | ✅ ACTIVE |

**Description:**
การตั้งค่าระบบระดับ admin ต้องการ step-up authentication

**Certification:**
- Tier: CORE (Built-in)
- Certified: N/A (System)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CERTIFIED Tier Capabilities

> Certified capabilities have passed full review.

```
(No certified capabilities at this time)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## EXPERIMENTAL Tier Capabilities

> Experimental capabilities are in development with limited access.

---

### X1. plugin.analytics

| Property | Value |
|----------|-------|
| **ID** | `plugin.analytics` |
| **Title** | Analytics |
| **Icon** | 📊 |
| **Tier** | 🧪 EXPERIMENTAL |
| **Required Policies** | `audit.view` |
| **Single Instance** | ✅ Yes |
| **Requires Step-Up** | ❌ No |
| **Window Mode** | `single` |
| **Status** | ✅ ACTIVE |

**Description:**
ระบบดูข้อมูลวิเคราะห์การใช้งาน (read-only)
เป็น Capability แรกที่ถูกเพิ่มผ่าน Phase F Pipeline

**Certification:**
- Tier: EXPERIMENTAL
- Certified: 2026-01-30T16:23:18+07:00
- Certified By: System Architect (Phase F Pipeline)

**Governance Notes:**
- ❌ No background tasks
- ❌ No auto-trigger
- ❌ No push notifications
- ✅ User-initiated only
- ✅ Removal-safe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Reserved Capability IDs

> These IDs are reserved for future use.

| ID | Purpose | Status |
|----|---------|--------|
| `core.dashboard` | **BLOCKED** | Violates Calm-by-Default |
| `core.chat` | **BLOCKED** | Not SYNAPSE paradigm |
| `core.notification` | Reserved | Pending design review |
| `export.csv` | Reserved | Future feature |
| `export.pdf` | Reserved | Future feature |
| `report.generate` | Reserved | Future feature |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Registry ID Namespace Allocation

| Namespace | Owner | Status |
|-----------|-------|--------|
| `core.*` | System | Reserved |
| `user.*` | System | Reserved |
| `org.*` | System | Reserved |
| `audit.*` | System | Reserved |
| `system.*` | System | Reserved |
| `export.*` | System | Reserved for future |
| `report.*` | System | Reserved for future |
| `plugin.*` | Third-party | Open for certification |
| `custom.*` | Custom | Open for certification |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Capability Lookup Table

### Quick Reference

| ID | Title | Icon | Tier | Step-Up | Single |
|----|-------|------|------|---------|--------|
| `core.settings` | Settings | ⚙️ | CORE | ❌ | ✅ |
| `user.manage` | Users | 👤 | CORE | ✅ | ✅ |
| `org.manage` | Organizations | 🏢 | CORE | ❌ | ✅ |
| `audit.view` | Audit Logs | 📋 | CORE | ❌ | ❌ |
| `system.configure` | System | 🔧 | CORE | ✅ | ✅ |
| `plugin.analytics` | Analytics | 📊 | EXPERIMENTAL | ❌ | ✅ |

### Policy Requirements

| ID | Policies |
|----|----------|
| `core.settings` | `settings.read` |
| `user.manage` | `users.read`, `users.write` |
| `org.manage` | `orgs.read` |
| `audit.view` | `audit.view` |
| `system.configure` | `system.admin` |
| `plugin.analytics` | `audit.view` |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Adding New Capabilities

### Process

1. **Submit Proposal** — Use Appendix D template
2. **Pass Checklist** — Certification Checklist Pack (A1-A7, E1)
3. **Review** — System Architect review
4. **Register** — Add to this Registry
5. **Activate** — Add to capability-graph.ts

### Proposal Template

```markdown
## New Capability Proposal

**Proposed ID:** plugin.[name]
**Proposed Title:** [Name]
**Proposed Icon:** [emoji]

**Manifest:**
- requiredPolicies: [...]
- singleInstance: [true/false]
- requiresStepUp: [true/false]
- windowMode: [window/modal]

**Justification:**
[Why this capability is needed]

**Checklist Status:**
- [ ] A1-A7 passed
- [ ] E1 passed

**Submitted By:** [name]
**Date:** [date]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Registry Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-01-30 | Added plugin.analytics (EXPERIMENTAL) via Phase F Pipeline | System Architect |
| 2026-01-30 | Initial registry with 6 CORE capabilities | System Architect |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Registry คือ "สำมะโนประชากร" ของ Capabilities
ถ้าไม่อยู่ใน Registry = ไม่มีสิทธิ์ทำงาน

> **Registry ถูกต้อง = System ถูกต้อง**
> **Registry ผิดพลาด = System มีความเสี่ยง**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Capability Registry v1.0*
*Canonical — Registry*
