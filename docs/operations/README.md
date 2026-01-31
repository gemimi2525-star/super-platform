# 🚀 OPERATIONS DOCUMENTATION
**APICOREDATA Core OS v1.0-production**  
**Go-Live**: 2026-02-01 00:00:00 UTC

---

## Overview

This directory contains **actionable runbooks and procedures** for production launch and Day 0 operations. All documents are designed to be followed step-by-step by the operations team.

**Deployment Strategy**: Blue-Green (Zero Downtime, Instant Rollback)

---

## 📚 Documentation Index

### 0. DAY0_EXECUTION_ORDER.md ⭐ **START HERE**
**Purpose**: Final command pack for Go-Live preparation  
**Scope**: Pre-launch commands through Day 0  
**Owner**: Platform Lead + All Teams

**Contents**:
- **6 Deterministic Commands** (execute in exact order):
  1. LOCK ROLES (assign team, verify contacts)
  2. COMMS CHECK (test Slack, video, phone, mock drill)
  3. MONITORING GO/NO-GO (dashboards, alerts, escalation)
  4. DRY-RUN ROLLBACK (practice instant rollback, optional but recommended)
  5. FINAL READINESS REVIEW (T-24h checklist, final GO/NO-GO)
  6. EXECUTION DAY (follow runbooks exactly)
- GO/NO-GO criteria for each command
- Blocker tracking
- Emergency contact card
- Team briefing script

**Use When**: **Before executing any other runbook** — this is your master checklist

---

### 1. GO_LIVE_RUNBOOK.md
**Purpose**: Master timeline for production launch  
**Scope**: T-24h to T+24h  
**Owner**: Platform Lead + All Teams

**Contents**:
- Timeline checkpoints (T-24h, T-4h, T-1h, T+0, T+1h, T+24h)
- GO/NO-GO criteria for each checkpoint
- Pre-launch verification
- Traffic cutover procedure (gradual: 10% → 50% → 100%)
- Post-launch monitoring
- Day 1 complete review

**Use When**: Planning and executing production launch

---

### 2. DAY0_VERIFICATION_CHECKLIST.md
**Purpose**: Comprehensive smoke tests for first 24 hours  
**Scope**: System health, all apps, governance, security  
**Owner**: QA + Operations Team

**Contents**:
- System health checks (infrastructure, database, auth)
- Core OS Shell verification (Desktop, Dock, Windows)
- App-by-app tests (all 6 production apps)
- Step-up authentication flow tests
- Governance & audit integrity verification
- Performance & load tests
- Security verification (HTTPS, cookies, access control)
- Error handling tests

**Use When**: After go-live, during first 24 hours, for post-deployment verification

---

### 3. MONITORING_ALERTING_PLAN.md
**Purpose**: Define metrics, thresholds, and alert routing  
**Scope**: All production monitoring  
**Owner**: Operations Team

**Contents**:
- **Metrics to monitor** (60+ metrics across 7 categories):
  - Application (error rate, response time)
  - Authentication (sign-in, step-up)
  - Database (Firestore latency, quota)
  - Audit logs (write rate, failures)
  - Governance (decision rate, deny rate)
  - System (CPU, memory, uptime)
  - Cost (Firestore, Firebase Auth)
- **Alert thresholds & severity** (P0/P1/P2/P3)
- **Alert routing** (PagerDuty, Slack, Email, SMS)
- **Escalation policy** (Primary → Secondary → Platform Owner)
- **On-call rotation** (weekly schedule)
- **SLAs** (uptime 99.9%, MTTD <5min, MTTR <4h for P0)
- **Day 0-7 intensified monitoring** schedule

**Use When**: Setting up monitoring, responding to alerts, reviewing SLAs

---

### 4. INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md
**Purpose**: Day 0-specific incident procedures  
**Scope**: First 24 hours post-launch  
**Owner**: On-call Team + Security Lead

**Contents**:
- **General Day 0 principles** (escalate fast, preserve evidence, rollback is safe)
- **Scenario 1**: Audit logs not writing (P0)
  - Decision tree: Firestore reachable vs unreachable
  - Immediate action: Enable Read-only Mode
  - Backfill procedures
