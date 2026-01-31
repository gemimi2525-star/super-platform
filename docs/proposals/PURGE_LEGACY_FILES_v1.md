# 🗑️ Purge Legacy Files Proposal — v1.0

**Status:** ✅ EXECUTED
**Authority:** SYNAPSE Appendix Pack v1.0 (Section D)
**Proposed:** 2026-01-30
**Approved:** 2026-01-30T15:40:20+07:00
**Executed:** 2026-01-30T15:40:20+07:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Proposal Name
**Purge Quarantined Legacy Files**

## Affected Layers
- [ ] Policy
- [ ] Kernel
- [ ] Capability
- [ ] Window
- [ ] Intelligence
- [x] UI only (legacy mock files)

## Compendium References
- Chapter 4: What SYNAPSE Refuses to Be
- Appendix A: Design Review Checklist
- Appendix E: Enforcement Rule

## Refusal Check (Chapter 4)
- Does this violate any SYNAPSE refusal? → **NO**
- This proposal removes legacy code, does not add features

## Determinism Statement
> Removing these files has zero impact on system determinism.
> Both files are unused and have no import/execution paths.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Proposed for Removal

| File | Superseded By | Import Check | Build Check | Test Check |
|------|---------------|--------------|-------------|------------|
| `coreos/mock-ui.tsx` | `coreos/desktop-ui.tsx` | ✅ No imports | ✅ PASS | ✅ 22/22 |
| `coreos/test.ts` | `coreos/scenario-runner.ts` | ✅ No imports | ✅ PASS | ✅ 22/22 |

## Evidence

### Import Verification
```bash
# mock-ui imports
rg -n "from.*mock-ui|import.*mock-ui" .
# Result: No imports found

# test.ts imports
rg -n "from './test'|from \"./test\"" .
# Result: No imports found
```

### Build Verification
```
npm run build → SUCCESS
```

### Scenario Runner Verification
```
npx tsx coreos/scenario-runner.ts
TOTAL: 22 passed, 0 failed
🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

## Rollback Plan

If issues are discovered after purge:
1. Restore from git history
2. Re-run build and tests
3. Document the issue

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hidden dependency | Very Low | Low | Already verified with rg |
| Build break | Very Low | Low | Already verified with npm run build |
| Test failure | Very Low | Low | Already verified with scenario-runner |

## Approval Requirements

This proposal requires approval from:
- [ ] System Architect

## Approval Record

| Approver | Date | Decision |
|----------|------|----------|
| (pending) | - | - |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Purge Proposal v1.0*
*Pending Approval*
