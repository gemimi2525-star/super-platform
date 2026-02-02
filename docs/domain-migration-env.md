# Domain Migration ENV Setup

**Target Domain**: `www.synapsegovernance.com`  
**Date**: February 2, 2026

---

## Environment Variable Configuration

### Vercel Production Environment

**Steps**:
1. Go to: https://vercel.com/dashboard
2. Select project: `apicoredata-platform`
3. Navigate to: **Settings** → **Environment Variables**
4. Find or add: `NEXT_PUBLIC_SERVER_URL`

**Configuration**:
```
Key:   NEXT_PUBLIC_SERVER_URL
Value: https://www.synapsegovernance.com
Environments: ☑ Production
```

5. Click **Save**
6. **Redeploy** the project:
   - Go to **Deployments** tab
   - Click on latest deployment
   - Click **Redeploy**

---

## Local Development (Optional)

If you want to test locally with the new domain:

**File**: `.env.local` (create if doesn't exist)

```bash
NEXT_PUBLIC_SERVER_URL=https://www.synapsegovernance.com
```

**Note**: This is optional for local testing. Production ENV in Vercel is what matters.

---

## Verification After ENV Set

### Sitemap Check
```bash
curl https://www.synapsegovernance.com/sitemap.xml | grep -o 'https://[^<]*' | head -5
```

**Expected**:
```
https://www.synapsegovernance.com/en/trust
https://www.synapsegovernance.com/th/trust
https://www.synapsegovernance.com/en/trust/governance
https://www.synapsegovernance.com/th/trust/governance
https://www.synapsegovernance.com/en/trust/news
```

**Must NOT contain**: `apicoredata.com` URLs

### Page Metadata Check
```bash
curl -s https://www.synapsegovernance.com/en/trust | grep -E "(canonical|alternate)" | head -3
```

**Expected**:
```html
<link rel="canonical" href="https://www.synapsegovernance.com/en/trust"/>
<link rel="alternate" hreflang="en" href="https://www.synapsegovernance.com/en/trust"/>
<link rel="alternate" hreflang="th" href="https://www.synapsegovernance.com/th/trust"/>
```

---

## Fallback Behavior

**If ENV not set**:
- Sitemap will use relative URLs or `localhost`
- Canonical URLs may be incorrect
- OpenGraph URLs may be missing or wrong

**Impact**: SEO degraded, duplicate content possible

**Fix**: Set ENV and redeploy

---

## Troubleshooting

### Issue: Sitemap still shows old domain
**Cause**: ENV not set or not redeployed  
**Fix**:
1. Verify ENV exists in Vercel settings
2. Trigger new deployment
3. Wait 2-3 minutes for build
4. Clear browser cache
5. Check sitemap again

### Issue: Mixed URLs (some old, some new)
**Cause**: Cache or partial deployment  
**Fix**:
1. Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
2. Check in incognito/private window
3. Verify deployment completed successfully

---

## Rollback

If issues arise, revert ENV:
```
NEXT_PUBLIC_SERVER_URL=https://www.apicoredata.com
```

Then redeploy.

---

**Status**: Ready to configure in Vercel
