# ✅ DAY 0 VERIFICATION CHECKLIST
**APICOREDATA Core OS v1.0-production**  
**Purpose**: Comprehensive smoke tests for first 24 hours  
**Environment**: Production (Green)

---

## Overview

This checklist provides step-by-step verification procedures for Day 0 (first 24 hours) of production. Execute all tests in order and document results.

**Test Environment**: Production (Green) `https://green.apicoredata.com` or Primary domain after cutover  
**Tester**: [NAME] ________________  
**Date/Time**: ________________

---

## SECTION 1: SYSTEM HEALTH

### 1.1 Infrastructure Checks

- [ ] **Health endpoint**
  ```bash
  curl https://[DOMAIN]/api/health
  ```
  - **Expected**: `{ "status": "ok", "timestamp": <recent> }`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Version endpoint**
  ```bash
  curl https://[DOMAIN]/api/version
  ```
  - **Expected**: `{ "version": "v1.0-production", "commit": "<hash>" }`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Response time baseline**
  ```bash
  curl -w "\nTime: %{time_total}s\n" https://[DOMAIN]/
  ```
  - **Expected**: <2s
  - **Actual**: ________ s
  - **Status**: PASS / FAIL

### 1.2 Database Connectivity

- [ ] **Firestore read test**
  - Action: Load Audit Logs app
  - **Expected**: Logs display (even if empty)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Firestore write test**
  - Action: Log in (creates audit log)
  - Query Firestore: Check for recent `*.view` log
  - **Expected**: Audit log written with recent timestamp
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 1.3 Authentication Service

- [ ] **Firebase Auth reachable**
  - Action: Open login page
  - **Expected**: Login form displays
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Sign-in flow**
  - Credentials: Owner account
  - **Expected**: Successful sign-in, redirected to Core OS Demo
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

## SECTION 2: CORE OS SHELL

### 2.1 Desktop & Dock

- [ ] **Desktop loads**
  - URL: `/en/core-os-demo`
  - **Expected**: Desktop background, Dock visible
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Dock apps visible**
  - Count expected: 5 apps (User Management, Audit Logs, Settings, Organizations, System Configure)
  - **Note**: Analytics hidden (showInDock: false)
  - **Expected**: 5 app icons in Dock
  - **Actual**: ________ apps
  - **Status**: PASS / FAIL

- [ ] **Dock hover effects**
  - Action: Hover over each app icon
  - **Expected**: Icon scales up, label appears
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 2.2 Window Management

- [ ] **Open window**
  - Action: Click any app in Dock (e.g., User Management)
  - **Expected**: Window opens with chrome (title bar, red/yellow/green buttons)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Window controls**
  - Red button (close): [ ] PASS / FAIL
  - Yellow button (minimize): [ ] PASS / FAIL
  - Green button (maximize): [ ] PASS / FAIL
  - **Expected**: All controls functional

- [ ] **Focus management**
  - Action: Open 2 windows, click between them
  - **Expected**: Clicked window comes to front, gets focus
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Keyboard navigation**
  - Cmd+Tab: [ ] Switches windows (PASS / FAIL)
  - Cmd+M: [ ] Minimizes all (PASS / FAIL)
  - **Expected**: Shortcuts work

---

## SECTION 3: APP-BY-APP VERIFICATION

### 3.1 User Management (user.manage)

#### Basic Load
- [ ] **App opens**
  - Action: Click User Management in Dock
  - **Expected**: User list displays
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Search Functionality
- [ ] **Search works**
  - Action: Type in search box
  - **Expected**: List filters in real-time
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Create User (Step-up Required)
- [ ] **Create button click**
  - Action: Click "Create User"
  - **Expected**: Step-up modal appears (if session expired) OR Create modal (if already verified)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Step-up flow** (if required)
  - Action: Enter password
  - **Expected**: Modal closes, Create modal opens
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Create user form**
  - Fill: Email, Role, Password
  - Action: Click "Create"
  - **Expected**: Loading → Success → User appears in list
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Audit log for create**
  - Action: Open Audit Logs app
  - Query: Recent `users.create` log
  - **Expected**: Log exists with correlationId linking stepup.verify → users.create
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Edit User (Step-up Required)
- [ ] **Edit flow**
  - Action: Click "Edit" on existing user
  - **Expected**: Step-up (if needed) → Edit modal
  - Fill: Change role
  - **Expected**: User updated
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Disable User (Step-up Required)
- [ ] **Disable flow**
  - Action: Click "Disable" on test user
  - **Expected**: Confirmation → Step-up → User disabled
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