- **Scenario 2**: Step-up authentication issues (P1)
  - Endless loop troubleshooting
  - Verification failing investigation
  - Session not persisting (expected behavior)
- **Scenario 3**: Firestore outage (P0)
  - Confirm via Firebase status
  - Communication templates
  - Post-resolution verification
- **Scenario 4**: Suspicious session compromise (P1)
  - Malicious activity response (Soft Disable immediately)
  - Forensic capture procedures
  - Remediation steps
- **Scenario 5**: Rollback decision criteria
- **Communication templates** (P0 initial/update/resolved)
- **All hands protocol** (when to invoke, how)

**Use When**: Responding to incidents during first 24 hours (more cautious thresholds than standard ops)

---

### 5. ROLLBACK_BLUE_GREEN.md
**Purpose**: Exact rollback procedure for instant traffic switch  
**Scope**: Emergency rollback from Green to Blue  
**Owner**: Operations Lead (with Platform Owner approval)

**Contents**:
- **Rollback decision criteria**:
  - IMMEDIATE: Error rate >5%, P0, data corruption, governance failure
  - CONSIDER: Error rate 1-5%, P1, performance degradation
  - DO NOT: Minor UI issues, <1% error rate
- **Pre-rollback checklist** (Blue health, approval, evidence capture)
- **Rollback procedure**:
  - Option A: DNS-based traffic switch
  - Option B: Load Balancer traffic switch
  - Option C: Reverse Proxy (Nginx) traffic switch
- **Verification steps** (health check, metrics, smoke tests)
- **Post-rollback communication** (internal + external templates)
- **Extended monitoring** (1 hour post-rollback)
- **Green environment investigation** (preserve for forensics)
- **Redeployment guidelines** (gradual traffic shift: 5% → 25% → 50% → 100%)
- **Common issues** (DNS not propagating, Blue unhealthy, session conflicts)
- **Decision flowchart**

**Use When**: Emergency rollback needed, or testing rollback procedure

---

### 6. STABILIZATION_MODE.md 🔒
**Purpose**: Operational rules for Day 0-7 post-launch  
**Scope**: Allowed/prohibited changes, incident handling, success criteria  
**Owner**: All Teams

**Contents**:
- **Stabilization Rules**:
  - ✅ ALLOWED: Bug fixes, monitoring tuning, ops docs
  - ❌ PROHIBITED: New features, refactoring, governance changes, synapse-core modifications
- **Change Approval Matrix** (who approves what)
- **Incident Handling** (Day 0-7 specific, lower thresholds):
  - Audit write failure → Read-only Mode immediately
  - Security incident → Soft Disable + forensics
  - Rollback criteria (more aggressive: Error >3% = rollback)
- **Daily Monitoring Intensity** (Day 0 real-time, Day 1-3 hourly, Day 4-7 every 4h)
- **Success Criteria** (Day 7 exit criteria):
  - Uptime >99.9%, Audit 100%, synapse-core unchanged, Team confident
- **Review Schedule** (T+24h, Day 7)
- **Stabilization Log** (track all changes, incidents, improvements)
- **Enforcement Mechanisms** (code freeze, hooks, CI checks)

**Use When**: During Day 0-7 stabilization window, determining if change is allowed, exit criteria check

---

### 7. EXECUTION_TRACKER.md 📊 **LIVE STATUS BOARD**
**Purpose**: Real-time progress tracker for DAY0_EXECUTION_ORDER  
**Scope**: Command-by-command status, decisions, evidence  
**Owner**: Platform Lead + All Teams

**NEW - Updated Features**:
- **🎯 CURRENT STATUS** (Live Dashboard showing which command is active NOW)
- **📍 WHERE TO LOOK** (Quick navigation to all documents)
- **🚀 NEXT STEP** (What to do today/right now)
- **Command Status Overview** (1-6, with symbols: ⬜ 🟡 ✅ ⚠️ ❌)
- **Detailed Checklists** for each command:
  1. LOCK ROLES: Team assignments, contact verification, runbook distribution
  2. COMMS CHECK: Channel testing, mock drill timeline
  3. MONITORING GO/NO-GO: Dashboard setup, alert testing (including CRITICAL Audit alert)
  4. DRY-RUN ROLLBACK: Test environment, execution, debrief
  5. FINAL READINESS: T-24h checklist, synapse-core verification, unanimous GO
  6. EXECUTION DAY: Timeline checkpoints (T-4h, T-1h, T+0, T+1h, T+6h, T+24h)
