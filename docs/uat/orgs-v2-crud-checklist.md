# V2 Organizations CRUD - Manual Test Checklist

## Test Environment Setup
- **URL**: `http://localhost:3000/en/v2/orgs`
- **Required**: Test accounts for Owner, Admin, and User roles
- **Prerequisites**: Dev server running (`npm run dev`)

---

## 1. Owner Role Tests

### 1.1 View Organizations List
- [ ] Navigate to `/en/v2/orgs`
- [ ] **Expected**: List of organizations loads successfully
- [ ] **Expected**: Create button visible in header
- [ ] **Expected**: Edit button visible on each row
- [ ] **Expected**: Disable button visible on each row

### 1.2 Create Organization (Success Path)
- [ ] Click "Create Organization" button
- [ ] **Expected**: Modal opens with title "Create Organization"
- [ ] Enter data:
  - Name: "Test Org Alpha"
  - Slug: auto-filled to "test-org-alpha"
  - Plan: Select "Pro"
- [ ] Click "Create" button
- [ ] **Expected**: Success toast appears: "Organization created successfully"
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Table refreshes and new org appears in list

### 1.3 Create Organization (Validation Failures)
- [ ] Click "Create Organization"
- [ ] Leave Name empty, click "Create"
- [ ] **Expected**: Error message: "This field is required"
- [ ] Enter Name: "Test@#$", observe Slug: "test"
- [ ] Manually change Slug to "Test_Invalid!!"
- [ ] Click "Create"
- [ ] **Expected**: Error: "Slug must contain only lowercase letters, numbers, and hyphens"

### 1.4 Create Organization (Duplicate Slug)
- [ ] Click "Create Organization"
- [ ] Enter existing organization slug
- [ ] Click "Create"
- [ ] **Expected**: Error: "This slug is already in use" (409 from API)

### 1.5 Edit Organization (Success Path)
- [ ] Click "Edit" button on any organization row
- [ ] **Expected**: Modal opens with prefilled data
- [ ] Change Name to "Updated Org Name"
- [ ] Click "Save Changes"
- [ ] **Expected**: Success toast: "Organization updated successfully"
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Row updates with new name

### 1.6 Disable Organization (Success Path)
- [ ] Click "Disable" button on an organization
- [ ] **Expected**: Confirm dialog opens
- [ ] **Expected**: Shows organization name and slug
- [ ] **Expected**: Warning: "This action cannot be undone"
- [ ] Click "Disable Organization"
- [ ] **Expected**: Success toast: "Organization disabled successfully"
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Organization disappears from list

---

## 2. Admin Role Tests

### 2.1 View Organizations List
- [ ] Login as Admin role
- [ ] Navigate to `/en/v2/orgs`
- [ ] **Expected**: List loads successfully
- [ ] **Expected**: Create button visible
- [ ] **Expected**: Edit button visible on rows
- [ ] **Expected**: Disable button **NOT visible** on rows

### 2.2 Create Organization
- [ ] Click "Create Organization"
- [ ] Enter valid data
- [ ] Click "Create"
- [ ] **Expected**: Success (same as Owner)

### 2.3 Edit Organization
- [ ] Click "Edit" on any row
- [ ] Update data
- [ ] Click "Save"
- [ ] **Expected**: Success (same as Owner)

### 2.4 Disable Organization (Manual API Test - Should Fail)
- [ ] Open browser DevTools Console
- [ ] Run: 
  ```javascript
  fetch('/api/platform/orgs/[org-id]', { method: 'DELETE' })
    .then(r => r.json())
    .then(console.log)
  ```
- [ ] **Expected**: Response status 403
- [ ] **Expected**: Error message about insufficient permissions

---

## 3. User Role Tests

### 3.1 View Organizations List
- [ ] Login as User role
- [ ] Navigate to `/en/v2/orgs`
- [ ] **Expected**: List loads successfully
- [ ] **Expected**: Create button **NOT visible**
- [ ] **Expected**: Edit buttons **NOT visible** on rows
- [ ] **Expected**: Disable buttons **NOT visible** on rows
- [ ] **Expected**: Only view mode