### 3.2 Audit Logs (audit.view)

#### Basic Load
- [ ] **App opens**
  - Action: Click Audit Logs in Dock
  - **Expected**: List of recent audit logs
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Filtering
- [ ] **Time filter**
  - Action: Select "Last 1 hour"
  - **Expected**: Logs filtered to last 1 hour only
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Action filter**
  - Action: Select action type (e.g., "users.create")
  - **Expected**: Only matching logs shown
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Detail View
- [ ] **Expand log**
  - Action: Click on a log entry
  - **Expected**: Expanded view with reasonChain, correlationId
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### CorrelationId Linking
- [ ] **Find linked logs**
  - Action: Find a log with correlationId
  - Copy correlationId
  - Filter by correlationId
  - **Expected**: All related logs shown (e.g., stepup.verify + users.create)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

### 3.3 Settings (core.settings)

#### Basic Load
- [ ] **App opens**
  - Action: Click Settings in Dock
  - **Expected**: Settings sections visible (General, Security, About)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### General Settings
- [ ] **Theme toggle**
  - Action: Change theme (Light/Dark/Auto)
  - **Expected**: UI updates immediately (if implemented)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Language toggle**
  - Action: Change language (EN ↔ TH)
  - **Expected**: UI updates, audit log `settings.update.language`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Security Settings
- [ ] **Step-up status display**
  - **Expected**: Shows "Verified" or "Not verified" + countdown (if verified)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Clear session button**
  - Action: Click "Clear Step-up Session"
  - **Expected**: Status changes to "Not verified", audit log `settings.security.clear_stepup`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### About Section
- [ ] **System info**
  - **Expected**: Platform version, Kernel v1.0, etc.
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

### 3.4 Organizations (org.manage)

#### Basic Load
- [ ] **App opens**
  - Action: Click Organizations in Dock
  - **Expected**: Organization list (may be empty initially)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Create Organization (Step-up Required)
- [ ] **Create flow**
  - Action: Click "Create Organization"
  - **Expected**: Step-up → Create modal
  - Fill: Name, Slug, Plan, Domain
  - **Expected**: Organization created, appears in list
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Plan badge**
  - **Expected**: Plan badge displays (Free/Starter/Pro/Enterprise)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Edit Organization (Step-up Required)
- [ ] **Edit flow**
  - Action: Click "Edit" on organization
  - **Expected**: Step-up → Edit modal → Update successful
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Search
- [ ] **Search works**
  - Action: Type organization name
  - **Expected**: List filters
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

### 3.5 System Configure (system.configure)

#### Basic Load
- [ ] **App opens (Owner only)**
  - Action: Click System Configure in Dock
  - **Expected**: System Configuration UI loads
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### System Mode (CRITICAL - Test Carefully)

**⚠️ WARNING**: Changing system mode affects ALL users. Test during low-traffic window.

- [ ] **View current mode**
  - **Expected**: "Normal"
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Change to Maintenance Mode** (OPTIONAL - Only if approved)
  - Action: Select "Maintenance"
  - **Expected**: Step-up → Mode changes → Audit log `system.configure.mode`
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED

- [ ] **Verify Maintenance Mode** (if tested above)
  - Effect: Regular users blocked (if any)
  - **Expected**: Admin can still access
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED

- [ ] **Revert to Normal Mode** (if tested above)
  - Action: Select "Normal"
  - **Expected**: Step-up → Mode changes back
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED

#### Security Flags (CRITICAL - Test Carefully)

**⚠️ WARNING**: Do NOT disable security flags in production unless approved.

- [ ] **View security flags**
  - Enforce Step-up: [ ] ON / OFF
  - Enforce Audit Log: [ ] ON / OFF
  - Strict Validation: [ ] ON / OFF
  - **Expected**: All ON
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Toggle test** (SKIP in production, or use sandbox)
  - **Status**: SKIPPED (production safety)

