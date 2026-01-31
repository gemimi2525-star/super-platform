# 🚀 GO-LIVE RUNBOOK
**APICOREDATA Core OS v1.0-production**  
**Launch Date**: 2026-02-01 00:00:00 UTC  
**Strategy**: Blue-Green Deployment (Zero Downtime)

---

## Overview

This runbook provides step-by-step instructions for the production launch of APICOREDATA Core OS Platform. Follow each checkpoint sequentially and **STOP** if any GO/NO-GO criteria fails.

**Deployment Strategy**: Blue-Green  
**Rollback Capability**: Instant (DNS switch)  
**Expected Downtime**: Zero

---

## TIMELINE

```
T-24h  | Final preparation checkpoint
T-4h   | Deployment preparation
T-1h   | Pre-launch verification
T+0    | GO-LIVE (Traffic switch)
T+1h   | Initial monitoring
T+6h   | Extended monitoring
T+24h  | Day 1 complete review
```

---

## T-24h: FINAL PREPARATION CHECKPOINT

### Owner: Platform Lead + All Teams

### Checklist

#### Environment Verification
- [ ] **Production environment provisioned**
  - Firebase project: `apicoredata-prod`
  - Firestore database: Ready
  - Region: Correct (e.g., `us-central1`)
  - Expected: All infrastructure green

- [ ] **Environment variables configured**
  ```bash
  # Verify all required env vars set
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - FIREBASE_ADMIN_CREDENTIALS
  ```
  - Expected: All vars present, no `undefined`

- [ ] **Backup strategy verified**
  - Firestore export scheduled: Daily
  - Backup retention: 30 days
  - Recovery tested: Within 1 hour
  - Expected: Documented & verified

#### Code Freeze
- [ ] **Code freeze initiated**
  - No merges to `main` without approval
  - All PRs reviewed and merged
  - Branch protected
  - Expected: `main` branch stable

- [ ] **Build verification**
  ```bash
  npm run build
  ```
  - Expected: Exit code 0, no errors

- [ ] **Scenario tests**
  ```bash
  npx tsx coreos/scenario-runner.ts
  ```
  - Expected: 123/123 PASS

- [ ] **Consistency Gate**
  ```bash
  npm run validate
  ```
  - Expected: PASS (0 errors, 0 warnings)

#### Security Configuration
- [ ] **HTTPS enforced**
  - Production domain: HTTPS only
  - HTTP → HTTPS redirect: Active
  - SSL certificate: Valid (not self-signed)
  - Expected: `https://` only, valid cert

- [ ] **CORS configured**
  - Allowed origins: Production domain only
  - No wildcard (`*`) in production
  - Expected: Restrictive CORS policy

- [ ] **CSP headers set**
  ```
  Content-Security-Policy: default-src 'self'; ...
  ```
  - Expected: CSP header present in responses

- [ ] **Rate limiting enabled**
  - API endpoints: Limited (e.g., 100 req/min)
  - Auth endpoints: Strict (e.g., 10 req/min)
  - Expected: Rate limits active

- [ ] **Secure cookies**
  - HttpOnly: ✓
  - Secure: ✓
  - SameSite: Strict
  - Expected: Cookie flags set

#### Governance Setup
- [ ] **Owner account created**
  - Email: [OWNER_EMAIL]
  - Role: Owner
  - MFA: Enabled
  - Expected: Account verified, can login

- [ ] **Admin roles assigned**
  - List: [ADMIN_1, ADMIN_2, ...]
  - Roles: Admin
  - MFA: Recommended
  - Expected: All admins verified

- [ ] **Audit log retention policy**
  - Active logs: 90 days (configurable)
  - Archive: After 90 days
  - Expected: Policy documented

#### Monitoring Setup
- [ ] **Error tracking configured**
  - Tool: [e.g., Sentry, Firebase Crashlytics]
  - Environment: Production
  - Alerts: Configured
  - Expected: Test error logged & received

- [ ] **Performance monitoring**
  - Tool: [e.g., Firebase Performance, Datadog]
  - Metrics: Page load, API latency
  - Expected: Metrics visible

- [ ] **Audit log monitoring**
  - Tool: Custom dashboard / Firebase console
  - Metrics: Write rate, failures
  - Expected: Dashboard functional

