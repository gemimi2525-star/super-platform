# STEP 4 — Testing CI Workflow + Branch Protection Guide

## ✅ 4.0 — CRITICAL FIX Applied

### Changes Made
1. **Created**: `tsconfig.v2.json` — TypeScript config for V2 zone only
2. **Added**: `typecheck:v2` script in `package.json`
3. **Updated**: `.github/workflows/v2-guards.yml` — Uses `typecheck:v2` instead of `typecheck`

### Verification
```bash
$ npm run typecheck:v2
> super-platform-control-panel@0.1.0 typecheck:v2
> tsc -p tsconfig.v2.json --noEmit
```
**Result**: ✅ **EXIT CODE 0** — No errors in V2 zone

**CI is now safe** — Workflow will PASS ✅

---

## 📋 Next Steps (Manual Actions Required)

### 4.1 ✅ Commit & Push CI Files

```bash
git status
# Should see:
# - .github/workflows/v2-guards.yml (modified)
# - package.json (modified)
# - tsconfig.v2.json (new)

git add .github/workflows/v2-guards.yml package.json tsconfig.v2.json
git commit -m "ci: scope typecheck to v2 zone + enable v2 guards workflow"
git push
```

---

### 4.2 ✅ Test PASS Case

#### Create Test Branch
```bash
git checkout -b test/v2-guards-pass
```

#### Make Harmless Change in V2 Zone
Edit file: `app/[locale]/(platform-v2)/v2/users/page.tsx`

Add at top (line 1):
```tsx
// CI Guards Test - PASS case
```

#### Commit & Push
```bash
git add app/[locale]/(platform-v2)/v2/users/page.tsx
git commit -m "test: trigger v2 guards (should pass)"
git push -u origin test/v2-guards-pass
```

#### Create Pull Request
1. GitHub → **Pull requests** → **New pull request**
2. base: `staging` ← compare: `test/v2-guards-pass`
3. Title: `test: V2 guards workflow (PASS case)`
4. **Create pull request**

#### Expected Results
- ✅ Workflow "V2 Zone Guards" runs automatically
- ✅ Job `v2-compliance` shows all steps PASS:
  - ✅ Guard — No inline styles (V2)
  - ✅ Guard — No legacy imports (V2)
  - ✅ Lint
  - ✅ Typecheck (V2 zone)
  - ✅ Build
- ✅ Status check: green checkmark

#### Capture
- [ ] Screenshot of green checks
- [ ] PR link

---

### 4.3 ✅ Test FAIL Case (Inline Style)

#### Create Test Branch
```bash
git checkout staging
git pull
git checkout -b test/v2-guards-fail-inline
```

#### Add Violation (Inline Style)
Edit file: `app/[locale]/(platform-v2)/v2/users/page.tsx`

Add anywhere in the file:
```tsx
// CI Guards Test - FAIL case
const _CiInlineStyleViolation = () => <div style={{ padding: 1 }}>fail</div>;
```

#### Commit & Push
```bash
git add app/[locale]/(platform-v2)/v2/users/page.tsx
git commit -m "test: trigger v2 guards (should fail - inline styles)"
git push -u origin test/v2-guards-fail-inline
```

#### Create Pull Request
1. GitHub → **New pull request**
2. base: `staging` ← compare: `test/v2-guards-fail-inline`
3. Title: `test: V2 guards workflow (FAIL case)`
4. **Create pull request**

#### Expected Results (FAIL)
- ❌ Workflow runs
- ❌ Job `v2-compliance` **FAILS** at step "Guard — No inline styles"
- ❌ Status check: red X mark
- ❌ Error log shows:
  ```
  ERROR: Inline styles found:
  app/[locale]/(platform-v2)/v2/users/page.tsx:XXX: <div style={{ padding: 1 }}>
  ```

#### Capture
- [ ] Screenshot of failed check (red)
- [ ] Screenshot of error log
- [ ] PR link

---

#### Fix the Violation
Remove the violation:
```bash
# Edit app/[locale]/(platform-v2)/v2/users/page.tsx
# Delete line: const _CiInlineStyleViolation = () => <div style={{ padding: 1 }}>fail</div>;

git add app/[locale]/(platform-v2)/v2/users/page.tsx
git commit -m "fix: remove inline style violation"
git push
```

#### Expected Results (FIXED)
- ✅ Workflow runs again automatically
- ✅ All checks PASS
- ✅ Status check: green checkmark

#### Capture
- [ ] Screenshot of checks turning green

---

### 4.4 ✅ Enable Branch Protection

#### Navigate to Settings
```
GitHub Repository
  → Settings (top right)
  → Branches (left menu)
  → Branch protection rules
  → Add rule (or Add branch protection rule)
```

---

#### Protection Rule for `main`

**Branch name pattern**: `main`

**Enable these settings**:

