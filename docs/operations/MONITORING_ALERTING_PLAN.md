# 📊 MONITORING & ALERTING PLAN
**APICOREDATA Core OS v1.0-production**  
**Effective**: 2026-02-01 (Go-Live)  
**Review**: Quarterly

---

## Overview

This document defines the monitoring strategy, metrics, thresholds, alert routing, and incident response for APICOREDATA Core OS Platform in production.

**Objectives**:
- Detect issues before users report them
- Respond to incidents within SLA
- Maintain system health >99.9% uptime

---

## SECTION 1: METRICS TO MONITOR

### 1.1 Application Metrics

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Error Rate** | % of requests resulting in 5xx errors | Server logs / APM | <1% |
| **Response Time** | Avg time to serve requests | APM / synthetic monitoring | <500ms (avg), <1s (P95) |
| **Request Volume** | Requests per minute | Server logs / APM | Baseline TBD |
| **Success Rate** | % of successful requests | Server logs | >99% |

### 1.2 Authentication Metrics

| Metric | Description |Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Sign-in Success Rate** | % of successful sign-ins | Firebase Auth logs | >99% |
| **Sign-in Failures** | Failed sign-in attempts | Firebase Auth logs | <10/min |
| **Step-up Verifications** | Step-up verify requests | Audit logs | Baseline TBD |
| **Step-up Failures** | Failed step-up attempts | Audit logs | <1% |
| **Session Count** | Active authenticated sessions | Firebase Auth | Baseline TBD |

### 1.3 Database Metrics (Firestore)

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Read Latency** | Avg time for reads | Firestore metrics | <100ms |
| **Write Latency** | Avg time for writes | Firestore metrics | <200ms |
| **Read Quota** | % of daily read quota used | Firestore quotas | <80% |
| **Write Quota** | % of daily write quota used | Firestore quotas | <80% |
| **Document Count** | Total documents | Firestore metrics | Baseline TBD |
| **Storage Size** | Database size (GB) | Firestore metrics | <10GB (initial) |

### 1.4 Audit Log Metrics

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Audit Write Rate** | Logs written per minute | Firestore query | Baseline TBD |
| **Audit Write Failures** | Failed log writes | Application logs | 0 |
| **Audit Log Volume** | Total logs in 24h | Firestore query | Baseline TBD |
| **Missing CorrelationIds** | % logs without correlationId (when expected) | Custom query | <1% |

### 1.5 Governance Metrics

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Decision Rate** | Governance decisions per minute | Audit logs (`decision` field) | Baseline TBD |
| **Deny Rate** | % of decisions that are DENY | Audit logs | <5% |
| **synapse-core Errors** | Errors from governance kernel | Application logs | 0 |

### 1.6 System Metrics

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **CPU Usage** | % CPU used | Infrastructure monitoring | <70% |
| **Memory Usage** | % memory used | Infrastructure monitoring | <80% |
| **Disk Usage** | % disk used | Infrastructure monitoring | <80% |
| **Uptime** | % time system available | Synthetic monitoring | >99.9% |

### 1.7 Cost Metrics

| Metric | Description | Collection Method | Target |
|--------|-------------|-------------------|--------|
| **Firestore Costs** | Daily cost for Firestore reads/writes | Firebase billing | <$[BUDGET]/day |
| **Firebase Auth Costs** | Daily cost for auth operations | Firebase billing | <$[BUDGET]/day |
| **Total Daily Cost** | All Firebase costs | Firebase billing | <$[BUDGET]/day |

---

## SECTION 2: ALERT THRESHOLDS & SEVERITY

### 2.1 Severity Definitions

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **P0 (Critical)** | Service down, data loss, security breach | Immediate | Platform Owner |
| **P1 (High)** | Major degradation, affects >10% users | 15 minutes | Operations Lead |
| **P2 (Medium)** | Minor degradation, <10% users affected | 1 hour | On-call Engineer |
| **P3 (Low)** | Informational, no user impact | Next business day | Team review |

