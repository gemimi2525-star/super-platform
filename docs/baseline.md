# Baseline Registry — APICOREDATA Platform

> **Source of Truth** for production baseline versioning and 4-layer parity control.
> Updated only during canonical closeout ceremonies.

---

## Current Baseline

| Field | Value |
|:---|:---|
| **Tag** | `v0.44.2` |
| **SHA** | `3e48b6d` |
| **LockedTag** | `v0.44.2` |
| **Phase** | `44` |
| **Version** | `v0.44.2` |
| **Frozen At** | 2026-02-20 |
| **Kernel Frozen** | `true` |
| **Hash Valid** | `true` |
| **Last Phase Landed** | Phase 15B — True Multitasking (SHA-256 argsHash + Focus De-dupe) |

---

## 4-Layer Parity Requirements

Every production-bound release must satisfy parity across **all 4 layers**:

| Layer | Source | Verification Method |
|:---|:---|:---|
| **① Local** | `git rev-parse --short HEAD` | Terminal output |
| **② GitHub** | `origin/main` | `git log -1 --oneline` after push |
| **③ Vercel** | Deployment dashboard | Screenshot: `Ready` + `Current` badge + SHA |
| **④ Production** | `/api/platform/integrity` | JSON: `sha`, `lockedTag`, `status: OK`, `kernelFrozen: true` |

### Evidence Required (Mandatory)
- ✅ Production integrity JSON screenshot (sha + lockedTag + status)
- ✅ Vercel deployment screenshot (Ready/Current + commit SHA)
- ✅ Terminal output of `git log -1 --oneline` showing tag + SHA alignment

---

## When Baseline Changes — Procedure

### Step 1: Tag Bump
```bash
# Verify local HEAD matches deployed SHA
git checkout main && git pull
git rev-parse --short HEAD  # Must match expected SHA

# Create annotated tag
git tag -a v{NEW_VERSION} -m "Baseline freeze after {PHASE_NAME} @ {SHA}"
git push origin v{NEW_VERSION}
```

### Step 2: Version Alignment
```bash
# Update package.json version to match tag
# This makes getLockedTag() fallback return the correct value
# File: package.json → "version": "{NEW_VERSION_WITHOUT_V}"
```

### Step 3: Commit + Deploy
```bash
git add package.json
git commit -m "chore: bump version to {NEW_VERSION} — baseline freeze after {PHASE_NAME}"
git push origin main
```

### Step 4: Re-stamp Parity Table
After Vercel deploys (wait ~90s), verify:
1. `curl https://www.apicoredata.com/api/platform/integrity` → `lockedTag = v{NEW_VERSION}`
2. Vercel dashboard → Latest deployment shows `Ready` + `Current`
3. Tag points to HEAD: `git log -1 --oneline` → `{SHA} (HEAD -> main, tag: v{NEW_VERSION})`

### Step 5: Update This Document
Update the "Current Baseline" table above with the new values.

---

## Baseline History

| Tag | SHA | Phase | Date | Notes |
|:---|:---|:---|:---|:---|
| `v0.44.2` | `3e48b6d` | 15B Pre-Prod Harden | 2026-02-20 | SHA-256 argsHash + focus de-dupe |
| `v0.44.1` | `65ce3ab` | — | 2026-02-20 | Dock fix (eliminate fade) |
| `v0.44.0` | — | 44 | 2026-02-19 | Phase 44 release |

---

## Technical Details

### How LockedTag Works
```
getLockedTag() in lib/ops/integrity/getIntegrity.ts:
  1. Check env: process.env.COREOS_LOCKED_TAG
  2. Fallback: v{package.json version}
→ Changing package.json version = changing lockedTag
```

### Integrity Contract
The integrity endpoint validates:
- **Build SHA**: `VERCEL_GIT_COMMIT_SHA` (set by Vercel at build time)
- **LockedTag**: `getLockedTag()` (from package.json version)
- **Kernel Frozen**: Governance check (must be `true`)
- **Hash Valid**: Governance hash check (must be `true`)
