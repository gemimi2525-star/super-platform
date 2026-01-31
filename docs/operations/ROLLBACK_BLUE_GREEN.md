# 🔄 ROLLBACK PROCEDURE — BLUE-GREEN DEPLOYMENT
**APICOREDATA Core OS v1.0-production**  
**Strategy**: Instant Traffic Switch  
**Downtime**: <1 minute (DNS propagation)

---

## Overview

This document provides the **exact steps** to rollback from Green environment (new deployment) to Blue environment (previous stable version) using Blue-Green deployment strategy.

**When to Use**: See decision criteria below  
**Who Can Execute**: Operations Lead (with Platform Owner approval)  
**Expected Duration**: 2-5 minutes

---

## ROLLBACK DECISION CRITERIA

### IMMEDIATE Rollback (DO NOT DELAY)

Execute rollback **immediately** if:

- ❌ **Error rate >5%** sustained for 10+ minutes (Day 0)
- ❌ **Error rate >10%** sustained for 5+ minutes (any time)
- ❌ **P0 incident**: Service completely down
- ❌ **Data corruption**: User data corrupted or lost
- ❌ **Governance failure**: Audit logs not writing for 10+ minutes
- ❌ **Security breach**: Confirmed unauthorized access
- ❌ **Critical bug**: Breaking core functionality (e.g., can't login, can't create users)

### CONSIDER Rollback (Evaluate First)

Evaluate rollback if:

- ⚠️ **Error rate 1-5%** sustained for 30+ minutes (Day 0)
- ⚠️ **Performance degradation**: P95 response time >2s sustained
- ⚠️ **Multiple P1 incidents** with no clear resolution path
- ⚠️ **Database issues**: Firestore latency >5s sustained
- ⚠️ **Auth issues**: Sign-in success rate <95%

### DO NOT Rollback

**DO NOT** rollback for:

- ✅ Minor UI issues (cosmetic bugs)
- ✅ Single P2 incident
- ✅ Error rate <1% (acceptable variance)
- ✅ Issues with clear, fast fix available

---

## PRE-ROLLBACK CHECKLIST

### Prerequisites

- [ ] **Blue environment still running**
  - Status: Verify Blue is healthy (should be standby)
  - URL: `https://blue.[DOMAIN]` or equivalent
  - Expected: Health check returns OK

- [ ] **Platform Owner approval obtained**
  - Verbal/written: ________________
  - Timestamp: ________________
  - Rationale: ________________

- [ ] **Team notified**
  - `#prod-launch`: "Rollback initiated due to [REASON]"
  - On-call team: Acknowledged
  - Expected: All key stakeholders aware

### Evidence Capture (DO NOT SKIP)

**Before rolling back, preserve evidence**:

- [ ] **Screenshot dashboards**
  - Error rate: ________________
  - Response time: ________________
  - Active incidents: ________________

- [ ] **Export recent logs**
  ```bash
  # Server logs (last 1 hour)
  tail -n 5000 /var/log/app.log > pre_rollback_logs_$(date +%s).txt
  ```

- [ ] **Export metrics snapshot**
  - Tool: APM / Firebase Performance
  - Timeframe: Last 1-2 hours
  - Format: Screenshot or CSV export

- [ ] **Document incident**
  - Start time: ________________
  - Symptoms: ________________
  - Decision maker: ________________

---

## ROLLBACK PROCEDURE

### Step 1: Verify Blue Environment Health

**DO NOT proceed to rollback if Blue is unhealthy**

- [ ] **Health check**
  ```bash
  curl https://blue.[DOMAIN]/api/health
  ```
  - **Expected**: `{ "status": "ok", "timestamp": ... }`
  - **Actual**: ________________
  - **Status**: PASS / FAIL

- [ ] **Quick smoke test**
  - Navigate to: `https://blue.[DOMAIN]`
  - Login: Works? Yes / No
  - Load app: Works? Yes / No
  - **Overall**: PASS / FAIL

**If Blue health check FAILS**:
- ⛔ **STOP**: Do not rollback
- ⛔ **Escalate**: Both Green AND Blue are unhealthy
- ⛔ **Action**: Emergency troubleshooting (different playbook)

**If Blue health check PASSES**:
- ✅ Proceed to Step 2

---

### Step 2: Prepare Traffic Switch

**Identify your traffic management method**:

