# 🚨 ON-CALL QUICK REFERENCE CARD
**APICOREDATA Core OS v1.0-production**  
**Period**: Day 0-7 (Stabilization Mode)

---

## ⚡ EMERGENCY CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| **Platform Owner** | [FILL] | [NUMBER] | [EMAIL] |
| **Ops Lead** | [FILL] | [NUMBER] | [EMAIL] |
| **Security Lead** | [FILL] | [NUMBER] | [EMAIL] |
| **On-call Primary** | [FILL] | [NUMBER] | [EMAIL] |
| **On-call Secondary** | [FILL] | [NUMBER] | [EMAIL] |

**War-room Video**: [LINK]  
**Slack**: #prod-launch, #prod-alerts

---

## 🔥 CRITICAL RULES (DAY 0-7)

### 🚫 ABSOLUTELY PROHIBITED
- ❌ **NO new features**
- ❌ **NO code refactoring**
- ❌ **NO synapse-core changes** (FROZEN)
- ❌ **NO governance logic changes**

### ✅ ALLOWED ONLY
- ✅ Bug fixes (with approval)
- ✅ Monitoring tuning
- ✅ Ops docs updates

---

## 🚨 INCIDENT RESPONSE

### Severity Levels

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| **P0** | IMMEDIATE | Page Platform Owner |
| **P1** | 15 minutes | Notify Ops Lead |
| **P2** | 1 hour | On-call handles |

---

## 📋 P0 SCENARIOS — IMMEDIATE ACTION

### SCENARIO 1: Audit Logs Not Writing ⚠️ CRITICAL

**Symptoms**: No audit logs for 5+ minutes

**IMMEDIATE ACTION**:
```
1. LOGIN as Platform Owner
2. System Configure → System Mode → "Read-only"
3. Step-up + Confirm
4. POST to #prod-launch: "[P0] Audit logs not writing. Read-only Mode enabled."
5. CHECK Firebase status: status.firebase.google.com
6. ESCALATE to Platform Owner
```

**DO NOT**:
- ❌ Wait to investigate first
- ❌ Restart services without approval

**Full Playbook**: `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md` Section 1

---

### SCENARIO 2: Security Incident Confirmed 🔒

**Symptoms**: Malicious activity confirmed (unusual logins, rapid user creation, suspicious patterns)

**IMMEDIATE ACTION**:
```
1. LOGIN as Platform Owner
2. System Configure → Emergency Controls → Soft Disable: ON
3. Step-up + Confirm
4. REVOKE compromised session (Firebase Console)
5. CAPTURE evidence (export audit logs, server logs)
6. POST to #prod-launch: "[P0] Security incident. Soft Disable active."
7. ESCALATE to Platform Owner + Security Lead
```

**DO NOT**:
- ❌ Delete evidence
- ❌ Fix things before capturing logs

**Full Playbook**: `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md` Section 4

---

### SCENARIO 3: Error Rate >5% Sustained

**Symptoms**: Dashboard shows error rate >5% for 10+ minutes

**IMMEDIATE ACTION**:
```
1. CHECK dashboards: Confirm sustained degradation
2. CHECK if Blue environment still healthy
3. POST to #prod-launch: "[P0] High error rate. Considering rollback."
4. ESCALATE to Platform Owner for rollback approval
5. IF APPROVED: Execute ROLLBACK_BLUE_GREEN.md
```

**Rollback Decision**:
- Error >5% for 10+ min = **IMMEDIATE ROLLBACK**
- Get Platform Owner approval first (unless extreme emergency)

**Full Playbook**: `ROLLBACK_BLUE_GREEN.md`

---

### SCENARIO 4: Firestore Outage 🗄️

**Symptoms**: All DB operations failing, Firebase status shows outage

**IMMEDIATE ACTION**:
```
1. CONFIRM via https://status.firebase.google.com
2. POST to #prod-launch: "[P0] Firestore outage (confirmed via Firebase status)"
3. WAIT for Google resolution
4. POST updates every 15 minutes
```