### 2.2 Alert Rules

#### Application Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **High Error Rate** | Error rate >1% for 5+ min | **P0** | Page on-call, investigate immediately |
| **Elevated Error Rate** | Error rate 0.5-1% for 10+ min | **P1** | Notify on-call, monitor closely |
| **Slow Response Time** | P95 >1s for 10+ min | **P1** | Investigate performance |
| **Request Volume Spike** | >200% of baseline for 5+ min | **P2** | Check capacity, potential attack |
| **Request Volume Drop** | <20% of baseline for 10+ min | **P1** | Service disruption? |

#### Authentication Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **Auth Service Down** | Sign-in success rate <50% for 5+ min | **P0** | Page on-call, check Firebase Auth |
| **High Auth Failures** | >20 failures/min for 5+ min | **P1** | Potential brute force attack |
| **Step-up Failures** | Step-up failure rate >5% for 10+ min | **P1** | Check step-up service |
| **Suspicious Session** | Multiple step-ups from same IP in <5min | **P2** | Security review |

#### Database Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **Firestore Unreachable** | Read/write latency >5s for 2+ min | **P0** | Page on-call, check Firebase status |
| **Quota Exhaustion** | Read/write quota >95% | **P1** | Increase quota or optimize queries |
| **High Read Latency** | Read latency >500ms for 10+ min | **P2** | Optimize queries |
| **High Write Latency** | Write latency >1s for 10+ min | **P2** | Check write patterns |

#### Audit Log Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **Audit Write Failures** | Any failed audit writes | **P0** | Governance integrity compromised |
| **Audit Log Gap** | No logs written for 5+ min (during active use) | **P1** | Check audit service |
| **High Audit Volume** | >1000 logs/min sustained for 10+ min | **P2** | Potential attack or misconfiguration |

#### Governance Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **synapse-core Errors** | Any errors from governance kernel | **P0** | Critical governance failure |
| **High Deny Rate** | >10% decisions DENY for 10+ min | **P2** | Review policies or user behavior |

#### System Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **High CPU** | CPU >90% for 5+ min | **P1** | Scale up or optimize |
| **High Memory** | Memory >95% for 5+ min | **P1** | Memory leak? Scale up |
| **Disk Full** | Disk >95% used | **P1** | Clean up or expand |
| **Service Down** | Uptime check fails 3 consecutive times | **P0** | Service outage |

#### Cost Alerts

| Alert Name | Condition | Severity | Action |
|------------|-----------|----------|--------|
| **Cost Spike** | Daily cost >200% of baseline | **P2** | Investigate usage spike |
| **Approaching Budget** | Monthly costs >80% of budget | **P3** | Review and optimize |

---

## SECTION 3: ALERT ROUTING & ESCALATION

### 3.1 Alert Channels

| Channel | Purpose | Recipients |
|---------|---------|------------|
| **PagerDuty / On-call Service** | P0/P1 alerts | On-call engineer |
| **Slack: #prod-alerts** | All alerts (P0-P3) | Operations team |
| **Email** | P2/P3 alerts | Team distribution list |
| **SMS** | P0 only (redundant) | On-call + Platform Owner |

### 3.2 On-call Rotation

| Role | Schedule | Responsibilities |
|------|----------|------------------|
| **Primary On-call** | Weekly rotation | Respond to all P0/P1 alerts |
| **Secondary On-call** | Weekly rotation | Backup, escalation path |
| **Platform Owner** | Always available (P0) | Final escalation, major decisions |

**Current Roster**:
- Week 1 (2026-02-01 to 02-07): Primary: [NAME], Secondary: [NAME]
- Week 2 (2026-02-08 to 02-14): Primary: [NAME], Secondary: [NAME]
- [... rotation continues]

### 3.3 Escalation Policy