Choose ONE based on your infrastructure:
- [ ] **A. DNS-based** (Cloudflare, Route 53, etc.)
- [ ] **B. Load Balancer** (GCP Load Balancer, AWS ALB, etc.)
- [ ] **C. Reverse Proxy** (Nginx, etc.)

---

#### Option A: DNS-based Traffic Switch

**Current State**:
- Primary domain: `apicoredata.com` → Points to Green (IP: `1.2.3.4`)
- Blue environment: `blue.apicoredata.com` (IP: `5.6.7.8`)

**Steps**:

1. [ ] **Login to DNS provider** (e.g., Cloudflare)
   - URL: ________________
   - Credentials: [Secure location]

2. [ ] **Locate A record for primary domain**
   - Domain: `apicoredata.com` (or your domain)
   - Current value: `1.2.3.4` (Green IP)
   - Target value: `5.6.7.8` (Blue IP)

3. [ ] **Update A record**
   - Change IP: `1.2.3.4` → `5.6.7.8`
   - TTL: Set to 60 seconds (if not already low)
   - **Action**: Save/Apply changes

4. [ ] **Verify DNS propagation**
   ```bash
   # Wait 60-120 seconds for propagation
   dig apicoredata.com +short
   ```
   - **Expected**: `5.6.7.8` (Blue IP)
   - **Actual**: ________________

5. [ ] **Verify traffic on Blue**
   - Navigate to: `https://apicoredata.com`
   - Expected: Loads from Blue (check version endpoint or visual cue)
   - **Status**: PASS / FAIL

**Time to Complete**: ~2-3 minutes (incl. DNS propagation)

---

#### Option B: Load Balancer Traffic Switch

**Current State**:
- Load Balancer: Routes 100% traffic → Green backend
- Blue backend: Available but not receiving traffic

**Steps**:

1. [ ] **Login to Load Balancer console**
   - Provider: [GCP / AWS / Azure]
   - URL: ________________

2. [ ] **Locate backend configuration**
   - Load Balancer name: ________________
   - Current backends:
     - Green: 100% traffic
     - Blue: 0% traffic

3. [ ] **Switch traffic**
   - Method depends on provider:
     - **GCP**: Update URL map or backend service weights
     - **AWS ALB**: Update target group routing
     - **Azure**: Update backend pool routing

   - **Target configuration**:
     - Green: 0% traffic
     - Blue: 100% traffic

4. [ ] **Apply changes**
   - **Action**: Save/Apply changes
   - **Wait**: 30-60 seconds for propagation

5. [ ] **Verify traffic on Blue**
   - Navigate to: `https://apicoredata.com`
   - Expected: Loads from Blue
   - **Status**: PASS / FAIL

**Time to Complete**: ~1-2 minutes

---

#### Option C: Reverse Proxy (Nginx/etc.) Traffic Switch

**Current State**:
- Reverse proxy: Forwards requests → Green (`green.internal:3000`)
- Blue backend: Available (`blue.internal:3000`)

**Steps**:

1. [ ] **SSH to reverse proxy server**
   ```bash
   ssh user@proxy.server
   ```

2. [ ] **Backup current config**
   ```bash
   sudo cp /etc/nginx/sites-available/apicoredata \
           /etc/nginx/sites-available/apicoredata.backup.$(date +%s)
   ```

3. [ ] **Edit Nginx config**
   ```bash
   sudo nano /etc/nginx/sites-available/apicoredata
   ```
   
   **Find**:
   ```nginx
   upstream backend {
       server green.internal:3000;
   }
   ```
   
   **Change to**:
   ```nginx
   upstream backend {
       server blue.internal:3000;
   }
   ```

4. [ ] **Test config**
   ```bash
   sudo nginx -t
   ```
   - **Expected**: "syntax is ok" and "test is successful"
   - **Actual**: ________________

5. [ ] **Reload Nginx**
   ```bash
   sudo systemctl reload nginx
   ```
   - **Expected**: No errors

6. [ ] **Verify traffic on Blue**
   ```bash
   curl -I https://apicoredata.com
   ```
   - Check for Blue version indicator (custom header or version endpoint)
   - **Status**: PASS / FAIL

**Time to Complete**: ~1-2 minutes

---

### Step 3: Verify Rollback Success

**Immediate Checks** (within 2 minutes):