**DO NOT**:
- ❌ Enable Read-only Mode (makes it worse)
- ❌ Rollback (Blue has same issue)
- ❌ Restart services (won't help)

**Full Playbook**: `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md` Section 3

---

## 📋 P1 SCENARIOS — 15 MIN RESPONSE

### Step-up Authentication Loop

**Symptoms**: Users report step-up modal appearing endlessly

**ACTION**:
```
1. VERIFY in browser console (ask user for screenshot)
2. CHECK if >50% users affected
3. IF widespread: Consider temporary step-up disable (Platform Owner approval)
4. ESCALATE to Ops Lead + Security Lead
```

**Full Playbook**: `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md` Section 2.1

---

## 🔄 ROLLBACK CRITERIA

### IMMEDIATE Rollback
- Error rate >5% for 10+ min
- P0 incident (service down)
- Data corruption detected
- Audit logs not writing >10 min
- Security breach confirmed

### CONSIDER Rollback
- Error rate 1-5% for 30+ min
- Multiple P1 incidents
- Performance degradation (P95 >2s)

### DO NOT Rollback
- Minor UI issues
- Error rate <1%
- Single P2 incident

**Approval**: Platform Owner (always required)

**Procedure**: `ROLLBACK_BLUE_GREEN.md`

---

## 📊 MONITORING QUICK CHECK

### Healthy System (Normal)
- ✅ Error rate: <1%
- ✅ Response time (P95): <1s
- ✅ Firestore latency: <200ms
- ✅ Audit logs writing: Yes
- ✅ Active sessions: Growing

### Degraded System (Investigate)
- ⚠️ Error rate: 1-3%
- ⚠️ Response time: 1-2s
- ⚠️ Firestore latency: 200-500ms

### Critical System (P0)
- 🚨 Error rate: >3%
- 🚨 Response time: >2s
- 🚨 Firestore unreachable
- 🚨 Audit logs NOT writing

**Dashboard URLs**:
- Primary: [LINK]
- Governance: [LINK]
- Firebase Console: [LINK]

---

## 💬 COMMUNICATION TEMPLATES

### P0 Initial
```
🚨 [P0] [TITLE]
Status: Investigating
Impact: [Description]
Start: [HH:MM UTC]
Team: [Names] responding
Next Update: [+15min]
```

### P0 Update (every 15 min)
```
🚨 [P0] [TITLE]
Status: [Investigating / Mitigating / Resolved]
Update: [What we know, what we're doing]
Next Update: [+15min]
```

### P0 Resolved
```
✅ [P0] [TITLE] RESOLVED
Resolution: [What fixed it]
Duration: [Total time]
Post-mortem: [Date scheduled]
```

---

## 🔍 SANITY CHECKS

### Every Hour (Day 0)
```bash
# 1. Check error rate
[Dashboard] Error Rate panel → Should be <1%

# 2. Check audit logs writing
[Firestore Console] audit_logs collection → Recent logs visible

# 3. Check synapse-core unchanged
git diff packages/synapse-core/
# Expected: No output

# 4. Check health endpoint
curl https://[DOMAIN]/api/health
# Expected: {"status":"ok"}
```

### If Anything Looks Wrong
1. Take screenshot
2. Post to #prod-alerts
3. Escalate if unsure

---

## 📖 PLAYBOOK QUICK LINKS

| Scenario | Document | Section |
|----------|----------|---------|
| Go-Live Timeline | GO_LIVE_RUNBOOK.md | T-24h to T+24h |
| Audit write failure | INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md | Section 1 |
| Step-up issues | INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md | Section 2 |
| Firestore outage | INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md | Section 3 |
| Security incident | INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md | Section 4 |
| Rollback needed | ROLLBACK_BLUE_GREEN.md | Full procedure |
| Smoke tests | DAY0_VERIFICATION_CHECKLIST.md | All sections |
| Metrics & alerts | MONITORING_ALERTING_PLAN.md | Section 1-2 |
| Stabilization rules | STABILIZATION_MODE.md | Allowed/Prohibited |

---

## ⚙️ USEFUL COMMANDS

### Check synapse-core frozen
```bash
cd /Users/jukkritsuwannakum/APICOREDATA
git diff packages/synapse-core/
# Expected: No output (unchanged)
```

### Check recent audit logs
```javascript
// Firestore Console → audit_logs collection
// Filter: timestamp >= (now - 1h)
// Expected: Logs present, no gaps
```

### Check health
```bash
curl https://[DOMAIN]/api/health
# Expected: {"status":"ok"}
```

### Check version
```bash
curl https://[DOMAIN]/api/version
# Expected: v1.0-production (Green) or previous (Blue after rollback)
```

---

## 🎯 DURING INCIDENT

### General Process
```
1. ACKNOWLEDGE alert (<5min for P0)
2. POST initial message to #prod-launch
3. ASSESS severity (P0/P1/P2)
4. FOLLOW playbook for scenario
5. ESCALATE if unsure
6. PRESERVE evidence before changes
7. DOCUMENT timeline
8. POST resolution message
```

### Decision Authority
| Decision | Who Approves |
|----------|--------------|
| Enable Read-only Mode | Do immediately (audit failure) |
| Soft Disable | Do immediately (security) |
| Rollback | Platform Owner |
| Bug fix deploy | Ops Lead (P1), Owner (P0) |
| synapse-core change | ❌ **NEVER** (FROZEN) |

---

## 🚦 ESCALATION PATH

### P0 Incident
```
1. Page Primary On-call (you) → Respond <5min
   ↓ (no ack in 5min)
2. Page Secondary On-call
   ↓ (no ack in 5min)
3. Page Platform Owner
   ↓ (no ack in 5min)
4. Page all team members (emergency)
```

### If You're Stuck
**ESCALATE IMMEDIATELY**

Better to over-escalate than delay response.

---

## ✅ POST-INCIDENT CHECKLIST

After resolving any incident:

- [ ] POST resolution message
- [ ] DOCUMENT in incident log
- [ ] VERIFY metrics back to normal
- [ ] SCHEDULE post-mortem (P0/P1)
- [ ] UPDATE runbooks if needed

---

## 🔒 STABILIZATION MODE (Day 0-7)

**What you CAN do**:
- Fix bugs (with approval)
- Tune monitoring
- Update docs

**What you CANNOT do**:
- Add features
- Refactor code
- Change governance
- Touch synapse-core

**Ref**: `STABILIZATION_MODE.md`

---

**Printed**: 2026-01-31  
**Valid**: Day 0-7 (2026-02-01 to 2026-02-07)  
**Keep this card accessible during on-call shift**

---

## 🙏 REMEMBER

- **Discipline, not speed**
- **Preserve evidence first**
- **Escalate when unsure**
- **Follow playbooks exactly**
- **synapse-core is FROZEN** (never touch)

**You've got this! 🚀**
