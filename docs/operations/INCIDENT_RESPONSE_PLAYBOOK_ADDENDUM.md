# 🚨 INCIDENT RESPONSE PLAYBOOK ADDENDUM
**APICOREDATA Core OS v1.0-production**  
**Scope**: First 24 Hours Post-Launch  
**Date**: 2026-02-01

---

## Overview

This addendum supplements the main Emergency Playbooks (`docs/enterprise/EMERGENCY_PLAYBOOKS.md`) with **specific procedures for the first 24 hours** after production launch.

**Key Differences from Standard Playbooks**:
- Lower thresholds for action (more cautious)
- Faster escalation (all hands on deck)
- Mandatory Platform Owner involvement for critical decisions
- Decision trees for common Day 0 scenarios

---

## GENERAL DAY 0 PRINCIPLES

### 1. When in Doubt, Escalate
- Unsure if an issue is critical? **Escalate immediately**
- Better to over-communicate than under-communicate

### 2. Preserve Evidence
- **DO NOT** delete logs, restart services, or modify data without approval
- Capture screenshots, logs, metrics **before** any mitigation

### 3. Communicate Proactively
- Post updates to `#prod-launch` every 30 minutes during active incidents
- Even if "no update" — say so

### 4. Rollback is Safe
- Blue environment (old) is still running for 24 hours
- **Rollback is instant** — use it if needed (see `ROLLBACK_BLUE_GREEN.md`)

---

## SCENARIO 1: AUDIT LOGS NOT WRITING

### Symptoms
- No new audit logs in Firestore for 5+ minutes (during active use)
- Alert: "Audit Log Gap" triggered
- Users can still use the app, but actions aren't logged

### Severity: **P0 (CRITICAL)** — Governance Integrity Compromised

---

### Decision Tree

```
Audit logs not writing
    ↓
Is Firestore reachable?
    ├─ YES → Go to Section 1.1
    └─ NO → Go to Section 1.2
```

---

### Section 1.1: Firestore Reachable (Audit Service Issue)

#### Step 1: Verify Problem Scope
- [ ] **Check last successful audit log**
  ```javascript
  // Firestore query
  db.collection('audit_logs')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get()
  ```
  - Last log timestamp: ________________
  - Expected: Within last 5 minutes if users active

- [ ] **Check server logs for errors**
  ```bash
  # Look for audit service errors
  grep "audit" /var/log/app.log | tail -50
  ```
  - Errors found: Yes / No
  - Error message: ________________

#### Step 2: Immediate Action (DO NOT DELAY)

**DECISION POINT**: 
- **If error is clear and fixable** (e.g., config typo) → Go to Step 3
- **If error is unclear or widespread** → **ENABLE READ-ONLY MODE IMMEDIATELY**

**Enable Read-only Mode**:
1. Login as Platform Owner
2. Navigate: System Configure → System Mode
3. Select: "Read-only"
4. Confirm + Step-up
5. **Rationale**: Prevents further actions from going unlogged

#### Step 3: Investigate & Fix
- [ ] **Common Issues**:
  - Firestore permissions changed? Check IAM rules
  - Audit service crashed? Check process status
  - Network issue? Check connectivity to Firestore
  - Code bug? Check recent deployment changes

- [ ] **Fix applied**: ________________
- [ ] **Verification**: New audit log written after fix

#### Step 4: Backfill Missing Logs (If Possible)
- [ ] **Identify gap**:
  - Start time: ________________
  - End time: ________________
  - Actions taken during gap: ________________

- [ ] **Manual backfill** (if possible):
  - Reconstruct events from application logs
  - Write manual audit logs with note: "Backfilled post-incident"

#### Step 5: Exit Read-only Mode
- [ ] **After verification**:
  - Audit logs writing: ✓
  - System stable: ✓
  - Backfill complete (if done): ✓
  
- [ ] **Exit Read-only**:
  - System Configure → Normal Mode
  - Step-up required

#### Step 6: Post-Incident
- [ ] **Document**:
  - Gap duration: ________________
  - Missing logs: ________ (estimated)
  - Backfilled: Yes / No / Partial
  - Root cause: ________________

- [ ] **Notify**: Platform Owner, Governance Lead

---

### Section 1.2: Firestore Unreachable

#### Step 1: Verify Outage
- [ ] **Check Firebase Status**:
  - URL: https://status.firebase.google.com
  - Status: Operational / Degraded / Outage

- [ ] **Check local connectivity**:
  ```bash
  curl -I https://firestore.googleapis.com
  ```
  - Response: ________________

#### Step 2: Immediate Action