- [ ] **Health check**
  ```bash
  curl https://apicoredata.com/api/health
  ```
  - **Expected**: `{ "status": "ok" }`
  - **Actual**: ________________

- [ ] **Version check**
  ```bash
  curl https://apicoredata.com/api/version
  ```
  - **Expected**: Blue version (previous version, NOT `v1.0-production`)
  - **Actual**: ________________

- [ ] **Manual smoke test**
  - Navigate to: `https://apicoredata.com`
  - Login: Works? Yes / No
  - Open app: Works? Yes / No
  - Create user (if step-up available): Works? Yes / No
  - **Overall**: PASS / FAIL

**Metrics Check** (within 5 minutes):

- [ ] **Error rate**
  - Current: ________%
  - Expected: <1% (back to normal)
  - Trend: Decreasing
  - **Status**: PASS / FAIL

- [ ] **Response time**
  - Current: ________ms
  - Expected: <500ms (back to normal)
  - Trend: Improving
  - **Status**: PASS / FAIL

- [ ] **Active sessions**
  - Count: ________
  - Expected: Users reconnecting
  - Status: Growing
  - **Status**: PASS / FAIL

---

### Step 4: Post-Rollback Communication

#### Internal (Immediate)

Post to `#prod-launch`:
```
✅ ROLLBACK COMPLETE
From: Green (v1.0-production)
To: Blue (previous version)
Reason: [BRIEF REASON]
Status: Traffic switched, monitoring metrics
Next Steps:
1. Continue monitoring for 1 hour
2. Investigate Green issues
3. Fix and prepare redeployment
```

#### External (If Applicable)

Post to status page:
```
Service Restored
We have rolled back to the previous stable version due to [GENERAL REASON].
Service is now operational. We apologize for any inconvenience.
Next update: [TIME]
```

---

### Step 5: Extended Monitoring (Post-Rollback)

**First Hour** (Monitor closely):

- [ ] **Error rate** (every 5 minutes)
  - T+5min: ________%
  - T+15min: ________%
  - T+30min: ________%
  - T+60min: ________%
  - **Expected**: Stable at <1%

- [ ] **Response time** (every 5 minutes)
  - T+5min: ________ms
  - T+15min: ________ms
  - T+30min: ________ms
  - T+60min: ________ms
  - **Expected**: Stable at <500ms

- [ ] **User reports**
  - Any new issues? Yes / No
  - If yes: ________________
  - **Expected**: No new issues

**If metrics remain healthy after 1 hour**:
- ✅ Rollback successful
- ✅ Proceed to post-rollback investigation

**If metrics degrade again**:
- ⛔ Both Green AND Blue have issues
- ⛔ Escalate to Platform Owner immediately
- ⛔ Consider full service shutdown (Soft Disable) while investigating

---

## POST-ROLLBACK INVESTIGATION

### Green Environment Analysis

**DO NOT delete Green environment immediately**

- [ ] **Preserve Green for forensics**
  - Keep running (no traffic)
  - Capture logs, metrics, state
  - Expected: Full forensic data available

- [ ] **Reproduce issue** (if possible)
  - Test in Green environment
  - Identify root cause
  - Document findings

- [ ] **Fix identified issues**
  - Code fix / config fix / infrastructure fix
  - Test thoroughly in staging
  - Peer review

- [ ] **Prepare redeployment**
  - Deploy fixed version to new Green
  - Run full smoke tests
  - Gradual traffic cutover (more cautious)

---

## REDEPLOYMENT AFTER ROLLBACK

**When to redeploy**: Only when:
- ✅ Root cause fully understood
- ✅ Fix verified in non-production
- ✅ Team confident in stability
- ✅ Approval from Platform Owner

**How to redeploy**:
1. Deploy fixed version to Green (newly rebuilt)
2. Run full verification checklist (DAY0_VERIFICATION_CHECKLIST.md)
3. Gradual traffic shift (more cautious than initial launch):
   - 5% for 30 minutes
   - 25% for 30 minutes
   - 50% for 30 minutes
   - 100% (if all metrics healthy)
4. Monitor closely for 24 hours

---

## ROLLBACK VERIFICATION CHECKLIST

### Pre-Rollback
- [ ] Blue environment health verified (PASS)
- [ ] Platform Owner approval obtained
- [ ] Evidence captured (logs, metrics, screenshots)
- [ ] Team notified

