# Global Verification Policy v1

> **Status**: ENFORCED  
> **Effective Date**: 2026-02-06  
> **Scope**: All Phases, Features, and Fixes  
> **Authority**: APICOREDATA Platform Governance

---

## 🔐 THE RULE

**Every Phase, Feature, or Fix is considered COMPLETE only when it has:**

### 1. Browser Subagent Verification ✅
- Must use production URL (e.g., `https://apicoredata.com`)
- Must test actual user-facing behavior
- Must capture screenshots or recordings as evidence

### 2. Action Documentation ✅
- Specify exact steps performed
- Document expected vs. actual results
- Include console logs if relevant

### 3. Scope Clarity ✅
- State what was tested
- State what was NOT tested (if applicable)
- Explain any limitations or assumptions

---

## ❌ REJECTED COMPLETION CRITERIA

The following do **NOT** constitute valid completion:

- ❌ **Logic-only verification** (code review without browser testing)
- ❌ **"Should work" statements** (without actual testing)
- ❌ **Backend-only tests** (without UI verification)
- ❌ **Local testing only** (without production verification)
- ❌ **No evidence** (no screenshots or recordings)

---

## 📋 VERIFICATION CHECKLIST

Before marking any work as COMPLETE, verify:

```
[ ] Deployed to production
[ ] Browser subagent accessed production URL
[ ] Screenshots/recordings captured
[ ] All user-facing features tested
[ ] Console logs checked (if applicable)
[ ] Error states tested (if applicable)
[ ] Edge cases documented
[ ] Evidence attached to report
```

---

## 🎯 EXAMPLES

### ✅ ACCEPTABLE Verification

**Example 1: Phase 16 Calculator**
```
Production URL: https://apicoredata.com/os
Actions Tested:
1. Clicked "Launch Calculator" → window opened
2. Clicked 7, +, 3, = → display showed "10"
3. Clicked copy button → notification appeared
4. Opened TaskManagerV2 → saw os.calculator RUNNING
5. Closed calculator → process TERMINATED

Evidence: 4 screenshots + console logs
Not Tested: Multi-app concurrency, crash recovery

Verdict: ✅ COMPLETE
```

**Example 2: Display Overflow Fix**
```
Production URL: https://apicoredata.com/os
Test: Calculated 999999999 × 999999999
Result: Display showed "9.999998e+17" (scientific notation)
Font scaled down dynamically
No text overflow observed

Evidence: Screenshot showing long number
Not Tested: All possible overflow scenarios

Verdict: ✅ COMPLETE
```

### ❌ REJECTED Verification

**Example 1: No Browser Testing**
```
Feature: New button component
Evidence: "Code looks good, should work"
Test: None

Verdict: ❌ INCOMPLETE - No browser verification
```

**Example 2: Local Only**
```
Feature: Authentication flow
Evidence: "Works on localhost:3000"
Production: Not tested

Verdict: ❌ INCOMPLETE - No production verification
```

**Example 3: No Evidence**
```
Feature: Calculator app
Evidence: "I tested it and it works"
Screenshots: None

Verdict: ❌ INCOMPLETE - No evidence captured
```

---

## 🔧 ENFORCEMENT

### Code Review
- PRs must include verification evidence in description
- Reviewers must confirm browser testing was performed
- No merge without production verification

### Phase Completion
- Phase cannot be frozen without browser evidence
- Final reports must include production screenshots
- Walkthrough artifacts must embed evidence

### Feature Flags
- New features behind flags until browser-verified
- Flag removal requires production evidence
- Rollback if production issues discovered

---

## 📸 EVIDENCE STANDARDS

### Screenshots
- Must show production URL in address bar
- Must show relevant UI state
- Must be clearly labeled (what is being shown)
- Acceptable formats: PNG, WebP, JPEG

### Recordings
- Must capture full user flow
- Must show production environment
- Must be timestamped
- Acceptable formats: WebP video, MP4, WebM

### Console Logs
- Must show relevant messages
- Must include timestamps
- Must show no critical errors (or explain if expected)
- Format: Text snippet or screenshot

---

## 🚫 EXCEPTIONS

The following work types may skip browser verification:

1. **Backend-only changes** (API refactoring with no UI impact)
   - BUT: Must have API testing evidence (Postman, curl, etc.)

2. **Documentation updates** (no code changes)
   - BUT: Must verify docs render correctly on production site

3. **Infrastructure changes** (build scripts, CI/CD)
   - BUT: Must verify successful production deployment

4. **Emergency hotfixes** (critical production issues)
   - BUT: Must perform retroactive verification within 24 hours

---

## 📊 COMPLIANCE TRACKING

### Per Phase
- Track verification status in phase report
- Include evidence count (screenshots + recordings)
- Document any incomplete verification with justification

### Per Quarter
- Review verification compliance across all phases
- Identify patterns in missed verification
- Update policy if needed

---

## ✅ CANONICAL STATEMENT

> **Browser-based production verification is mandatory for all user-facing work.  
> No Phase or Feature is complete without evidence.**

---

## 📚 REFERENCES

- [Phase 16 Final Report](../PHASE_16_FINAL_REPORT.md) — Example of compliant verification
- [Browser Subagent Guide](./BROWSER_SUBAGENT_USAGE.md) — How to capture evidence
- [Evidence Standards](./EVIDENCE_STANDARDS.md) — Screenshot/recording requirements

---

**Approved By**: APICOREDATA Platform Team  
**Effective**: 2026-02-06  
**Version**: 1.0.0