- [ ] **Alerting rules defined**
  - Error rate > 1%: P1 alert
  - Auth failures > 10/min: P2 alert
  - Audit write failures: P0 alert
  - Expected: Alerts tested (send test alert)

#### Team Readiness
- [ ] **On-call roster confirmed**
  - Primary: [NAME]
  - Secondary: [NAME]
  - Escalation: [NAME]
  - Expected: All acknowledged

- [ ] **Communication channels ready**
  - Slack channel: `#prod-launch`
  - Video call link: [URL]
  - Status page: [URL]
  - Expected: All team members joined

- [ ] **Runbooks accessible**
  - GO_LIVE_RUNBOOK.md: ✓
  - DAY0_VERIFICATION_CHECKLIST.md: ✓
  - ROLLBACK_BLUE_GREEN.md: ✓
  - INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md: ✓
  - Expected: All team members have access

#### Documentation
- [ ] **User documentation updated**
  - Getting Started guide
  - FAQ
  - Support contact
  - Expected: Published & accessible

- [ ] **Internal docs updated**
  - Architecture diagrams
  - API documentation
  - Emergency procedures
  - Expected: Team reviewed

### GO/NO-GO Criteria (T-24h)

**GO if**:
- ✅ All checklist items complete
- ✅ Build + tests passing
- ✅ Monitoring active
- ✅ Team ready

**NO-GO if**:
- ❌ Any critical item incomplete
- ❌ Build or tests failing
- ❌ Monitoring not working
- ❌ Team not ready

**Decision**: [ ] GO  [ ] NO-GO  
**Sign-off**: Platform Lead ________________  Date: ________

---

## T-4h: DEPLOYMENT PREPARATION

### Owner: Operations Team

### Checklist

#### Blue Environment (Current Production - Empty for first deploy)
- [ ] **Blue environment status**
  - If first deploy: N/A
  - If redeployment: Verify current traffic
  - Expected: Known state

#### Green Environment (New Deployment)
- [ ] **Deploy to Green environment**
  ```bash
  # Deploy new build to green environment
  npm run deploy:green
  ```
  - Expected: Deployment successful
  - URL: `https://green.apicoredata.com` (or equivalent)

- [ ] **Verify Green build**
  - Build version: Correct (check `/api/version`)
  - Environment: Production config
  - Expected: Version matches latest commit

- [ ] **Health check Green**
  ```bash
  curl https://green.apicoredata.com/api/health
  ```
  - Expected: `{ "status": "ok", "timestamp": ... }`

#### Database Migration (if needed)
- [ ] **Database migration status**
  - Migrations needed: Yes / No
  - If yes: Run migrations on Green
  - Expected: Migrations successful, backward compatible

- [ ] **Data integrity check**
  - Sample queries: Return expected results
  - No orphaned records
  - Expected: Data intact

#### Green Environment Testing
- [ ] **Smoke test Green (see DAY0_VERIFICATION_CHECKLIST.md)**
  - All 6 apps load
  - Step-up flow works
  - Audit logs write
  - Expected: All smoke tests PASS

- [ ] **Performance baseline**
  - Homepage load: <2s
  - API response: <500ms (avg)
  - Expected: Within SLA

### GO/NO-GO Criteria (T-4h)

**GO if**:
- ✅ Green deployed successfully
- ✅ Health checks passing
- ✅ Smoke tests PASS on Green
- ✅ Performance acceptable

**NO-GO if**:
- ❌ Green deployment failed
- ❌ Health checks failing
- ❌ Smoke tests failing
- ❌ Performance degraded

**Decision**: [ ] GO  [ ] NO-GO  
**Sign-off**: Operations Lead ________________  Date: ________

**If NO-GO**: 
1. Troubleshoot Green environment
2. Fix issues
3. Redeploy
4. Re-run this checkpoint

---

## T-1h: PRE-LAUNCH VERIFICATION

### Owner: Platform Lead + Security Lead

### Checklist

#### Security Final Check
- [ ] **Vulnerability scan (Green)**
  - Tool: [e.g., npm audit, Snyk]
  ```bash
  npm audit --production
  ```
  - Expected: No critical/high vulnerabilities

- [ ] **Secrets verification**
  - No secrets in code
  - All secrets in secure storage
  - Expected: No leaked credentials