### During Rollback
- [ ] Traffic switched (method: ________________)
- [ ] DNS/LB/Proxy updated
- [ ] Change propagated

### Post-Rollback (Immediate)
- [ ] Health check: PASS
- [ ] Version check: Blue version confirmed
- [ ] Smoke tests: PASS
- [ ] Error rate: Normal (<1%)
- [ ] Response time: Normal (<500ms)

### Post-Rollback (1 Hour)
- [ ] Metrics stable for 1 hour
- [ ] No new incidents
- [ ] Users reconnected successfully
- [ ] Communication sent (internal + external)

### Investigation
- [ ] Green preserved for analysis
- [ ] Root cause identified
- [ ] Fix prepared and tested
- [ ] Redeployment plan ready

---

## COMMON ISSUES DURING ROLLBACK

### Issue 1: DNS Not Propagating

**Symptom**: Still seeing Green version after DNS change

**Cause**: DNS caching (client or ISP)

**Solution**:
- Wait 2-5 minutes for TTL expiry
- Clear local DNS cache:
  - Mac: `sudo dscacheutil -flushcache`
  - Windows: `ipconfig /flushdns`
- Use DNS checker: `https://dnschecker.org`

---

### Issue 2: Blue Environment Unhealthy

**Symptom**: Blue health check fails

**Cause**: Blue not maintained during Green deployment

**Solution**:
- **DO NOT ROLLBACK** (both environments bad)
- Emergency option: Rebuild Blue from last known good commit
- Or: Fix Green in place (risky, only if fast fix)

---

### Issue 3: Session Conflicts

**Symptom**: Users logged out after rollback

**Cause**: Session tokens changed between Blue/Green

**Solution**:
- **Expected behavior** (acceptable)
- Communicate: "Please log in again after maintenance"
- If critical: Implement session token compatibility (future improvement)

---

## DECISION FLOWCHART

```
Issue Detected on Green
    ↓
Meets Rollback Criteria?
    ├─ NO → Continue monitoring, attempt fix
    └─ YES ↓
    
Platform Owner Approval?
    ├─ NO → Document reason, escalate
    └─ YES ↓
    
Blue Environment Healthy?
    ├─ NO → STOP: Emergency escalation
    └─ YES ↓
    
Capture Evidence
    ↓
Execute Rollback (Step 1-3)
    ↓
Verify Success (Step 3)
    ├─ FAIL → Escalate (both environments issue)
    └─ PASS ↓
    
Monitor (1 hour)
    ├─ Issues → Escalate
    └─ Stable → Rollback successful
    
Investigate Green + Fix
    ↓
Redeployment (when ready)
```

---

## CONTACT INFORMATION

| Role | Name | Phone | Email |
|------|------|-------|-------|
| **Platform Owner** | [NAME] | [PHONE] | [EMAIL] |
| **Operations Lead** | [NAME] | [PHONE] | [EMAIL] |
| **On-call Primary** | [NAME] | [PHONE] | [EMAIL] |
| **On-call Secondary** | [NAME] | [PHONE] | [EMAIL] |

**Emergency Escalation**: If unable to reach anyone, call: [EMERGENCY_NUMBER]

---

## APPENDIX: INFRASTRUCTURE-SPECIFIC NOTES

### For Firebase Hosting
```bash
# Rollback to previous deployment
firebase hosting:rollback

# Verify
firebase hosting:channel:list
```

### For Vercel
```bash
# Promote previous deployment
vercel promote [PREVIOUS_DEPLOYMENT_URL] --scope [TEAM]

# Verify
vercel ls
```

### For GCP App Engine
```bash
# List versions
gcloud app versions list

# Split traffic (rollback)
gcloud app services set-traffic default --splits [BLUE_VERSION]=1 --split-by=ip

# Verify
gcloud app versions list --service=default
```

### For AWS Elastic Beanstalk
```bash
# List versions
aws elasticbeanstalk describe-environments

# Swap environment URLs (Blue-Green)
aws elasticbeanstalk swap-environment-cnames \
  --source-environment-name [GREEN_ENV] \
  --destination-environment-name [BLUE_ENV]
```

---

**Prepared by**: Operations Team  
**Approved by**: Platform Owner  
**Date**: 2026-01-31  
**Version**: v1.0  
**Last Tested**: [DATE TBD - Test before go-live]
