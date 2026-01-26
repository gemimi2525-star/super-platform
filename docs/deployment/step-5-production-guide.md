# STEP 5 — Production Deployment Guide (Users V2)

## 🎯 Objective
Deploy **Users V2** to Production อย่างปลอดภัยหลังจาก CI/CD และ testing ผ่านครบ

---

## ✅ Pre-Deployment Checklist (MANDATORY)

**ตรวจสอบก่อนเริ่ม — ต้องครบทุกข้อ**:

- [ ] ✅ STEP 4 — Manual Testing COMPLETE
  - [ ] PASS PR verified (v2-compliance ✅)
  - [ ] FAIL PR verified (v2-compliance ❌ → fixed → ✅)
  
- [ ] ✅ Branch Protection Enabled
  - [ ] `main` → require `v2-compliance` ✅
  - [ ] `staging` → require `v2-compliance` ✅
  
- [ ] ✅ CI Workflow Verified
  - [ ] Runs automatically on V2 zone changes
  - [ ] All guards passing (inline styles, legacy imports, lint, typecheck:v2, build)
  
- [ ] ✅ Code Quality
  - [ ] V2 zone: 0 inline styles
  - [ ] V2 zone: 0 legacy imports
  - [ ] `npm run typecheck:v2` → PASS
  - [ ] `npm run build` → PASS
  
- [ ] ✅ No Legacy Modified
  - [ ] Only V2 zone code changed
  - [ ] No V1 code touched

**⚠️ STOP**: ห้ามเริ่ม STEP 5 ถ้า checklist ไม่ครบ

---

## 🧭 Deployment Strategy

**Strategy**: Safe Promotion via Git

**Flow**:
```
staging (tested) → main (production)
```

**Rules**:
- ✅ No direct push to `main`
- ✅ Deploy only after CI green
- ✅ Use merge (not rebase) for traceability

---

## 5.1 🔀 Merge to Production Branch

### Step 1: Verify Staging Clean
```bash
git checkout staging
git pull origin staging
```

**ตรวจสอบ**:
- [ ] ไม่มี uncommitted changes
- [ ] CI ผ่านหมดแล้ว (green checks)
- [ ] ไม่มี pending PRs ที่ fail

### Step 2: Update Main Branch
```bash
git checkout main
git pull origin main
```

### Step 3: Merge Staging → Main
```bash
git merge staging
```

**Expected**:
- Fast-forward merge (ถ้า main ยังไม่มีอะไรเพิ่ม)
- หรือ merge commit (ปกติ)

**ตรวจสอบ conflicts**:
- ถ้ามี conflicts → resolve carefully
- Verify no accidental changes in V1 code

### Step 4: Push to Main (Production)
```bash
git push origin main
```

**Expected**:
- ✅ GitHub Actions triggers automatically
- ✅ Workflow: "V2 Zone Guards"
- ✅ Job: `v2-compliance`
- ✅ All steps PASS

### Step 5: Verify Deployment
1. ไปที่ GitHub → Actions tab
2. ดู workflow run ล่าสุดบน `main` branch
3. ตรวจสอบ:
   - ✅ Guard — No inline styles (V2): PASS
   - ✅ Guard — No legacy imports (V2): PASS
   - ✅ Lint: PASS
   - ✅ Typecheck (V2 zone): PASS
   - ✅ Build: PASS

**Capture**:
- [ ] Screenshot workflow run (green checks)
- [ ] Commit SHA

---

## 5.2 🧪 Post-Deploy Smoke Test (Production)

**ทดสอบบน Production Environment เท่านั้น**

### Access Production
```
URL: https://your-production-domain.com/[locale]/v2/users
```

Replace `[locale]` with: `en`, `th`, or `zh`

---

### 🔍 Smoke Test Checklist