### 3.2 Protected API Access (Manual Test - Should Fail)
- [ ] Open browser DevTools Console
- [ ] Try to create org:
  ```javascript
  fetch('/api/platform/orgs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', slug: 'test', plan: 'free' })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] **Expected**: Response status 403
- [ ] **Expected**: Error message about insufficient permissions

---

## 4. Error Handling Tests

### 4.1 Network Error
- [ ] Stop dev server or disconnect internet
- [ ] Try to create organization
- [ ] **Expected**: Error toast: "Failed to create organization"
- [ ] **Expected**: Modal remains open
- [ ] **Expected**: Error displayed in modal

### 4.2 Empty List State
- [ ] Login to account with no organizations (or modify query to filter all)
- [ ] Navigate to `/en/v2/orgs`
- [ ] **Expected**: EmptyState component shows
- [ ] **Expected**: Message: "No organizations yet"
- [ ] **Expected**: Subtitle: "Get started by creating your first organization"
- [ ] **Expected**: Create button visible (if Owner/Admin)

### 4.3 Forbidden (403) Error
- [ ] As User, manually call create API (see 3.2)
- [ ] **Expected**: No toast (modal not open)
- [ ] Or mock API to return 403 during create
- [ ] **Expected**: Error in modal: "You don't have permission to perform this action"

### 4.4 Server Error (500)
- [ ] Modify server to return 500 (or mock)
- [ ] Try any CRUD operation
- [ ] **Expected**: Error toast with generic message
- [ ] **Expected**: Modal shows error

---

## 5. i18n (Internationalization) Tests

### 5.1 Thai Language
- [ ] Navigate to `/th/v2/orgs`
- [ ] **Expected**: Page header in Thai: "องค์กร"
- [ ] **Expected**: Table headers in Thai
- [ ] Click "Create Organization" (as Owner/Admin)
- [ ] **Expected**: Modal title in Thai: "สร้างองค์กร"
- [ ] **Expected**: All field labels in Thai
- [ ] **Expected**: Button text in Thai: "สร้าง"
- [ ] Submit form
- [ ] **Expected**: Success toast in Thai: "สร้างองค์กรสำเร็จ"

### 5.2 Chinese Language
- [ ] Navigate to `/zh/v2/orgs`
- [ ] **Expected**: Page header in Chinese: "组织"
- [ ] **Expected**: Table headers in Chinese
- [ ] Click "Create Organization"
- [ ] **Expected**: Modal title in Chinese: "创建组织"
- [ ] **Expected**: All labels in Chinese
- [ ] Submit form
- [ ] **Expected**: Toast in Chinese: "组织创建成功"

### 5.3 Language Switching
- [ ] Start on `/en/v2/orgs`
- [ ] Open Create modal
- [ ] Navigate to `/th/v2/orgs` (URL change)
- [ ] **Expected**: Modal closes (if implemented)
- [ ] **Or**: Content switches to Thai
- [ ] **Expected**: No broken strings, no English fallbacks

---

## 6. Search & Filter Tests

### 6.1 Search by Name
- [ ] Enter organization name in search box
- [ ] **Expected**: Table filters to matching organizations
- [ ] Clear search
- [ ] **Expected**: Full list returns

### 6.2 Search by Slug
- [ ] Enter organization slug in search box
- [ ] **Expected**: Filters correctly

### 6.3 Search by ID
- [ ] Enter organization ID in search box
- [ ] **Expected**: Filters correctly

### 6.4 Plan Filter
- [ ] Select "Pro" from plan filter dropdown
- [ ] **Expected**: Only Pro plan organizations shown
- [ ] Select "All Plans"
- [ ] **Expected**: Full list returns

### 6.5 Combined Search + Filter
- [ ] Enter search term
- [ ] Select plan filter
- [ ] **Expected**: Both filters apply (AND logic)

### 6.6 No Results State
- [ ] Search for non-existent term
- [ ] **Expected**: EmptyState shows: "No results"
- [ ] **Expected**: Message shows search query

---

## 7. Pagination Tests

### 7.1 Pagination Controls
- [ ] If < 10 orgs: Pagination hidden ✅
- [ ] Create > 10 orgs
- [ ] **Expected**: Pagination controls appear
- [ ] **Expected**: Shows "Page 1 of X"

### 7.2 Page Navigation
- [ ] Click "Next" or page 2
- [ ] **Expected**: Table updates with next 10 orgs
- [ ] **Expected**: URL or state updates

### 7.3 Page Size Change
- [ ] Change page size to 25
- [ ] **Expected**: Table shows 25 rows
- [ ] **Expected**: Pagination updates

---

## 8. Performance & UX Tests

### 8.1 Loading States
- [ ] Refresh page
- [ ] **Expected**: Brief loading message: "Loading..."
- [ ] **Expected**: No flash of empty state

### 8.2 Button Loading States
- [ ] Click "Create" in modal
- [ ] **Expected**: Button text changes to "Creating..."
- [ ] **Expected**: Button disabled during API call
- [ ] After response:
- [ ] **Expected**: Button returns to normal or modal closes

### 8.3 Auto-Slug Generation
- [ ] Open Create modal
- [ ] Type Name: "My Test Organization"
- [ ] **Expected**: Slug auto-updates to "my-test-organization"
- [ ] Type Name with special chars: "Org @ Test #123"
- [ ] **Expected**: Slug becomes "org-test-123"

---

## Test Summary Template

```
Date: _________
Tester: _________
Environment: _________

Owner Tests: ___/12 passed
Admin Tests: ___/4 passed
User Tests: ___/2 passed
Error Handling: ___/4 passed
i18n (EN/TH/ZH): ___/3 passed
Search & Filter: ___/6 passed
Pagination: ___/3 passed
Performance & UX: ___/3 passed

Total: ___/37 tests passed

Issues Found:
1. _________
2. _________
3. _________

Notes:
_________
```

---

## Critical Issues to Watch

1. **Permission Bypass**: Ensure User role cannot access Create/Edit/Disable via direct API calls
2. **Slug Injection**: Test SQL/NoSQL injection patterns in slug field
3. **XSS**: Test script tags in name field
4. **CSRF**: Ensure API has CSRF protection (if applicable)
5. **Rate Limiting**: Test rapid-fire create requests
6. **Data Refresh**: Ensure list updates after CRUD operations (no stale data)

---

## Sign-Off

- [ ] All critical tests passed
- [ ] No P0/P1 bugs found
- [ ] i18n complete and verified
- [ ] Permission gating working correctly
- [ ] Ready for production deployment

**Tested By**: ________________  
**Date**: ________________  
**Sign-Off**: ________________