- [ ] **Access control review**
  - Owner: 1 account
  - Admins: [N] accounts
  - Regular users: None (pre-launch)
  - Expected: Minimal access, documented

#### Governance Final Check
- [ ] **synapse-core FROZEN verification**
  ```bash
  # Verify synapse-core unchanged
  git diff v1.0-frozen packages/synapse-core/
  ```
  - Expected: No changes

- [ ] **Consistency Gate (final)**
  ```bash
  npm run validate
  ```
  - Expected: PASS (0 errors, 0 warnings)

- [ ] **Audit log test write (Green)**
  - Log in as Owner
  - Perform test action (e.g., view users)
  - Query Firestore: Recent audit log exists
  - Expected: Audit log written with correct timestamp

#### Monitoring Final Check
- [ ] **Dashboards loaded**
  - Error tracking: Green
  - Performance: Green
  - Audit logs: Green
  - Expected: All dashboards accessible

- [ ] **Alerts functional**
  - Send test alert
  - Verify on-call receives
  - Expected: Alert received within 1 min

#### Team Sync
- [ ] **Launch call started**
  - All team members present
  - Screen sharing: Monitoring dashboards
  - Expected: Communication channel open

- [ ] **Roles confirmed**
  - Deployment: [NAME]
  - Monitoring: [NAME]
  - Incident response: [NAME]
  - Communication: [NAME]
  - Expected: All acknowledged

### GO/NO-GO Criteria (T-1h)

**GO if**:
- ✅ Security checks PASS
- ✅ Governance verified
- ✅ Monitoring ready
- ✅ Team synchronized

**NO-GO if**:
- ❌ Security vulnerabilities found
- ❌ Governance checks fail
- ❌ Monitoring not working
- ❌ Team not ready

**Decision**: [ ] GO  [ ] NO-GO  
**Sign-off**: 
- Platform Lead ________________  
- Security Lead ________________  
Date: ________

**If NO-GO**: ABORT launch, reschedule

---

## T+0: GO-LIVE (TRAFFIC SWITCH)

### Owner: Operations Lead

### Pre-switch Checklist
- [ ] **Final health check (Green)**
  ```bash
  curl https://green.apicoredata.com/api/health
  ```
  - Expected: `{ "status": "ok" }`

- [ ] **Final approval**
  - Platform Lead: APPROVED
  - Security Lead: APPROVED
  - Operations Lead: APPROVED
  - Expected: All approvals received

### Traffic Switch Procedure

#### Step 1: Prepare DNS/Traffic Manager
- [ ] **Configure traffic split**
  - Tool: [e.g., Cloudflare, AWS Route 53, Load Balancer]
  - Initial: Blue 100%, Green 0%
  - Target: Blue 0%, Green 100%
  - Expected: Config ready, not applied

#### Step 2: Gradual Traffic Shift (Canary)
- [ ] **Shift 10% traffic to Green**
  - Time: T+0min
  - Monitor for 5 minutes
  - Expected: Error rate <0.5%, latency normal

- [ ] **Monitor 10% traffic**
  - Error rate: [ACTUAL]%
  - Latency: [ACTUAL]ms
  - Audit logs: Writing
  - Expected: All metrics healthy

- [ ] **Shift 50% traffic to Green**
  - Time: T+5min
  - Monitor for 10 minutes
  - Expected: Error rate <0.5%, latency normal

- [ ] **Monitor 50% traffic**
  - Error rate: [ACTUAL]%
  - Latency: [ACTUAL]ms
  - Audit logs: Writing
  - Expected: All metrics healthy

- [ ] **Shift 100% traffic to Green**
  - Time: T+15min
  - Blue now receives 0% traffic
  - Expected: All traffic on Green

#### Step 3: Verify Full Cutover
- [ ] **Verify traffic on Green**
  - Check real-time metrics
  - Active sessions: All on Green
  - Expected: 100% traffic on Green

- [ ] **Blue environment (old) in standby**
  - Status: Running, no traffic
  - Purpose: Instant rollback if needed
  - Expected: Blue still accessible

### Post-Switch Immediate Checks (T+20min)

- [ ] **Error rate**
  - Current: [ACTUAL]%
  - Expected: <1%

- [ ] **Response time**
  - Avg: [ACTUAL]ms
  - Expected: <500ms

- [ ] **Auth success rate**
  - Current: [ACTUAL]%
  - Expected: >99%