```
P0 Alert Triggered
    ↓
1. Page Primary On-call (immediately)
    ↓ (if no ack in 5 min)
2. Page Secondary On-call
    ↓ (if no ack in 5 min)
3. Page Platform Owner
    ↓ (if no ack in 5 min)
4. Page all team members (emergency)

P1 Alert Triggered
    ↓
1. Notify Primary On-call (Slack + Email)
    ↓ (if no ack in 15 min)
2. Page Primary On-call
    ↓ (if no ack in 30 min)
3. Escalate to P0 path

P2/P3 Alerts
    ↓
1. Post to Slack #prod-alerts
2. Log in ticketing system
3. Review during business hours
```

---

## SECTION 4: MONITORING TOOLS

### 4.1 Recommended Stack

| Category | Tool | Purpose |
|----------|------|---------|
| **APM** | Firebase Performance / Datadog | Application performance monitoring |
| **Error Tracking** | Sentry / Firebase Crashlytics | Error aggregation and alerting |
| **Logs** | Firebase Cloud Logging / GCP Logging | Centralized log management |
| **Uptime** | UptimeRobot / Pingdom | Synthetic monitoring |
| **Alerting** | PagerDuty / Opsgenie | Incident management |
| **Dashboards** | Firebase Console / Grafana | Visual monitoring |
| **Costs** | Firebase Billing Dashboard | Cost monitoring |

### 4.2 Dashboard Configuration

#### Primary Dashboard (Real-time)
- **Error Rate** (last 1h, 24h, 7d)
- **Response Time** (P50, P95, P99)
- **Active Sessions** (current count)
- **Request Volume** (requests/min)
- **Firestore Latency** (read, write)
- **Audit Write Rate** (logs/min)

#### Secondary Dashboard (Trends)
- **Daily Active Users** (trend)
- **Error Rate Trend** (7d, 30d)
- **Performance Trend** (7d, 30d)
- **Cost Trend** (daily, monthly)

#### Governance Dashboard
- **Audit Log Volume** (by action type)
- **Decision Types** (ALLOW vs DENY)
- **Step-up Verifications** (success/failure)
- **CorrelationId Coverage** (% logs with correlationId)

---

## SECTION 5: INCIDENT RESPONSE

### 5.1 Response Workflow

```
Alert Triggered
    ↓
1. Acknowledge (within SLA)
    ↓
2. Triage (severity, impact, scope)
    ↓
3. Investigate (logs, metrics, reproduce)
    ↓
4. Mitigate (fix, workaround, or rollback)
    ↓
5. Verify (issue resolved, metrics normal)
    ↓
6. Document (incident report, lessons learned)
    ↓
7. Post-mortem (if P0/P1)
```

### 5.2 Communication Template

**Initial Update** (within 15 min for P0, 30min for P1):
```
[INCIDENT] [SEVERITY] [TITLE]
Status: Investigating
Impact: [Description]
Start Time: [HH:MM UTC]
Next Update: [HH:MM UTC]
```

**Progress Update** (every 30min for P0, hourly for P1):
```
[INCIDENT] [SEVERITY] [TITLE]
Status: [Investigating / Mitigating / Resolved]
Update: [What we know, what we're doing]
Next Update: [HH:MM UTC]
```

**Resolution**:
```
[INCIDENT] [SEVERITY] [TITLE]
Status: RESOLVED
Resolution: [What was fixed]
Duration: [Total time]
Impact: [Final assessment]
Post-mortem: [Date scheduled, if applicable]
```

---

## SECTION 6: SLA & TARGETS

### 6.1 Service Level Objectives (SLOs)

| Metric | Target | Measurement Period |
|--------|--------|--------------------|
| **Uptime** | 99.9% | Monthly |
| **Error Rate** | <1% | Daily |
| **Response Time (P95)** | <1s | Daily |
| **Auth Success Rate** | >99% | Daily |
| **Audit Write Success** | 100% | Daily |