#### Feature Toggles
- [ ] **View feature toggles**
  - Virtual Spaces: [ ] Enabled / Disabled
  - Advanced Search: [ ] Enabled / Disabled
  - Real-time Sync: [ ] Enabled / Disabled
  - **Expected**: As configured
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Emergency Controls (TEST WITH EXTREME CAUTION)

**⚠️ WARNING**: Soft Disable blocks ALL new operations. Only test if approved and prepared for impact.

- [ ] **View Soft Disable status**
  - **Expected**: OFF
  - **Actual**: [ ] OFF / ON
  - **Status**: PASS / FAIL

- [ ] **Soft Disable test** (SKIP unless specifically testing emergency procedure)
  - **Status**: SKIPPED (production safety)

---

### 3.6 Analytics (plugin.analytics - Hidden)

#### Accessibility (Not in Dock)
- [ ] **App not in Dock**
  - **Expected**: Analytics icon NOT visible in Dock
  - **Actual**: ________________
  - **Status**: PASS / FAIL

#### Direct Access (Optional, if testing hidden apps)
- [ ] **Open via direct route** (if applicable)
  - Method: Programmatic or manual URL
  - **Expected**: Placeholder UI loads with "EXPERIMENTAL" badge
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED

---

## SECTION 4: STEP-UP AUTHENTICATION FLOW

### 4.1 End-to-End Step-up

- [ ] **Clear existing session**
  - Action: Settings → Clear Step-up Session
  - **Expected**: Status: "Not verified"
  - **Actual**: ________________

- [ ] **Trigger step-up requirement**
  - Action: User Management → Create User
  - **Expected**: Step-up modal appears
  - **Actual**: ________________

- [ ] **Enter password**
  - Action: Type password, click "Verify"
  - **Expected**: Modal closes, Create modal opens
  - **Actual**: ________________

- [ ] **Verify audit trail**
  - Open Audit Logs
  - Find recent logs with same correlationId
  - **Expected**:
    1. `stepup.request` (action: "create user")
    2. `stepup.verify` (decision: ALLOW)
    3. `users.create` (actual action)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 4.2 Session Persistence

- [ ] **Verified status persists**
  - Action: After step-up, close and reopen app
  - **Expected**: Still verified (no new step-up required)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Session countdown**
  - Action: Check Settings → Security
  - **Expected**: Countdown timer visible (e.g., "Expires in 9:45")
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 4.3 Session Expiry

**⚠️ NOTE**: This test requires waiting 10 minutes or manually expiring session.

- [ ] **Wait for expiry** (or manually clear)
  - Wait: 10 minutes OR Settings → Clear Session
  - **Expected**: Status: "Not verified"
  - **Actual**: ________________

- [ ] **Next sensitive action requires step-up**
  - Action: User Management → Edit User
  - **Expected**: Step-up modal appears again
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

## SECTION 5: GOVERNANCE & AUDIT

### 5.1 Audit Log Integrity

- [ ] **All actions logged**
  - Perform: 5 different actions (view, create, edit, settings change, etc.)
  - Check Audit Logs: All 5 actions present
  - **Expected**: 5 new audit logs
  - **Actual**: ________ logs found
  - **Status**: PASS / FAIL

- [ ] **Audit log schema**
  - Sample log must have:
    - `timestamp` ✓
    - `action` ✓
    - `capabilityId` ✓
    - `decision` ✓
    - `reasonChain` ✓
  - **Expected**: All fields present
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **No duplicate logs**
  - Check: Same action, same timestamp
  - **Expected**: Each log unique
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 5.2 CorrelationId Tracking

- [ ] **Step-up correlationId propagation**
  - Action: Create user (with step-up)
  - Find correlationId from `stepup.verify` log
  - Search: Same correlationId in `users.create` log
  - **Expected**: Both logs have matching correlationId
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 5.3 synapse-core Frozen Verification

- [ ] **Version check**
  ```bash
  # On server
  cat packages/synapse-core/package.json | grep version
  ```
  - **Expected**: `"version": "1.0.0"` (or as defined)
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **No runtime modifications**
  - Check: Server logs for any synapse-core errors/warnings
  - **Expected**: No errors, no warnings
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

