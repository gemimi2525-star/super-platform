# 🔍 APICOREDATA OS Blueprint v1 — Repository Audit (Survey Order)

## (A) Executive Summary
- **Repo Readiness:** **Needs Phase A** (Critical) | Codebase สะอาดมาก (Clean Architecture) แต่ยังขาด **OS Contracts** ที่ชัดเจน (L3 App Runtime ยังอ่อน)
- **Status:** พร้อม 80% ในด้านโครงสร้างพื้นฐาน (Kernel, L1, L2) แต่ขาดกลไก "Plug-and-Play" สำหรับ App จริง
- **Top 5 Gaps:**
  1. ❌ **No App Registry:** ไม่มี Central registry ระบุว่ามี App อะไรบ้าง (Hardcoded ใน Sidebar)
  2. ❌ **Weak Boundaries:** Apps (v2/[app]) ยังเป็นแค่ Route Folders ไม่ใช่ "Packaged Modules" ที่ชัดเจน
  3. ⚠️ **Undefined Entitlements:** การเช็คสิทธิ์ยังเป็น `if (role === 'admin')` กระจายใน code (Layout.tsx)
  4. ⚠️ **Sidebar Hardcoded:** เมนูถูกฝังใน `layout.tsx` ตรง ๆ ขยายตัวยาก
  5. ❌ **Missing Routing Contract:** ไม่มีมาตรฐานว่า App ต้อง Mount ที่ไหน หรือ Declare route อย่างไร

---

## (B) OS Layer Mapping (Blueprint v1 vs Reality)

### L0 Kernel (Core foundations)
- ✅ **Auth:** `lib/auth` (NextAuth/Firebase), `middleware.ts` (Guard & Locale)
- ✅ **RBAC:** `lib/auth/server.ts` (`requirePlatformAccess`), Firestore persistence (`platform_users`)
- ✅ **i18n:** `app/[locale]`, `lib/i18n` (รองรับ en/th)
- ✅ **Audit:** `modules/audit` (มีโครงสร้างพื้นฐาน)
- ⚠️ **Org:** มี `modules/orgs` แต่ Logic การ Switch Org ยังไม่ชัดเจนใน UI (UI ส่วน Topbar ยังเป็น Mock)

### L1 System UI (Shell & Navigation)
- ✅ **AppShell:** `modules/design-system/src/patterns/AppShell.tsx` (Sidebar + Topbar + Main Layout)
- ⚠️ **Global Nav:** อยู่ใน `app/[locale]/(platform-v2)/layout.tsx` (Hardcoded Links)
- ❌ **Org Switcher:** ยังไม่มี Component จริง (เป็น Text ใน mockup)
- ⚠️ **Account Menu:** มีปุ่ม Logout แต่ไม่มี Dropdown เมนูเต็มรูปแบบ

### L2 Design System (macOS-grade)
- ✅ **Tokens:** `modules/design-system/src/tokens` (Spacing, Radius, Shadow, Colors, Typography) - **ครบถ้วน**
- ✅ **Components:** มี 12 Components หลัก (Button, Badge, Table, Input, etc.) - **เพียงพอสำหรับ Phase 1**
- ✅ **Patterns:** `PageHeader`, `DataPageLayout`, `AppShell` - **ดีมาก**
- ❌ **Accessibility:** ยังไม่มี ARIA guidelines หรือ Focus ring standards ที่ชัดเจนใน Docs

### L3 App Runtime (The Glue)
- ❌ **App Registry:** **ไม่พบ** (ไม่มีไฟล์ `registry.ts` หรือ config ที่รวมรายชื่อ app)
- ❌ **App Isolation:** Code ของแต่ละ App อยู่ใน `v2/*` ปนกันใน `app` directory
- ❌ **Entitlements:** Logic กองอยู่ใน `layout.tsx` (`canViewOrgs`, `canViewUsers`) - ไม่ Scalable
- ⚠️ **Routing Contract:** ใช้ Next.js File-system routing ปกติ ไม่มี abstraction layer

### L4 Apps (Feature Modules)
- ✅ **Existing Apps:** `v2`, `v2/orgs`, `v2/users`, `v2/audit-logs`
- ✅ **Structure:** `modules/{feature}` แยก Logic ออกจาก UI (Clean Arch)
- ⚠️ **Mounting:** แต่ละ App ต้องไปเขียน Route เองใน `app/` (Manual Mounting)

