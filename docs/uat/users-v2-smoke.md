# Users V2 — Smoke Test / UAT Checklist

## Test Environment
- **URL**: `/[locale]/v2/users` (EN / TH / ZH)
- **Database**: Staging / UAT
- **Test Date**: _____________
- **Tested By**: _____________

---

## 🎯 Test Scenarios

### 1. Owner Role Tests

#### 1.1 Access & View
- [ ] ✅ Can access `/en/v2/users`
- [ ] ✅ Can access `/th/v2/users`
- [ ] ✅ Can access `/zh/v2/users`
- [ ] ✅ See list of users with correct columns (Name+Email, Role, Status, Created, Actions)
- [ ] ✅ See "New User" button (enabled)
- [ ] ✅ See "Edit" button per row (enabled)
- [ ] ✅ See "Disable" button per row (enabled, red)

**Notes**: _______________________________

---

#### 1.2 Create User
- [ ] ✅ Click "New User" → Modal opens
- [ ] ✅ Modal title: "Create User"
- [ ] ✅ Form fields:
  - [ ] Email (input)
  - [ ] Display Name (input)
  - [ ] Role (dropdown: Admin / User options visible)
- [ ] ✅ Note text: "You can only create users with roles lower than yours"
- [ ] ✅ Cancel button works (modal closes)

**Create Admin User**:
- [ ] ✅ Fill: email=`admin-test@example.com`, name=`Test Admin`, role=`Admin`
- [ ] ✅ Click "Create User" → Loading state ("Creating...")
- [ ] ✅ Success:
  - [ ] Modal changes to success screen
  - [ ] Shows email + temporary password (copyable)
  - [ ] Warning: "Save these credentials - password will not be shown again!"
  - [ ] Toast success appears
- [ ] ✅ Click "Done" → Modal closes
- [ ] ✅ List refreshes → new user appears with `ADMIN` badge (warning color)

**Create User (role=user)**:
- [ ] ✅ Fill: email=`user-test@example.com`, name=`Test User`, role=`User`
- [ ] ✅ Success flow same as above
- [ ] ✅ New user appears with `USER` badge (info color)

**Validation Tests**:
- [ ] ✅ Empty email → "Invalid email format" error
- [ ] ✅ Invalid email format → "Invalid email format" error
- [ ] ✅ Empty display name → "This field is required" error
- [ ] ✅ Duplicate email → "This email is already in use" error (409)

**Notes**: _______________________________

---

#### 1.3 Edit User
- [ ] ✅ Click "Edit" on user row → Modal opens
- [ ] ✅ Modal title: "Edit User"
- [ ] ✅ Email field: read-only (gray background)
- [ ] ✅ Display Name pre-filled (editable)
- [ ] ✅ Role pre-filled (dropdown: Admin / User)
- [ ] ✅ **Status field visible** (dropdown: Active / Disabled)
- [ ] ✅ Cancel button works

**Edit Display Name**:
- [ ] ✅ Change name to `Test User Updated`
- [ ] ✅ Click "Save Changes" → Loading ("Saving...")
- [ ] ✅ Success:
  - [ ] Toast success
  - [ ] Modal closes
  - [ ] List refreshes → name updated

**Edit Role**:
- [ ] ✅ Change role from `User` to `Admin`
- [ ] ✅ Save → Success
- [ ] ✅ Badge changes to `ADMIN` (warning color)

**Edit Status**:
- [ ] ✅ Change status from `Active` to `Disabled`
- [ ] ✅ Save → Success
- [ ] ✅ Badge changes to `DISABLED` (neutral/gray color)

**Validation**:
- [ ] ✅ Empty display name → error

**Notes**: _______________________________

---

#### 1.4 Disable User
- [ ] ✅ Click "Disable" (red button) on user row → Modal opens
- [ ] ✅ Modal title: "Disable User"
- [ ] ✅ **Warning box (yellow)**: "This user will no longer be able to log in..."
- [ ] ✅ User info displayed: name + email (read-only)
- [ ] ✅ Confirmation input: "Type DISABLE to confirm"
- [ ] ✅ Disable button initially **disabled** (no text typed yet)

**Type Incorrect Text**:
- [ ] ✅ Type `disable` (lowercase) → button still disabled
- [ ] ✅ Type `DISABL` (missing E) → button still disabled

**Type Correct Text**:
- [ ] ✅ Type `DISABLE` (exact match) → button **enabled**
- [ ] ✅ Click "Disable User" → Loading ("Disabling...")
- [ ] ✅ Success:
  - [ ] Toast success
  - [ ] Modal closes
  - [ ] List refreshes → user now has `DISABLED` badge