**If Firebase Outage (confirmed)**:
1. **DO NOT enable Read-only** (would make things worse)
2. **Communicate**:
   - Post to `#prod-launch`: "Firestore outage detected (per Firebase status). Monitoring for resolution."
   - Post to status page (if external users): "Temporary service disruption due to infrastructure provider."

3. **Wait for resolution** (no action possible)

**If Local Connectivity Issue**:
1. **Check network**:
   - VPC rules
   - Firewall
   - DNS resolution

2. **Fix if possible**, otherwise escalate to infrastructure team

#### Step 3: Post-Resolution
- [ ] **Verify Firestore reachable**
- [ ] **Verify audit logs resume writing**
- [ ] **Check for data loss** (gap in logs)
- [ ] **Document incident**

---

## SCENARIO 2: STEP-UP AUTHENTICATION ISSUES

### Symptoms
- Users report "Step-up failed" errors
- Step-up modal appears in endless loop
- Step-up success rate <95%

### Severity: **P1 (HIGH)** — Major Feature Degraded

---

### Decision Tree

```
Step-up issues reported
    ↓
What type of issue?
    ├─ Endless loop → Go to Section 2.1
    ├─ Verification failing → Go to Section 2.2
    └─ Session not persisting → Go to Section 2.3
```

---

### Section 2.1: Endless Loop

#### Symptoms
- User enters password
- Modal closes then immediately reopens
- Audit logs show: `stepup.request` → `stepup.verify` → `stepup.request` (repeating)

#### Root Cause (Likely)
- Session storage not working (in-memory state lost)
- Client-server state mismatch

#### Immediate Action

**Step 1: Verify Session Storage**
- [ ] **Check browser console** (user-side):
  - Errors related to state management?
  - `useStepUpAuth` hook errors?

**Step 2: Workaround** (if widespread)
- [ ] **Temporary Fix**: Disable step-up requirement
  - **WARNING**: This is a security degradation
  - **Only if**: >50% of users affected AND no other option
  - **How**:
    1. System Configure → Global Security → Enforce Step-up: OFF
    2. **Immediate communication**: "Temporarily disabled step-up due to technical issue. Investigating."

**Step 3: Root Cause Analysis**
- [ ] Check recent code changes
- [ ] Test step-up flow in staging
- [ ] Identify fix

**Step 4: Deploy Fix**
- [ ] Fix deployed
- [ ] Test in production
- [ ] Re-enable step-up enforcement

---

### Section 2.2: Verification Failing

#### Symptoms
- User enters correct password
- Verification fails ("Invalid password" or error)
- Audit logs show: `stepup.verify` with `decision: DENY` (but should be ALLOW)

#### Root Cause (Likely)
- Firebase Auth API issue
- Password comparison logic bug

#### Immediate Action

**Step 1: Verify Firebase Auth**
- [ ] **Check Firebase Status**: https://status.firebase.google.com
- [ ] **Test manual sign-in**: Can Owner sign in normally?

**Step 2: Check Logs**
- [ ] **Server logs**: Errors during password verification?
  ```bash
  grep "stepup.verify" /var/log/app.log | tail -50
  ```

**Step 3: Mitigation**
- **If Firebase issue**: Wait for resolution, communicate to users
- **If bug**: Rollback to Blue environment (see `ROLLBACK_BLUE_GREEN.md`)

---

### Section 2.3: Session Not Persisting

#### Symptoms
- User completes step-up successfully
- Closes browser or refreshes page
- Step-up session lost (must re-verify immediately)

#### Root Cause (Known Limitation)
- Client-side state (in-memory only)
- Expected behavior (see `SECURITY_HARDENING_AUDIT.md`)

#### Immediate Action

**This is EXPECTED behavior** (client-side state limitation)

- [ ] **Verify it's the known limitation**:
  - Session persists within same browser session? Yes = Expected
  - Session lost on hard refresh? Yes = Expected

- [ ] **Communication**:
  - If users complaining: "This is expected behavior due to security design. Session expires on page refresh for maximum security."
  - Document in FAQ if needed

**No technical action required** (unless excessive user complaints, then consider future enhancement)

---

## SCENARIO 3: FIRESTORE OUTAGE

### Symptoms
- All database operations failing
- Error rate spike (>10%)
- Firebase Status: Outage

### Severity: **P0 (CRITICAL)** — Service Down

---

### Immediate Action

#### Step 1: Confirm Outage
- [ ] **Firebase Status**: https://status.firebase.google.com
  - Status: ________________
  - ETA: ________________

- [ ] **Test direct connection**:
  ```bash
  curl -I https://firestore.googleapis.com
  ```
  - Response: ________________