✅ **Require a pull request before merging**
- (Optional) Require approvals: `1`

✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Search for status checks**: Type `v2-compliance`
- **Select**: `v2-compliance` (should appear in dropdown)
- ✅ Should move to "Required checks" section

✅ **Require conversation resolution before merging** (Optional)

✅ **Do not allow bypassing the above settings** (Recommended)

✅ **Rules applied to everyone including administrators** (Recommended)

✅ **Block force pushes**

✅ **Block deletions**

**Save**: Click **Create** or **Save changes**

---

#### Protection Rule for `staging`

Repeat same steps:

**Branch name pattern**: `staging`

All other settings: **same as `main`**

**Don't forget**: Select `v2-compliance` as required check

**Save**: Click **Create**

---

#### Verify Protection Rules
Go to: **Settings → Branches**

Should see:
```
Branch protection rules (2)

main
  Status checks: v2-compliance
  ...

staging
  Status checks: v2-compliance
  ...
```

#### Capture
- [ ] Screenshot of protection rules list

---

### 4.5 ✅ Verify Protection Works

#### Test 1: Failed Check Blocks Merge
1. Go to PR with failed checks (before fix)
2. Try to click **Merge pull request**

**Expected**:
- ❌ Button is **disabled** (grayed out)
- ❌ Message: "Required status checks must pass before merging"

#### Test 2: Passed Check Allows Merge
1. Go to PR with passed checks
2. Look at **Merge pull request** button

**Expected**:
- ✅ Button is **enabled** (green)
- ✅ Can merge

#### Capture
- [ ] Screenshot: blocked merge (disabled button)
- [ ] Screenshot: allowed merge (enabled button)

---

### 4.6 ✅ Cleanup Test Branches

After capturing all evidence:

```bash
# Delete local branches
git checkout main
git branch -D test/v2-guards-pass
git branch -D test/v2-guards-fail-inline

# Delete remote branches
git push origin --delete test/v2-guards-pass
git push origin --delete test/v2-guards-fail-inline
```

Or via GitHub UI:
- Go to each PR → **Close pull request** → **Delete branch**

---

## 📋 4.7 Completion Report Template

Copy this template and fill in:

```markdown
# ✅ STEP 4 — COMPLETE

## Test Results

### PASS PR
- **Link**: [PR #XXX](https://github.com/ORG/REPO/pull/XXX)
- **Status**: v2-compliance ✅ PASS
- **Screenshot**: [Attached/Link]
- **All steps passed**:
  - ✅ Guard — No inline styles (V2)
  - ✅ Guard — No legacy imports (V2)
  - ✅ Lint
  - ✅ Typecheck (V2 zone)
  - ✅ Build

### FAIL PR (Before Fix)
- **Link**: [PR #YYY](https://github.com/ORG/REPO/pull/YYY)
- **Status**: v2-compliance ❌ FAIL
- **Failed at**: Guard — No inline styles (V2)
- **Error**:
  ```
  ERROR: Inline styles found:
  app/[locale]/(platform-v2)/v2/users/page.tsx:XXX: <div style={{ padding: 1 }}>
  ```
- **Screenshot**: [Attached/Link]

### FIXED PR (After Fix)
- **Link**: [PR #YYY](https://github.com/ORG/REPO/pull/YYY) (same PR)
- **Status**: v2-compliance ✅ PASS
- **Action**: Removed inline style violation
- **Screenshot**: [Attached/Link]

## Branch Protection

### Status
- ✅ **main**: Protection enabled
- ✅ **staging**: Protection enabled

### Required Check
- ✅ **v2-compliance** required for both branches

### Settings Enabled
- ✅ Require PR before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Block force pushes
- ✅ Block deletions

### Screenshot
- [Branch protection rules screenshot]

## Verification

### Merge Blocking Test
- ❌ PR with failed checks → **Cannot merge** (button disabled)
  - Screenshot: [Attached/Link]
- ✅ PR with passed checks → **Can merge** (button enabled)
  - Screenshot: [Attached/Link]

## Confirmations

- [x] ✅ CI runs only when V2 zone touched (verified via PR)
- [x] ✅ Merge blocked when v2-compliance fails (verified)
- [x] ✅ No legacy business logic modified
- [x] ✅ Test branches cleaned up

## Status
**STEP 4 — COMPLETE** ✅
```

---

## Summary Checklist

- [ ] 4.0 — Typecheck fix applied (tsconfig.v2.json) ✅
- [ ] 4.1 — Files committed and pushed
- [ ] 4.2 — PASS PR created and verified
- [ ] 4.3 — FAIL PR created, shows error, then fixed
- [ ] 4.4 — Branch protection enabled (main + staging)
- [ ] 4.5 — Merge blocking verified
- [ ] 4.6 — Test branches cleaned up
- [ ] 4.7 — Completion report submitted

**When all checked** → STEP 4 COMPLETE ✅