**Notes**: _______________________________

---

#### 1.5 Self-Disable Protection
- [ ] ✅ Find Owner's own row in table
- [ ] ✅ "Disable" button is **disabled** (grayed out)
- [ ] ✅ Hover → tooltip: "You cannot disable your own account"
- [ ] ✅ Cannot click (blocked)

**Notes**: _______________________________

---

#### 1.6 Filters & Search
**Search**:
- [ ] ✅ Type email → filters correctly
- [ ] ✅ Type name → filters correctly
- [ ] ✅ Type uid → filters correctly
- [ ] ✅ No results → empty state message

**Role Filter**:
- [ ] ✅ Select "Owner" → shows only owners
- [ ] ✅ Select "Admin" → shows only admins
- [ ] ✅ Select "User" → shows only users
- [ ] ✅ Select "All" → shows all

**Status Filter**:
- [ ] ✅ Select "Active" → shows only enabled users
- [ ] ✅ Select "Disabled" → shows only disabled users
- [ ] ✅ Select "All" → shows all

**Notes**: _______________________________

---

#### 1.7 Pagination
- [ ] ✅ Page size dropdown: 10 / 25 / 50 / 100
- [ ] ✅ Change page size → list updates
- [ ] ✅ Next/Previous buttons work
- [ ] ✅ Shows "Showing X to Y of Z users"

**Notes**: _______________________________

---

### 2. Admin Role Tests

#### 2.1 Access & View
- [ ] ✅ Can access `/en/v2/users`
- [ ] ✅ See list of users
- [ ] ✅ See "New User" button (enabled)
- [ ] ✅ See "Edit" button per row (enabled)
- [ ] ✅ **DO NOT see "Disable" button** (hidden for Admin)

**Notes**: _______________________________

---

#### 2.2 Create User (Limited)
- [ ] ✅ Click "New User" → Modal opens
- [ ] ✅ Role dropdown: **ONLY "User" option** (no Admin option)
- [ ] ✅ Create user with role=User → Success
- [ ] ✅ New user appears in list

**Attempt to create Admin** (should be impossible):
- [ ] ✅ Role dropdown does not have "Admin" option

**Notes**: _______________________________

---

#### 2.3 Edit User (No Status Field)
- [ ] ✅ Click "Edit" on user row → Modal opens
- [ ] ✅ Email: read-only
- [ ] ✅ Display Name: editable
- [ ] ✅ Role: dropdown (User only)
- [ ] ✅ **Status field HIDDEN** (not visible to Admin)
- [ ] ✅ Edit display name → Save → Success
- [ ] ✅ List updates (no status change)

**Notes**: _______________________________

---

#### 2.4 No Disable Access
- [ ] ✅ Disable button **not visible** on any row
- [ ] ✅ Cannot disable any user

**Notes**: _______________________________

---

### 3. User Role Tests

#### 3.1 Access & View
- [ ] ✅ Can access `/en/v2/users`
- [ ] ✅ See list of users (read-only)
- [ ] ✅ **DO NOT see "New User" button** (hidden)
- [ ] ✅ **DO NOT see "Edit" button** (hidden)
- [ ] ✅ **DO NOT see "Disable" button** (hidden)
- [ ] ✅ **Actions column empty** or shows "-"

**Notes**: _______________________________

---

#### 3.2 No Create/Edit/Disable
- [ ] ✅ Cannot create users (no button)
- [ ] ✅ Cannot edit users (no button)
- [ ] ✅ Cannot disable users (no button)

**Notes**: _______________________________

---

### 4. Error Handling Tests

#### 4.1 Permission Errors (403)
**Owner/Admin tries to edit user they don't have access to**:
- [ ] ✅ Trigger 403 error (e.g., edit higher-role user if possible)
- [ ] ✅ Error message: "You don't have permission to edit users"
- [ ] ✅ Toast error appears
- [ ] ✅ Modal shows inline error (red box)

**Admin tries to disable** (should not be possible via UI):
- [ ] ✅ Disable button hidden → cannot trigger

**Notes**: _______________________________

---

#### 4.2 Not Found (404)
**Edit non-existent user** (manually trigger or delete user during edit):
- [ ] ✅ Error message: "User not found"
- [ ] ✅ Toast error appears

**Notes**: _______________________________

---

#### 4.3 Conflict (409)
**Create user with duplicate email**:
- [ ] ✅ Error message: "This email is already in use"
- [ ] ✅ Toast error appears
- [ ] ✅ Modal shows inline error