## SECTION 6: PERFORMANCE & LOAD

### 6.1 Response Time

- [ ] **Homepage**
  - Tool: Browser DevTools → Network
  - **Expected**: <2s first load, <1s subsequent
  - **Actual**: ________ s (first), ________ s (subsequent)
  - **Status**: PASS / FAIL

- [ ] **API endpoints**
  - `/api/platform/users` (GET): **Expected** <500ms, **Actual**: ________ ms
  - `/api/platform/orgs` (GET): **Expected** <500ms, **Actual**: ________ ms
  - `/api/platform/me` (GET): **Expected** <200ms, **Actual**: ________ ms
  - **Status**: PASS / FAIL

### 6.2 Concurrent Operations

- [ ] **Multiple windows**
  - Action: Open 5 windows simultaneously
  - **Expected**: All load without errors, UI responsive
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Rapid actions**
  - Action: Click multiple apps in quick succession
  - **Expected**: All windows open, no crashes
  - **Actual**: ________________
  - **Status**: PASS / FAIL

---

## SECTION 7: SECURITY VERIFICATION

### 7.1 HTTPS Enforcement

- [ ] **HTTP redirect**
  ```bash
  curl -I http://[DOMAIN]
  ```
  - **Expected**: `301` or `302` redirect to `https://`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Valid SSL certificate**
  ```bash
  curl -vI https://[DOMAIN] 2>&1 | grep "SSL certificate verify"
  ```
  - **Expected**: "SSL certificate verify ok"
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 7.2 Cookie Security

- [ ] **Secure cookies**
  - Tool: Browser DevTools → Application → Cookies
  - Check: `Secure` flag ✓
  - **Expected**: All auth cookies have `Secure` flag
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **HttpOnly cookies**
  - Check: `HttpOnly` flag ✓
  - **Expected**: Auth cookies have `HttpOnly` flag
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 7.3 Access Control

- [ ] **Owner-only access**
  - Test: Regular user (if any) tries to access System Configure
  - **Expected**: Access denied (no Dock icon, or error on access)
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED (no regular users yet)

---

## SECTION 8: ERROR HANDLING

### 8.1 Graceful Degradation

- [ ] **Network error simulation**
  - Action: Browser DevTools → Network → Offline
  - Action: Try to create user
  - **Expected**: Error message shown, no crash
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Invalid input**
  - Action: Create user with invalid email
  - **Expected**: Validation error, not submitted
  - **Actual**: ________________
  - **Status**: PASS / FAIL

### 8.2 Error Tracking

- [ ] **Intentional error logged**
  - Action: Trigger validation error (e.g., invalid form)
  - Check: Error tracking tool (Sentry, etc.)
  - **Expected**: Error captured (if configured)
  - **Actual**: ________________
  - **Status**: PASS / FAIL / SKIPPED (if not configured)

---

## FINAL SUMMARY

### Test Results

| Section | Total Tests | Passed | Failed | Skipped |
|---------|-------------|--------|--------|---------|
| 1. System Health | ___ | ___ | ___ | ___ |
| 2. Core OS Shell | ___ | ___ | ___ | ___ |
| 3. Apps (6 apps) | ___ | ___ | ___ | ___ |
| 4. Step-up Flow | ___ | ___ | ___ | ___ |
| 5. Governance | ___ | ___ | ___ | ___ |
| 6. Performance | ___ | ___ | ___ | ___ |
| 7. Security | ___ | ___ | ___ | ___ |
| 8. Error Handling | ___ | ___ | ___ | ___ |
| **TOTAL** | **___** | **___** | **___** | **___** |

### Overall Status

- [ ] **ALL TESTS PASSED** → System healthy ✅
- [ ] **Minor failures (<5%)** → Acceptable, document issues
- [ ] **Major failures (5-10%)** → Investigate immediately
- [ ] **Critical failures (>10%)** → Consider rollback

### Critical Issues (if any)

1. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
2. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
3. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Recommendations

- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**Tester**: ________________  
**Date Completed**: ________________  
**Time Completed**: ________________  
**Sign-off**: ________________
