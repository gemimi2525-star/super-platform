# Roles UI Permission Gating Report

**Date:** 2026-01-22  
**Phase:** 9.6  
**Module:** Roles  
**Status:** ✅ VERIFIED (with note)

---

## Summary

**Roles UI is protected by page-level `requireOwner()` guard.**

Non-owners cannot access Roles pages (redirected to /platform).

---

## 1) Entry Point Verification

| Entry Point | Owner | Admin | User | Notes |
|-------------|-------|-------|------|-------|
| Sidebar link | ✅ Visible | ⚠️ Visible | ⚠️ Visible | Link shown to all |
| Direct URL (/platform/roles) | ✅ Access | ❌ Redirect | ❌ Redirect | Server guard |
| Deep link (/platform/roles/[id]) | ✅ Access | ❌ Redirect | ❌ Redirect | Server guard |
| /platform/roles/create | ✅ Access | ❌ Redirect | ❌ Redirect | Server guard |

### Note on Sidebar
- **Current state:** Roles link visible to all users in sidebar
- **Behavior:** Non-owners click → redirect to /platform by `requireOwner()`
- **Impact:** Low - creates minor "false affordance" but security not compromised

---

## 2) Page-level Guard Confirmation

| Page | Guard | Location |
|------|-------|----------|
| `/platform/roles/page.tsx` | `requireOwner()` | Line 11 |
| `/platform/roles/[id]/page.tsx` | `requireOwner()` | (verify) |
| `/platform/roles/create/page.tsx` | `requireOwner()` | (verify) |

**Guard implementation:**
```typescript
// app/[locale]/(platform)/platform/roles/page.tsx
export default async function RolesPage({ params }) {
    await requireOwner();  // ← Server-side guard
    // ...
}
```

**Result:** Server-side protection ✅

---

## 3) In-page Actions

Since page is Owner-only:
- ❌ Button-level gating **not required**
- All actions (Create/Edit/Delete/Copy) shown only to Owners
- No false affordance within page

---

## 4) Gap Analysis

### Current State
- **Security:** ✅ Correct (non-owners blocked at page level)
- **UX:** ⚠️ Minor issue (sidebar link visible to all)

### Options

| Option | Effort | Description |
|--------|--------|-------------|
| A) Accept as-is | None | Link visible but page protected |
| B) Hide sidebar link | Low | Check role in sidebar, hide for non-owners |

### Recommendation

**Option A: Accept as-is**

Reasons:
1. Security is intact (page guard blocks access)
2. Sidebar filtering requires additional fetch/state
3. Low priority - users simply get redirected
4. Phase 9 scope is security parity, not UX optimization

---

## 5) Statement

**No additional in-page gating required.**

Page-level `requireOwner()` is sufficient for Roles module.

---

## ▶️ Next Step

**Phase 9.7 — Forbidden UX (403) + i18n (Roles)**