**Notes**: _______________________________

---

#### 4.4 Network / 500 Errors
**Simulate network error** (disconnect internet during action):
- [ ] ✅ Generic error message appears
- [ ] ✅ Toast error: "Failed to create/edit/disable user"
- [ ] ✅ Modal shows inline error

**Notes**: _______________________________

---

### 5. i18n Tests

#### 5.1 English (EN)
- [ ] ✅ All text in English
- [ ] ✅ Modal titles correct
- [ ] ✅ Toast messages correct
- [ ] ✅ Validation errors correct

**Notes**: _______________________________

---

#### 5.2 Thai (TH)
- [ ] ✅ Switch to `/th/v2/users`
- [ ] ✅ All text in Thai (ไทย)
- [ ] ✅ Modal titles: "สร้างผู้ใช้", "แก้ไขผู้ใช้", "ปิดการใช้งานผู้ใช้"
- [ ] ✅ Toast messages in Thai

**Notes**: _______________________________

---

#### 5.3 Chinese (ZH)
- [ ] ✅ Switch to `/zh/v2/users`
- [ ] ✅ All text in Chinese (中文)
- [ ] ✅ Modal titles: "创建用户", "编辑用户", "禁用用户"
- [ ] ✅ Toast messages in Chinese

**Notes**: _______________________________

---

### 6. UX Polish Tests

#### 6.1 Loading States
- [ ] ✅ Create button shows "Creating..." during API call
- [ ] ✅ Edit button shows "Saving..." during API call
- [ ] ✅ Disable button shows "Disabling..." during API call
- [ ] ✅ List shows loading message on initial load

**Notes**: _______________________________

---

#### 6.2 Empty States
**No users in database**:
- [ ] ✅ Empty state shows: title + message
- [ ] ✅ If Owner/Admin: shows "New User" CTA button
- [ ] ✅ If User: no CTA button

**Filtered empty (search returns 0 results)**:
- [ ] ✅ Shows "No results" message
- [ ] ✅ Shows current search query

**Notes**: _______________________________

---

#### 6.3 Badges & Visual Feedback
- [ ] ✅ Role badges:
  - [ ] OWNER → danger (red)
  - [ ] ADMIN → warning (yellow/orange)
  - [ ] USER → info (blue)
- [ ] ✅ Status badges:
  - [ ] Active → success (green)
  - [ ] Disabled → neutral (gray)

**Notes**: _______________________________

---

## 🚨 Critical Issues Found

### Blocker Issues
_List any blocking issues that prevent production deployment:_

1. _______________________________
2. _______________________________
3. _______________________________

---

### Non-Blocker Issues
_List non-critical issues:_

1. _______________________________
2. _______________________________
3. _______________________________

---

## ✅ Final Sign-Off

### Compliance Checks (Run Before Sign-Off)
```bash
pnpm check:no-inline-styles:v2    # → MUST PASS
pnpm check:no-legacy-imports:v2   # → MUST PASS
pnpm lint                         # → MUST PASS
pnpm build                        # → MUST PASS
```

**Results**:
- [ ] ✅ Inline styles: 0
- [ ] ✅ Legacy imports: 0
- [ ] ✅ Lint: PASS
- [ ] ✅ Build: PASS

---

### Sign-Off
- [ ] ✅ **Owner role** tested and approved
- [ ] ✅ **Admin role** tested and approved
- [ ] ✅ **User role** tested and approved
- [ ] ✅ **Error handling** tested and approved
- [ ] ✅ **i18n (EN/TH/ZH)** tested and approved
- [ ] ✅ **UX polish** tested and approved
- [ ] ✅ **All critical scenarios PASS**

**Approved By**: _______________________________  
**Date**: _______________________________  
**Status**: ✅ PASS / ❌ FAIL / ⚠️ CONDITIONAL PASS

---

## 📋 Test Summary

| Category            | Scenarios | Pass | Fail | Notes |
|---------------------|-----------|------|------|-------|
| Owner Role          | 7         |      |      |       |
| Admin Role          | 4         |      |      |       |
| User Role           | 2         |      |      |       |
| Error Handling      | 4         |      |      |       |
| i18n                | 3         |      |      |       |
| UX Polish           | 3         |      |      |       |
| **TOTAL**           | **23**    |      |      |       |

---

## 📝 Additional Notes

_Any additional observations, recommendations, or follow-up actions:_

---

**END — Users V2 Smoke Test Checklist**
