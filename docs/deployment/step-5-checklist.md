# STEP 5 — Production Deployment Checklist

## ⚠️ Pre-Deployment Verification (ทำก่อนทุกครั้ง)

### Code Quality
- [ ] `npm run check:no-inline-styles:v2` → ✅ PASS
- [ ] `npm run check:no-legacy-imports:v2` → ✅ PASS
- [ ] `npm run lint` → ✅ PASS
- [ ] `npm run typecheck:v2` → ✅ PASS
- [ ] `npm run build` → ✅ PASS

### STEP 4 Complete
- [ ] PASS PR verified (link: ____________)
- [ ] FAIL PR verified (link: ____________)
- [ ] Branch protection enabled (main)
- [ ] Branch protection enabled (staging)

### Staging Verification
- [ ] Staging branch clean (no uncommitted changes)
- [ ] All PRs merged to staging
- [ ] CI passing on staging (v2-compliance ✅)
- [ ] Staging manual test passed

---

## 🚀 Deployment Execution

### Step 1: Sync Main with Staging
```bash
# Date: ___________________
# Time: ___________________

git checkout staging
git pull origin staging

git checkout main
git pull origin main

git merge staging
# Merge commit SHA: ___________________

git push origin main
# Push time: ___________________
```

### Step 2: Verify CI on Main
- [ ] GitHub Actions triggered
- [ ] Workflow: "V2 Zone Guards" running
- [ ] Job: v2-compliance
  - [ ] Guard — No inline styles (V2): ✅
  - [ ] Guard — No legacy imports (V2): ✅
  - [ ] Lint: ✅
  - [ ] Typecheck (V2 zone): ✅
  - [ ] Build: ✅
- [ ] All checks PASS
- [ ] Commit SHA: ___________________

---

## 🧪 Post-Deploy Smoke Test (Production)

### Production URL
- Base URL: ___________________
- Test URL: ___________________/[locale]/v2/users

### Core Scenarios (เลือกสำคัญ 10 ข้อ)

#### 1. Access & Permission
- [ ] EN: ___________________/en/v2/users loads
- [ ] TH: ___________________/th/v2/users loads
- [ ] ZH: ___________________/zh/v2/users loads

#### 2. Users List (READ)
- [ ] Users list displays correctly
- [ ] Search works
- [ ] Filter works (role/status)
- [ ] Pagination works

#### 3. Create User (Owner)
- [ ] "New User" button visible
- [ ] Modal opens
- [ ] Create user successful
- [ ] Temporary password shown
- [ ] List refreshes

#### 4. Edit User (Owner)
- [ ] "Edit" button visible
- [ ] Modal opens with pre-filled data
- [ ] Edit displayName successful
- [ ] Edit role successful
- [ ] Status field visible (Owner)
- [ ] List refreshes

#### 5. Disable User (Owner)
- [ ] "Disable" button visible (red)
- [ ] Modal opens
- [ ] Typing "DISABLE" required
- [ ] Disable successful
- [ ] Badge changes to "DISABLED"
- [ ] List refreshes

#### 6. Admin Permission
- [ ] "New User" visible
- [ ] Can create User (not Admin/Owner)
- [ ] "Edit" visible
- [ ] Status field HIDDEN
- [ ] "Disable" button HIDDEN

#### 7. User Permission (Read-only)
- [ ] List visible
- [ ] "New User" HIDDEN
- [ ] "Edit" HIDDEN
- [ ] "Disable" HIDDEN

#### 8. Error Handling
- [ ] 403: Correct message per action
- [ ] 404: "User not found"
- [ ] 409: "Email already in use"
- [ ] 500: Generic error (no crash)

#### 9. UX
- [ ] Loading states visible
- [ ] Toast notifications work
- [ ] Modal doesn't close on error
- [ ] Empty states (if applicable)

#### 10. i18n
- [ ] EN: All text in English
- [ ] TH: All text in Thai
- [ ] ZH: All text in Chinese

### Critical Issues Found
```
Issue 1: ___________________
Severity: ___________________
Action: ___________________

Issue 2: ___________________
Severity: ___________________
Action: ___________________
```

### Decision
- [ ] **PASS** — No critical issues, proceed
- [ ] **FAIL** — Critical issues found, rollback required

---

## 📊 Monitoring (24-48h)

### Hour 1 (Immediate)
- Time: ___________________
- Error rate: ___________%
- Performance: Stable / Degraded
- User reports: _________
- Status: ✅ / ⚠️ / ❌

### Hour 6
- Time: ___________________
- Error rate: ___________%
- Performance: Stable / Degraded
- User reports: _________
- Status: ✅ / ⚠️ / ❌

### Hour 24
- Time: ___________________
- Error rate: ___________%
- Performance: Stable / Degraded
- User reports: _________
- Status: ✅ / ⚠️ / ❌

### Hour 48
- Time: ___________________
- Error rate: ___________%
- Performance: Stable / Degraded
- User reports: _________
- Status: ✅ / ⚠️ / ❌

---

## 🔙 Rollback (If Needed)

### Trigger Conditions
- [ ] System-wide crash
- [ ] Data corruption
- [ ] Security vulnerability
- [ ] Major permission bypass
- [ ] Error rate > 5%

### Rollback Execution
```bash
# Date: ___________________
# Time: ___________________
# Reason: ___________________

git checkout main
git pull origin main

# Find commit to revert
git log main --oneline -5
# Target SHA: ___________________

# Create revert
git revert <commit-sha> -m 1
# Revert SHA: ___________________

git push origin main
# Pushed at: ___________________
```

### Post-Rollback
- [ ] CI passing
- [ ] Production smoke test PASS
- [ ] System stable
- [ ] Incident report created
- [ ] Team notified

---

## 📋 Final Report

**Copy this and fill in**:

```markdown
# 🚀 STEP 5 — Production Deployment Report

## Deployment Info
- **Date**: ___________________
- **Time**: ___________________
- **Deployed by**: ___________________
- **Commit SHA**: ___________________
- **Deploy method**: merge staging → main

## Pre-Deployment
- ✅ STEP 4 complete
- ✅ CI passing on staging
- ✅ Code quality verified

## Deployment Execution
- Merge: staging → main at ___________________
- CI Status: v2-compliance ✅ PASS
- Build: ✅ PASS

## Post-Deploy Smoke Test (Production)
- ✅ Users list working
- ✅ Create user working  
- ✅ Edit user working
- ✅ Disable user working
- ✅ Permission gating correct
- ✅ Error handling graceful
- ✅ i18n (EN/TH/ZH) working

## Critical Issues
- Count: _________
- Details: ___________________
- Rollback: Yes / No

## Monitoring (24-48h)
- Error rate: ___________%
- Performance: Stable / Degraded
- User reports: _________
- Issues: ___________________

## Status
**STEP 5 — COMPLETE** ✅  
**Users V2 — LIVE IN PRODUCTION** 🚀

## Notes
___________________
___________________
___________________
```

---

## ✅ Completion Criteria

STEP 5 ถือว่า COMPLETE เมื่อ:
- [x] Code merged to main
- [x] CI passing on main
- [x] Production smoke test PASS (core 10 scenarios)
- [x] No critical issues in monitoring window
- [x] Final report submitted

---

**When all checked** → **Phase 17 CLOSED** ✅
