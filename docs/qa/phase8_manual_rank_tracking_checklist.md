# QA Checklist: Phase 8 Manual Rank Tracking

**Objective:** Verify the new Manual Rank Tracking features while ensuring no regressions in existing Keywords/Pages modules and strict multi-tenant isolation.

---

## 1. Environment Setup
- [ ] **Clean Slate:** Run `npm run dev` (ensure no errors in console)
- [ ] **Browser:** Chrome/Edge/Firefox (Incognito recommended)
- [ ] **URL:** `http://localhost:3000`

---

## 2. Regression Testing (Pre-flight)

### 2.1 Language & Persistence
- [ ] **Default State:** Open app in Incognito -> Should be **English** (default)
- [ ] **Switch Language:** Change to **Thai** -> UI updates immediately
- [ ] **Refresh:** Reload page -> Should stay in **Thai**
- [ ] **New Tab:** Open `localhost:3000` in new tab -> Should be **Thai**
- [ ] **Switch Back:** Change to **Chinese** -> UI updates, no English strings visible

### 2.2 Multi-Tenant Isolation
- [ ] **Login:** User A (Org A)
- [ ] **Create Data:** Create a Keyword "TestTenantA" in Org A
- [ ] **Switch/Login:** User B (Org B)
- [ ] **Verify:** User B **CANNOT** see "TestTenantA"
- [ ] **Create Data:** User B creates "TestTenantB"
- [ ] **Switch Back:** User A **CANNOT** see "TestTenantB"

### 2.3 Existing Modules
- [ ] **Pages CRUD:** Create/Edit/Delete a Page works
- [ ] **Keywords CRUD:** Create/Edit/Delete a Keyword works

---

## 3. Manual Rank Tracking (New Features)

### 3.1 Initial State (Keywords List)
- [ ] **Columns:** Verify new columns: "Rank" and "Last Updated"
- [ ] **Empty State:** If no ranking data, show "-" or "No Data" localized

### 3.2 Update Rank (The "Happy Path")
- [ ] **Action:** Click "Update Rank" button on a keyword row
- [ ] **Modal:** Opens localized "Update Rank" modal
- [ ] **Form:**
    - Date defaults to Today
    - Rank input allows numbers (1-100 recommended)
    - Note input (optional)
- [ ] **Submit:** Click Save
- [ ] **Feedback:** Success toast appears (Localized)
- [ ] **List Update:** Row immediately reflects new Best/Current rank

### 3.3 Rank History (Trend View)
- [ ] **Navigation:** Click on Keyword Term (or "View Details" button)
- [ ] **Detail Page:** Loads Keyword Detail view
- [ ] **Chart:** Trend chart shows the new data point
- [ ] **Table:** History table lists the recent update
- [ ] **Context:** Verify `organizationId` is respected (URL access check if possible)

---

## 4. Edge Cases & Validation

### 4.1 Validation
- [ ] **Invalid Rank:** Try entering negative number or text -> Error localized
- [ ] **Future Date:** (Optional rule) Try entering future date -> Warning/Block

### 4.2 i18n Completeness
- [ ] **Thai Mode:**
    - "Update Rank" -> "อัปเดตอันดับ"
    - "Current Rank" -> "อันดับปัจจุบัน"
    - "Best Rank" -> "อันดับดีที่สุด"
- [ ] **Chinese Mode:**
    - "Update Rank" -> "更新排名"
    - Check all modal labels

---

## 5. QA Demo Route (Dev Only)
**URL:** `/qa/manual-rank`
- [ ] **Access:** Visit route
- [ ] **Action:** Click "Simulate Rank Update"
- [ ] **Verify:** Logs output to console/screen
- [ ] **Safety:** Ensure this route DOES NOT expose auth tokens or sensitive data

---

**Sign-off:**
- Tester: ____________________
- Date: ____________________
- Result: PASS / FAIL