#### Step 2: Communication (Immediate)

**Internal** (`#prod-launch`):
```
[P0] Firestore Outage Detected
Status: Confirmed (per Firebase status page)
Impact: All users unable to access system
ETA: [Per Firebase status or "Unknown"]
Action: Monitoring for resolution
Next Update: Every 15 minutes
```

**External** (Status page, if applicable):
```
Service Disruption
Our infrastructure provider (Google Cloud Firestore) is experiencing an outage.
We are monitoring the situation and service will resume once the issue is resolved.
Updates: [Link to status page]
```

#### Step 3: DO NOT

- ❌ **DO NOT enable Read-only Mode** (makes it worse)
- ❌ **DO NOT restart services** (won't help)
- ❌ **DO NOT rollback** (Blue environment has same issue)

#### Step 4: Monitor

- [ ] **Check Firebase status every 5 minutes**
- [ ] **Post update every 15 minutes** (even if no change)

#### Step 5: Post-Resolution

- [ ] **Verify service restored**:
  - Health check: `curl https://[DOMAIN]/api/health`
  - Manual test: Login, view users, etc.

- [ ] **Check for data integrity**:
  - Any data loss during outage?
  - Audit logs gap? (Expected during outage)

- [ ] **Communication**:
  - "Service restored. All systems operational."

- [ ] **Post-mortem** (required for P0):
  - Schedule within 48 hours
  - Review impact, response, learnings

---

## SCENARIO 4: SUSPICIOUS SESSION COMPROMISE

### Symptoms
- Alert: "Suspicious Session" (multiple step-ups from same IP in <5min)
- Audit logs show unusual pattern:
  - Many failed sign-ins followed by success
  - Step-up verifications from unusual location
  - Unusual activity (e.g., creating many users rapidly)

### Severity: **P1 (HIGH)** — Potential Security Incident

---

### Decision Tree

```
Suspicious activity detected
    ↓
Is it confirmed malicious?
    ├─ YES → Go to Section 4.1 (Incident Response)
    └─ UNSURE → Go to Section 4.2 (Investigation)
```

---

### Section 4.1: Confirmed Malicious Activity

#### Immediate Action (DO NOT DELAY)

**Step 1: Soft Disable** (Emergency Shutdown)
1. Login as Platform Owner
2. System Configure → Emergency Controls → Soft Disable: **ON**
3. Step-up required
4. **Effect**: All new operations blocked, in-flight operations complete

**Step 2: Revoke Compromised Session**
- [ ] **Identify compromised account** (from audit logs):
  - User ID: ________________
  - Email: ________________

- [ ] **Disable user account** (Firebase Console):
  - Auth → Users → [User] → Disable

- [ ] **Revoke all sessions** (if possible):
  - Firebase Auth → Revoke refresh tokens

**Step 3: Forensic Capture**
- [ ] **Export audit logs** (full, unfiltered):
  ```javascript
  db.collection('audit_logs')
    .where('timestamp', '>=', [INCIDENT_START])
    .where('timestamp', '<=', [INCIDENT_END])
    .get()
    .then(snapshot => {
      // Save to file
    })
  ```

- [ ] **Capture server logs**:
  ```bash
  # Last 1 hour
  tail -n 10000 /var/log/app.log > incident_logs_$(date +%s).txt
  ```

**Step 4: Assess Damage**
- [ ] **What actions did attacker take?**
  - Users created: ________ (check audit logs for `users.create`)
  - Orgs created: ________ (check for `orgs.create`)
  - Data modified: ________________
  - Data deleted: ________________

- [ ] **Data integrity check**:
  - Any malicious data? (e.g., fake users, orgs)
  - Any data corruption?

**Step 5: Remediation**
- [ ] **Remove malicious data** (if any):
  - Delete fake users
  - Delete fake orgs
  - Document all changes

- [ ] **Reset compromised account** (if re-enabling):
  - Force password reset
  - Enable MFA (mandatory)
  - Review permissions

**Step 6: Disable Soft Disable** (after remediation)
- [ ] **Verify system clean**
- [ ] **System Configure → Soft Disable: OFF**
- [ ] **Communicate**: "Incident resolved, service restored"

**Step 7: Post-Incident** (Required)
- [ ] **Security review** (within 24h)
- [ ] **Incident report** (full timeline, actions, damage)
- [ ] **Notify authorities** (if required by regulation)

---

### Section 4.2: Investigation (Not Confirmed)

#### Step 1: Verify Legitimacy
- [ ] **Check with user**:
  - Contact user (email/phone)
  - "We noticed unusual activity. Was this you?"

- [ ] **Check IP/Location**:
  - Does it match user's known location?
  - VPN or proxy?

#### Step 2: If Legitimate
- [ ] **Document**: False positive, user confirmed activity
- [ ] **Tune alert**: Adjust threshold if too sensitive

#### Step 3: If Cannot Confirm
- [ ] **Precautionary measures**:
  - Force user to change password
  - Enable MFA (if not already)
  - Monitor closely for 24h

---

## SCENARIO 5: ROLLBACK NEEDED

### When to Rollback (Day 0 Thresholds - More Cautious)

**IMMEDIATE ROLLBACK if**:
- ❌ Error rate >5% sustained for 10+ minutes
- ❌ P0 incident (service completely down)
- ❌ Data corruption detected
- ❌ Governance integrity compromised (audit logs not writing)
- ❌ Security breach confirmed

**CONSIDER ROLLBACK if**:
- ⚠️ Error rate 1-5% sustained for 30+ minutes
- ⚠️ P1 incident with no clear fix in sight
- ⚠️ Performance degradation (P95 >2s sustained)
- ⚠️ Multiple P2 incidents accumulating

**DECISION MAKER**: Platform Owner (must approve rollback)

---

### Rollback Procedure

**See**: `ROLLBACK_BLUE_GREEN.md` for full procedure

**Quick Steps**:
1. [ ] **Approval**: Platform Owner confirms rollback
2. [ ] **Communication**: "Rolling back to previous version due to [REASON]"
3. [ ] **Traffic switch**: 100% Green → 100% Blue (instant)
4. [ ] **Verify**: Health check on Blue
5. [ ] **Monitor**: Confirm issues resolved
6. [ ] **Post-rollback**: Investigate, fix Green, prepare redeployment

---

## DECISION TREES SUMMARY

### Quick Reference

| Symptom | First Action | Playbook Section |
|---------|--------------|------------------|
| Audit logs not writing | Check Firestore reachable | Scenario 1 |
| Step-up endless loop | Check browser console | Scenario 2.1 |
| Step-up failing | Check Firebase Auth | Scenario 2.2 |
| Firestore outage | Confirm via status page | Scenario 3 |
| Suspicious activity | Assess if malicious | Scenario 4 |
| Need to rollback | Get Owner approval | Scenario 5 |

---

## COMMUNICATION TEMPLATES

### P0 Incident (Initial)
```
🚨 [P0] [TITLE]
Status: Investigating
Impact: [Brief description, user impact]
Start: [HH:MM UTC]
Team: [Names] responding
Next Update: [+15min]
```

### P0 Incident (Update)
```
🚨 [P0] [TITLE]
Status: [Investigating / Mitigating / Resolved]
Update: [What we know, what we're doing]
Impact: [Current user impact]
Next Update: [+15min]
```

### P0 Incident (Resolved)
```
✅ [P0] [TITLE] RESOLVED
Resolution: [What fixed it]
Duration: [Total time]
Impact: [Final assessment]
Post-mortem: [Date/time scheduled]
```

---

## ESCALATION (DAY 0 SPECIFIC)

### Faster Escalation Thresholds

**Day 0 (First 24h)**:
- P0: Immediate → All team members notified
- P1: 5 minutes → Platform Owner notified (vs 15min standard)
- P2: 15 minutes → Operations Lead notified (vs 1h standard)

### All Hands Protocol

**When to invoke** (Day 0 only):
- Any P0 incident
- Multiple P1 incidents simultaneously
- Rollback decision needed

**How**:
1. Post in `#prod-launch`: "@channel All hands - [BRIEF DESCRIPTION]"
2. Start video call (link in channel description)
3. All team members join (regardless of on-call status)

---

## POST-INCIDENT CHECKLIST

After any incident on Day 0:

- [ ] **Incident logged**:
  - Severity: ________
  - Duration: ________
  - Resolution: ________________

- [ ] **Communication sent**:
  - Internal: ✓
  - External (if applicable): ✓

- [ ] **Root cause identified**: ________________

- [ ] **Fix applied**: ________________

- [ ] **Verification complete**: System healthy

- [ ] **Documentation updated**:
  - Incident report: ✓
  - Runbook updates (if needed): ✓

- [ ] **Post-mortem scheduled** (if P0/P1): Date: ________

---

**Prepared by**: Operations Team + Security Team  
**Approved by**: Platform Owner  
**Date**: 2026-01-31  
**Valid**: First 24 hours post-launch (2026-02-01)  
**After 24h**: Revert to standard `EMERGENCY_PLAYBOOKS.md`