- [ ] **Audit logs writing**
  - Latest timestamp: Within 1 min
  - Expected: Logs actively writing

- [ ] **No incidents reported**
  - User reports: None
  - Internal monitoring: Green
  - Expected: No issues

### GO/NO-GO Criteria (T+20min)

**GO if**:
- ✅ Error rate <1%
- ✅ Response time <500ms
- ✅ Auth success >99%
- ✅ Audit logs writing
- ✅ No critical incidents

**ROLLBACK if**:
- ❌ Error rate >1% sustained (5+ min)
- ❌ Response time >1s sustained
- ❌ Auth success <95%
- ❌ Audit logs not writing
- ❌ Critical incident (P0)

**Decision**: [ ] GO (Continue)  [ ] ROLLBACK  
**Sign-off**: Operations Lead ________________  Time: ________

**If ROLLBACK**: Execute ROLLBACK_BLUE_GREEN.md immediately

---

## T+1h: INITIAL MONITORING

### Owner: Monitoring Team

### Checklist

#### System Health
- [ ] **Error rate stable**
  - Current: [ACTUAL]%
  - Trend: Stable / Increasing / Decreasing
  - Expected: <1%, stable

- [ ] **Response time stable**
  - Current: [ACTUAL]ms
  - Trend: Stable / Increasing / Decreasing
  - Expected: <500ms, stable

- [ ] **Active sessions**
  - Count: [ACTUAL]
  - Expected: Growing (as users discover)

#### Feature Verification
- [ ] **All apps accessible**
  - Manual test: Open each app
  - Expected: All 6 apps load

- [ ] **Step-up flow functional**
  - Test: Create user (requires step-up)
  - Expected: Step-up modal → verify → success

- [ ] **Audit logs healthy**
  - Query: Last 1 hour
  - Count: [ACTUAL] logs
  - Expected: >0, increasing

#### Database Health
- [ ] **Firestore query performance**
  - Avg read latency: [ACTUAL]ms
  - Avg write latency: [ACTUAL]ms
  - Expected: <100ms read, <200ms write

- [ ] **Firestore quota**
  - Reads: [ACTUAL] / daily quota
  - Writes: [ACTUAL] / daily quota
  - Expected: Well within quota

#### External Services
- [ ] **Firebase Auth**
  - Sign-in success rate: [ACTUAL]%
  - Expected: >99%

- [ ] **Firebase Admin SDK**
  - Operations: Successful
  - Expected: No errors

### Incident Check
- [ ] **No P0/P1 incidents**
  - Expected: None

- [ ] **P2 incidents (if any)**
  - Count: [ACTUAL]
  - Status: Acknowledged / Resolved
  - Expected: <3, all acknowledged

### Communication
- [ ] **Status update posted**
  - Channel: `#prod-launch`, Status page
  - Message: "T+1h: System stable, all metrics green"
  - Expected: Stakeholders informed

---

## T+6h: EXTENDED MONITORING

### Owner: On-call Engineer

### Checklist

#### Long-term Stability
- [ ] **Error rate trend (6h)**
  - Average: [ACTUAL]%
  - Peak: [ACTUAL]%
  - Expected: Avg <0.5%, peak <1%

- [ ] **Response time trend (6h)**
  - Average: [ACTUAL]ms
  - P95: [ACTUAL]ms
  - Expected: Avg <500ms, P95 <1s

#### User Activity
- [ ] **User sign-ups (if enabled)**
  - Count: [ACTUAL]
  - Expected: Normal growth

- [ ] **Feature usage**
  - Most used app: [APP_NAME]
  - Least used: [APP_NAME]
  - Expected: Reasonable distribution

#### Governance Health
- [ ] **Audit log volume**
  - Total (6h): [ACTUAL] logs
  - Rate: [ACTUAL] logs/hour
  - Expected: Consistent with user activity

- [ ] **Step-up session**
  - Active sessions: [ACTUAL]
  - Expirations: Normal
  - Expected: No anomalies

#### Cost Monitoring
- [ ] **Firestore costs**
  - Reads (6h): [ACTUAL]
  - Writes (6h): [ACTUAL]
  - Expected: Within budget

- [ ] **Firebase Auth costs**
  - Active users: [ACTUAL]
  - Expected: Within budget