### 6.2 Incident Response SLAs

| Severity | Time to Acknowledge | Time to Initial Response | Time to Resolution |
|----------|---------------------|-------------------------|--------------------|
| **P0** | 5 minutes | 15 minutes | 4 hours |
| **P1** | 15 minutes | 30 minutes | 24 hours |
| **P2** | 1 hour | 4 hours | 7 days |
| **P3** | Next business day | Next business day | 30 days |

### 6.3 MTTD / MTTR Targets

| Metric | Target | How Measured |
|--------|--------|--------------|
| **MTTD** (Mean Time to Detect) | <5 minutes | Alert timestamp - incident start |
| **MTTR** (Mean Time to Resolve) | P0: <4h, P1: <24h | Alert timestamp - resolution |

**Calculation**:
- Track incident start time (first user impact or first alert)
- Track detection time (first alert received)
- Track resolution time (issue confirmed resolved)
- MTTD = Detection time - Start time
- MTTR = Resolution time - Detection time

---

## SECTION 7: DAY 0-7 INTENSIFIED MONITORING

### 7.1 First 24 Hours (Day 0)

**Monitoring Intensity**: Real-time (every 5 minutes)

**On-call**: All hands on deck (all team members monitoring)

**Checks**:
- [ ] Error rate (every 5 min)
- [ ] Response time (every 5 min)
- [ ] Active sessions (every 15 min)
- [ ] Audit logs writing (every 15 min)
- [ ] No P0/P1 alerts (continuous)

**Communication**:
- Status updates: Every 2 hours in Slack
- Go/No-Go review: T+1h, T+6h, T+24h

### 7.2 Days 1-7

**Monitoring Intensity**: Hourly

**On-call**: Primary + Secondary rotation

**Checks**:
- [ ] Error rate (hourly)
- [ ] Response time (hourly)
- [ ] Daily metrics summary (daily)
- [ ] Weekly trend review (Day 7)

**Communication**:
- Status updates: Daily (EOD)
- Weekly review: Day 7

### 7.3 Post-Week 1

**Monitoring Intensity**: Standard (alerts + daily dashboard review)

**On-call**: Standard rotation

**Checks**:
- [ ] Dashboard review (daily)
- [ ] Weekly metrics review (weekly)
- [ ] Monthly trend analysis (monthly)

---

## SECTION 8: AUDIT & REVIEW

### 8.1 Monitoring Effectiveness Review

**Schedule**: Quarterly

**Review**:
- Alert accuracy (false positives vs true positives)
- MTTD / MTTR performance
- SLO achievement
- Incident trends

**Outcome**: Update thresholds, add/remove alerts

### 8.2 Runbook Updates

**Schedule**: After each P0/P1 incident

**Review**:
- Was runbook followed?
- What worked well?
- What needs improvement?

**Outcome**: Update runbooks, playbooks

---

## APPENDIX A: QUICK REFERENCE

### Common Queries

#### Firestore: Recent Audit Logs
```javascript
// Last 1 hour
db.collection('audit_logs')
  .where('timestamp', '>=', Date.now() - 3600000)
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get()
```

#### Firestore: Error Rate
```javascript
// Server-side log query
// Ratio of 5xx responses to total responses
```

#### Firebase Auth: Sign-in Failures
```javascript
// Firebase Console → Authentication → Users
// Filter by failed sign-ins (last 1h)
```

### Useful Commands

```bash
# Check production health
curl https://[DOMAIN]/api/health

# Check response time
curl -w "\nTime: %{time_total}s\n" https://[DOMAIN]/

# Tail server logs (if SSH access)
tail -f /var/log/app.log | grep ERROR
```

---

**Prepared by**: Operations Team  
**Approved by**: Platform Owner  
**Date**: 2026-01-31  
**Version**: v1.0  
**Next Review**: 2026-04-30