---

## (C) App Boundary Audit
* **Current State:** "Directory-based Separation" (แยกโฟลเดอร์ แต่ไม่แยก Runtime)
* **Evidence:** 
  - `modules/dashboard`, `modules/orgs`, `modules/users` แยกกันชัดเจน (Good)
  - แต่การ "ประกอบ" ลงหน้าเว็บ ทำ manual ใน `app/[locale]/(platform-v2)/layout.tsx` (Bad)
  - Code Shared: `packages/core`, `packages/business` ใช้ร่วมกัน (Good)
* **Risk:** หากเพิ่ม App ใหม่ ต้องแก้ `layout.tsx` ทุกครั้ง (Violation of Open-Closed Principle)
* **Conclusion:** **"ต้องกำหนดใหม่"** (Needs Registry-based injection)

---

## (D) App Runtime Readiness
| Component | Status | Evidence/Notes |
| :--- | :--- | :--- |
| **App Registry** | ❌ None | Layout.tsx hardcodes links directly. |
| **Entitlements** | ⚠️ Weak | Hardcoded functions `canViewOrgs('role')` in layout. |
| **Routing Contract** | ⚠️ Implicit | Based on `v2/[feature]` convention only. |
| **Access Logging** | ✅ Basic | Middleware logs access attempts. |

---

## (E) Design System Readiness
- **Tokens:** ✅ Ready (`src/tokens/index.ts` export ครบ)
- **Components:** ✅ Ready (Button, Input, Table, Dialog, Badge, Toast, etc.)
- **Patterns:** ✅ Ready (AppShell, PageHeader)
- **Accessibility:** ⚠️ Partial (Radix-like primitives ยังไม่ชัวร์ว่า implement ครบไหม)
- **Conclusion:** **"พร้อมพัฒนา OS UI ต่อ"** (Basis แข็งแรงมาก)

---

## (F) Phase A Proposal (OS Contracts Plan)
เป้าหมาย: สร้าง **"Core OS Machinery"** เพื่อให้ App เสียบเข้าได้โดยไม่ต้องแก้ Layout หลัก

| Priority | Task | Goal | Where | Artifact | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Define App Registry Schema** | สร้าง "สมุดทะเบียน" ของ Apps ทั้งหมด | `config/app-registry.ts` | `AppDefinition` type | Registry export array ของ apps ที่มีได้ |
| **2** | **Implement OS Navigation Engine** | สร้างตัว gen sidebar จาก Registry | `modules/core/navigation` | `OSSidebar` comp | Sidebar render ตาม Registry ไม่ใช่ hardcode |
| **3** | **Standardize Entitlements** | Centralize permission logic | `packages/core/auth/permissions.ts` | `checkPermission(user, app)` | Layout เรียก func นี้แทน hardcoded logic |
| **4** | **Create App Manifest Contract** | กำหนดว่า 1 App ต้องมี config อะไรบ้าง | `packages/core/types/app.ts` | Interface `OSApp` | App (Users/Orgs) export manifest ตัวเองได้ |
| **5** | **App Shell V2 (Dynamic)** | Refactor layout ให้รับ Registry | `app/(v2)/layout.tsx` | Updated Layout | Layout สะอาด ไม่มี `if-else` ของ apps |
| **6** | **Implement Org Switcher UI** | สร้างตัวเลือก Org จริงๆ | `modules/design-system/patterns` | `OrgSwitcher` comp | UI มี dropdown เลือก Org ได้ (แม้ logic ยัง mock) |
| **7** | **Refactor Permissions to Policies** | เปลี่ยน Role check เป็น Policy check | `config/policies.ts` | Policy Map | `canViewUsers` -> `policy:users.read` |
| **8** | **Standardize Page Wrappers** | บังคับทุก App ใช้ Wrapper เดียวกัน | `modules/core/ui` | `OSPageWrapper` | ทุกหน้ามี Padding/Title มาตรฐานอัตโนมัติ |
| **9** | **Error Boundary Contract** | App พังต้องไม่พา OS พัง | `components/OSErrorBoundary` | Component | App หนึ่ง crash, sidebar ยังกดได้ |
| **10** | **Route Guard Utility** | Middleware เช็คสิทธิ์ตาม Registry | `middleware.ts` | logic update | Auto-protect routes defined in Registry |