### Blue Environment (Old)
- [ ] **Blue environment status**
  - If no issues: Consider shutting down
  - If cautious: Keep running for 24h
  - Expected: Decision made

---

## T+24h: DAY 1 COMPLETE REVIEW

### Owner: Platform Lead + All Teams

### Checklist

#### Metrics Summary (24h)
- [ ] **Error rate (24h)**
  - Average: [ACTUAL]%
  - Peak: [ACTUAL]%
  - Expected: <1%

- [ ] **Response time (24h)**
  - Average: [ACTUAL]ms
  - P95: [ACTUAL]ms
  - Expected: <500ms avg, <1s P95

- [ ] **Uptime (24h)**
  - Percentage: [ACTUAL]%
  - Expected: >99.9%

- [ ] **User activity**
  - Total sessions: [ACTUAL]
  - Unique users: [ACTUAL]
  - Expected: Growing

#### Incident Summary
- [ ] **Total incidents**
  - P0: [COUNT] (critical)
  - P1: [COUNT] (high)
  - P2: [COUNT] (medium)
  - Expected: P0=0, P1<3, P2<10

- [ ] **Incidents resolved**
  - P0: [COUNT] / [TOTAL]
  - P1: [COUNT] / [TOTAL]
  - Expected: All P0/P1 resolved

#### Governance Audit
- [ ] **Audit log integrity**
  - Total logs (24h): [ACTUAL]
  - Missing logs: [COUNT]
  - Expected: No missing logs

- [ ] **Step-up authentication**
  - Total verifications: [ACTUAL]
  - Failures: [COUNT]
  - Expected: <1% failure rate

- [ ] **synapse-core unchanged**
  - Version: v1.0 FROZEN
  - Expected: No modifications

#### User Feedback
- [ ] **User reports**
  - Positive: [COUNT]
  - Issues: [COUNT]
  - Expected: More positive than issues

- [ ] **Support tickets**
  - Total: [COUNT]
  - Resolved: [COUNT]
  - Expected: >80% resolved

### Post-Launch Decisions

#### Blue Environment
- [ ] **Decomission Blue**
  - If 24h stable: Shut down Blue
  - If cautious: Keep Blue for 72h
  - Decision: [ ] Shut down  [ ] Keep
  - Expected: Decision documented

#### Monitoring Intensity
- [ ] **Reduce monitoring frequency**
  - From: Real-time (every 5min)
  - To: Hourly (day 2-7)
  - Expected: Schedule updated

#### Team Schedule
- [ ] **On-call rotation**
  - Day 1 team: Thank you!
  - Day 2-7 team: [NAMEs]
  - Expected: Roster confirmed

### Launch Retrospective

- [ ] **Schedule retro meeting**
  - Date: Within 3 days
  - Attendees: All teams
  - Expected: Calendar invite sent

- [ ] **Collect lessons learned**
  - What went well
  - What to improve
  - Action items
  - Expected: Document created

### Final Sign-off

**Launch Status**: [ ] SUCCESS  [ ] PARTIAL SUCCESS  [ ] REQUIRES ACTION

**Sign-off**:
- Platform Lead: ________________  Date: ________
- Security Lead: ________________  Date: ________
- Operations Lead: ________________  Date: ________
- Governance Lead: ________________  Date: ________

**Next Steps**:
1. [ ] Continue monitoring (reduced frequency)
2. [ ] Address any open issues
3. [ ] Conduct retrospective
4. [ ] Update runbook based on learnings

---

## EMERGENCY CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Platform Owner | [NAME] | [PHONE] | [EMAIL] |
| Operations Lead | [NAME] | [PHONE] | [EMAIL] |
| Security Lead | [NAME] | [PHONE] | [EMAIL] |
| On-call (Day 1) | [NAME] | [PHONE] | [EMAIL] |

---

## QUICK REFERENCE

**Rollback**: See `ROLLBACK_BLUE_GREEN.md`  
**Incidents**: See `INCIDENT_RESPONSE_PLAYBOOK_ADDENDUM.md`  
**Verification**: See `DAY0_VERIFICATION_CHECKLIST.md`  
**Monitoring**: See `MONITORING_ALERTING_PLAN.md`

---

**Prepared by**: Operations Team  
**Approved by**: Platform Owner  
**Date**: 2026-01-31  
**Version**: v1.0