- **GO/NO-GO Decision Forms** (with sign-off spaces)
- **Blocker Log** (track and resolve blockers)
- **Notes & Learnings** (capture insights during execution)

**Use When**: **Check this FIRST** — single source of truth for status, updated continuously

**Current Focus**: 🟡 **Command 1: LOCK ROLES ready to start TODAY**

---

### 8. ONCALL_QUICK_REFERENCE.md 🚨
**Purpose**: Quick reference card for on-call engineers  
**Scope**: Emergency contacts, P0 scenarios, immediate actions  
**Owner**: On-call Engineers

**Contents**:
- **Emergency Contacts** (all team members, war-room, Slack)
- **Critical Rules** (Day 0-7 prohibited/allowed)
- **P0 Scenarios with Immediate Actions**:
  - Audit logs not writing → Read-only Mode (step-by-step)
  - Security incident → Soft Disable (step-by-step)
  - Error rate >5% → Rollback consideration
  - Firestore outage → Wait (DON'T rollback)
- **P1 Scenarios** (Step-up loop)
- **Rollback Criteria** (IMMEDIATE/CONSIDER/DO NOT)
- **Monitoring Quick Check** (healthy vs degraded vs critical)
- **Communication Templates** (P0 initial/update/resolved)
- **Sanity Checks** (hourly checks for Day 0)
- **Playbook Quick Links** (scenario → document mapping)
- **Useful Commands** (check synapse-core, audit logs, health, version)
- **Escalation Path** (5min between levels)
- **Post-Incident Checklist**

**Use When**: On-call shift (print/keep accessible), during incident (quick actions), unsure what to do

---

## 🗓️ USAGE TIMELINE

### Pre-Launch (T-24h to T-1h)
1. **GO_LIVE_RUNBOOK.md**: Follow T-24h checkpoint
2. **GO_LIVE_RUNBOOK.md**: Follow T-4h checkpoint
3. **GO_LIVE_RUNBOOK.md**: Follow T-1h checkpoint

### Launch (T+0)
1. **GO_LIVE_RUNBOOK.md**: Execute traffic cutover (T+0 section)
2. **DAY0_VERIFICATION_CHECKLIST.md**: Begin smoke tests

### Post-Launch (T+1h to T+24h)
1. **GO_LIVE_RUNBOOK.md**: T+1h monitoring
2. **MONITORING_ALERTING_PLAN.md**: Monitor dashboards, respond to alerts
3. **DAY0_VERIFICATION_CHECKLIST.md**: Complete all verifications
4. **INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md**: Use if incidents occur
5. **ROLLBACK_BLUE_GREEN.md**: Use if rollback needed
6. **GO_LIVE_RUNBOOK.md**: T+24h review

---

## 🚨 QUICK REFERENCE

### If an Alert Triggers

1. **Acknowledge** (within SLA: P0=5min, P1=15min, P2=1h)
2. **Check severity** (P0/P1/P2/P3)
3. **Follow playbook**:
   - Day 0 (first 24h): `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md`
   - After Day 0: `docs/enterprise/EMERGENCY_PLAYBOOKS.md`
4. **Escalate** if needed (per `MONITORING_ALERTING_PLAN.md`)
5. **Document** incident

### If Rollback Needed

1. **Check criteria** (`ROLLBACK_BLUE_GREEN.md` Section: Rollback Decision Criteria)
2. **Get approval** (Platform Owner)
3. **Capture evidence** (logs, metrics, screenshots)
4. **Execute rollback** (`ROLLBACK_BLUE_GREEN.md` Section: Rollback Procedure)
5. **Verify success** (health check, metrics, smoke tests)
6. **Investigate Green** (preserve for forensics, identify root cause)

### If Unsure

- **Escalate**: It's better to escalate than delay
- **Communicate**: Post in `#prod-launch` (Day 0) or `#prod-alerts` (standard)
- **Preserve**: Capture evidence before making changes

---

## 📊 SUCCESS METRICS

### Day 0 Success Criteria

- ✅ **Error rate**: <1% (sustained)
- ✅ **Uptime**: >99.9%
- ✅ **Response time**: P95 <1s
- ✅ **Auth success**: >99%
- ✅ **Audit logs**: 100% write success
- ✅ **Incidents**: P0=0, P1<3
- ✅ **Rollbacks**: 0 (ideally)

### Day 7 Success Criteria

- ✅ **Uptime**: >99.9% (weekly)
- ✅ **MTTD**: <5 minutes (average)
- ✅ **MTTR**: P0 <4h, P1 <24h
- ✅ **User satisfaction**: >4.5/5 (if surveyed)
- ✅ **No critical issues**: All P0/P1 resolved

---

## 👥 TEAM ROLES

| Role | Responsibilities | Documents Used |
|------|------------------|----------------|
| **Platform Lead** | Overall launch coordination, GO/NO-GO decisions | GO_LIVE_RUNBOOK.md |
| **Operations Lead** | Deployment execution, traffic management, rollback | All runbooks |
| **Security Lead** | Security verification, incident response (security) | DAY0_VERIFICATION, INCIDENT_RESPONSE |
| **On-call Engineer** | Monitor dashboards, respond to alerts, triage incidents | MONITORING_ALERTING, INCIDENT_RESPONSE |
| **QA Team** | Execute verification checklist, smoke tests | DAY0_VERIFICATION_CHECKLIST.md |
| **Platform Owner** | Final approvals (go-live, rollback, major decisions) | All (review + approve) |

---

## 🔗 RELATED DOCUMENTATION

### Enterprise Documentation
- **Security Hardening Audit**: `docs/enterprise/SECURITY_HARDENING_AUDIT.md`
- **Governance Readiness**: `docs/enterprise/GOVERNANCE_READINESS.md`
- **Emergency Playbooks** (Standard): `docs/enterprise/EMERGENCY_PLAYBOOKS.md`
- **Production Readiness**: `docs/enterprise/PRODUCTION_READINESS.md`

### Technical Documentation
- **synapse-core Spec**: `packages/synapse-core/README.md`
- **Architecture**: `docs/architecture/`
- **API Docs**: `docs/api/`

---

## 📞 EMERGENCY CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Platform Owner | [NAME] | [PHONE] | [EMAIL] |
| Operations Lead | [NAME] | [PHONE] | [EMAIL] |
| Security Lead | [NAME] | [PHONE] | [EMAIL] |
| On-call Primary | [NAME] | [PHONE] | [EMAIL] |
| On-call Secondary | [NAME] | [PHONE] | [EMAIL] |

**Emergency Escalation**: [PHONE]

---

## 🎓 TRAINING & DRILLS

### Pre-Launch Training

- [ ] All team members read all 5 runbooks
- [ ] Roles and responsibilities confirmed
- [ ] Communication channels tested
- [ ] Monitoring dashboards reviewed
- [ ] Rollback procedure dry-run (recommended)

### Post-Launch Drills

**Schedule**:
- **Week 2**: Rollback drill (execute rollback to Blue, verify, switch back)
- **Month 1**: Incident response drill (simulate P1, follow playbook)
- **Quarterly**: Full disaster recovery drill (all scenarios)

---

**Prepared by**: Operations Team  
**Approved by**: Platform Owner  
**Date**: 2026-01-31  
**Version**: v1.0  
**Go-Live**: 2026-02-01 00:00:00 UTC

---

## ✅ PRE-LAUNCH CHECKLIST (FINAL)

- [ ] All 5 runbooks reviewed by team
- [ ] Roles assigned and acknowledged
- [ ] Monitoring configured and tested
- [ ] Blue environment healthy (standby)
- [ ] Green environment deployed and verified
- [ ] Communication channels ready (#prod-launch, video call)
- [ ] Emergency contacts confirmed
- [ ] Platform Owner approval for go-live
- [ ] Team confident and ready

**Sign-off**:
- Platform Lead: ________________ Date: ________
- Operations Lead: ________________ Date: ________
- Security Lead: ________________ Date: ________
- Platform Owner: ________________ Date: ________

**GO-LIVE AUTHORIZED**: [ ] YES  [ ] NO (reason: ________________)