**ใช้**: [`docs/uat/users-v2-smoke.md`](file:///Users/jukkritsuwannakum/Super-Platform/docs/uat/users-v2-smoke.md)

**Core Scenarios** (เลือกเฉพาะที่สำคัญ):

#### 1. Users List (READ)
- [ ] ✅ เปิดหน้า `/v2/users` ได้
- [ ] ✅ Users list แสดงถูกต้อง
- [ ] ✅ Search / Filter / Pagination ทำงาน
- [ ] ✅ Role badges แสดงถูกต้อง (Owner/Admin/User)
- [ ] ✅ Status badges แสดงถูกต้อง (Active/Disabled)

#### 2. Permission Gating
**Owner**:
- [ ] ✅ เห็นปุ่ม: New User, Edit, Disable
- [ ] ✅ Create user ได้
- [ ] ✅ Edit user ได้
- [ ] ✅ Disable user ได้ (พร้อม typing "DISABLE")
- [ ] ✅ ปิดบัญชีตัวเองไม่ได้ (button disabled)

**Admin**:
- [ ] ✅ เห็นปุ่ม: New User, Edit
- [ ] ✅ **ไม่เห็น**: Disable button, Status field
- [ ] ✅ Create user (role=User only)
- [ ] ✅ Edit user (no status field)

**User**:
- [ ] ✅ Read-only
- [ ] ✅ **ไม่เห็น**: New User, Edit, Disable buttons

#### 3. Error Handling
- [ ] ✅ 403 → แสดง message ถูกต้องตาม action (create/edit/disable)
- [ ] ✅ 404 → "User not found"
- [ ] ✅ 409 → "Email already in use"
- [ ] ✅ 500/network → generic error (no crash)

#### 4. UX Polish
- [ ] ✅ Loading states (Creating..., Saving..., Disabling...)
- [ ] ✅ Toast notifications (success/error)
- [ ] ✅ Modal ไม่ปิดเมื่อมี error
- [ ] ✅ Empty states (if applicable)

#### 5. i18n
- [ ] ✅ EN: All text in English
- [ ] ✅ TH: All text in Thai
- [ ] ✅ ZH: All text in Chinese

---

### Post-Test Checklist
- [ ] ✅ ทุก core scenarios PASS
- [ ] ✅ ไม่มี console errors (critical)
- [ ] ✅ ไม่มี UI breaks
- [ ] ✅ ไม่มี data corruption

**ถ้ามี issues**:
- บันทึกละเอียด (screenshot, steps to reproduce)
- ประเมินความรุนแรง (Critical / Major / Minor)
- ถ้า Critical → พิจารณา rollback

---

## 5.3 📊 Production Monitoring (Initial Window)

**ช่วงเฝ้าระวัง**: 24-48 ชั่วโมงแรก

### Metrics to Watch

#### Error Rate
- **Target**: < 1%
- **Monitor**:
  - API `/api/platform/users` responses
  - 4xx vs 5xx ratio
  - No spike in errors

#### Performance
- **Page load time**: ไม่เพิ่มขึ้นอย่างมีนัยสำคัญ
- **API response time**: consistent with baseline

#### Logs
- **Check for**:
  - Auth/permission errors (403)
  - Server errors (500)
  - No sensitive data logged (passwords, tokens)

#### User Feedback
- **Monitor**:
  - Support tickets
  - User reports
  - Internal team feedback

### Monitoring Checklist
- [ ] Error rate < 1%
- [ ] No spike in 403/500
- [ ] Page load stable
- [ ] No critical user reports
- [ ] Logs clean (no secrets)

---

## 5.4 🔙 Rollback Plan (Emergency Only)

**ใช้เฉพาะ Critical Issues เท่านั้น**

### When to Rollback
- ✅ System-wide crash
- ✅ Data corruption
- ✅ Security vulnerability exposed
- ✅ Major permission bypass

**Minor issues** → แก้ไขแล้ว deploy hotfix (ไม่ rollback)

### Rollback Steps

#### 1. Identify Commit to Revert
```bash
git log main --oneline -5
# Find SHA ของ merge commit ที่ deploy ไป
```

#### 2. Create Revert
```bash
git checkout main
git pull origin main
git revert <commit-sha> -m 1
# -m 1 = revert to first parent (main branch before merge)
```

#### 3. Push Revert
```bash
git push origin main
```

**Expected**:
- CI runs again
- System returns to previous state

#### 4. Verify Rollback
- Check production: old version restored
- Smoke test: system stable

#### 5. Post-Rollback Actions
- [ ] แจ้งทีม
- [ ] บันทึก incident report
- [ ] เปิด issue tracking
- [ ] วิเคราะห์ root cause
- [ ] แก้ไขใน branch ใหม่

---

## 5.5 📋 Production Deployment Report (Required)

**ส่งรายงานนี้หลัง deploy**:

```markdown
# 🚀 STEP 5 — Production Deployment Report

## Deployment Info
- **Date**: YYYY-MM-DD
- **Time**: HH:MM (timezone)
- **Deployed by**: [Name]
- **Commit SHA**: [full SHA]
- **Branch**: main

## Pre-Deployment Verification
- ✅ STEP 4 complete
- ✅ Branch protection enabled
- ✅ CI passing on staging

## Deployment Execution
- **Merge**: staging → main
- **CI Status**: v2-compliance ✅ PASS
- **Build**: ✅ PASS
- **Deployment time**: [duration]

## Post-Deploy Smoke Test (Production)
- ✅ Users list working
- ✅ Create user working
- ✅ Edit user working
- ✅ Disable user working
- ✅ Permission gating correct
- ✅ Error handling graceful
- ✅ i18n (EN/TH/ZH) working

## Critical Issues Found
- **Count**: 0 (or list)
- **Rollback required**: No

## Monitoring (First 24h)
- **Error rate**: [X]%
- **Performance**: Stable / Degraded
- **User reports**: None / [count]
- **Issues**: None / [list]

## Status
**STEP 5 — COMPLETE** ✅  
**Users V2 — LIVE IN PRODUCTION** 🚀

## Notes
[Any additional observations]
```

---

## 🏁 Completion Criteria

**STEP 5 ถือว่า COMPLETE เมื่อ**:

- [x] ✅ Code merged to `main`
- [x] ✅ CI passing on `main`
- [x] ✅ Production smoke test PASS (core scenarios)
- [x] ✅ No critical issues in first 24h
- [x] ✅ Monitoring stable
- [x] ✅ Deployment report submitted

---

## 🎉 Final Status

**Users V2 = LIVE IN PRODUCTION** 🚀

### What's Deployed
- ✅ Users CRUD (Read, Create, Edit, Disable)
- ✅ Permission gating (Owner/Admin/User)
- ✅ i18n (EN/TH/ZH)
- ✅ Error handling
- ✅ UX polish

### Quality Guarantees
- ✅ Zero inline styles (enforced by CI)
- ✅ Zero legacy imports (enforced by CI)
- ✅ TypeScript strict (V2 zone)
- ✅ Build passing
- ✅ Branch protection (blocks bad PRs)

### Phase 17 Status
**Phase 17.1 — READ** ✅  
**Phase 17.2 — CREATE** ✅  
**Phase 17.3 — EDIT** ✅  
**Phase 17.4 — DISABLE** ✅  
**Phase 17.5 — PRODUCTION HARDENING** ✅  

**Phase 17 — CLOSED** ✅  
**Ready for Next Phase** 🚀

---

## Quick Reference

### Important Files
- Users page: `app/[locale]/(platform-v2)/v2/users/page.tsx`
- Smoke test: [`docs/uat/users-v2-smoke.md`](file:///Users/jukkritsuwannakum/Super-Platform/docs/uat/users-v2-smoke.md)
- CI workflow: `.github/workflows/v2-guards.yml`
- TypeScript config: `tsconfig.v2.json`

### Commands
```bash
# Deploy
git checkout main
git pull origin main
git merge staging
git push origin main

# Rollback
git revert <commit-sha> -m 1
git push origin main

# Verify locally
npm run typecheck:v2
npm run check:no-inline-styles:v2
npm run check:no-legacy-imports:v2
npm run build
```

---

**STEP 5 — Production Deployment Guide — Complete** ✅
