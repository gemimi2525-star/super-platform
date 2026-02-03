# Operations Runbook
## APICOREDATA Production Monitoring

### Vercel Monitoring Points

#### 🔴 Critical Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| Build Fail | Any | Check logs, rollback if needed |
| 5xx Rate | > 1% | Check Firebase connection |
| Auth Errors | Spike | Check session/cookie config |

#### 🟡 Warning Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| 404 Spike | > 10/min | Check routes, redirects |
| Response Time | > 3s | Check DB queries |
| Function Cold Starts | > 5s | Consider optimization |

### Quick Diagnostics

```bash
# 1. Check deployment status
curl -sI https://www.apicoredata.com | head -5

# 2. Check auth system
curl -s https://www.apicoredata.com/api/auth/session

# 3. Check orgs API
curl -s https://www.apicoredata.com/api/platform/orgs

# 4. Check me API (P5.1)
curl -s https://www.apicoredata.com/api/platform/me

# 5. Check audit logs API (P5.2)
curl -s https://www.apicoredata.com/api/platform/audit-logs

# 6. Check trust redirect
curl -sI https://www.apicoredata.com/en/trust | grep -i location
```

### Vercel Dashboard Links
- Project: `apicoredata-core-os`
- Logs: Vercel Dashboard → Logs tab
- Deployments: Vercel Dashboard → Deployments tab

### Escalation Path
1. **L1**: Check smoke test, recent deployments
2. **L2**: Review Vercel function logs
3. **L3**: Check Firebase console, env vars

### Common Issues

#### LEGACY_ROUTE_DISABLED (503)
- **Cause**: Route uses disabled template
- **Fix**: Restore from git history, use inline constants
- **Pattern**: See orgs restoration commit `cd3d89c`

#### Webpack Path Resolution
- **Symptom**: `collectionPath is not a valid resource path`
- **Cause**: `@/lib/firebase/collections` import = undefined
- **Fix**: Use inline `const COLLECTION_NAME = 'name'`

#### Session Cookie Issues
- **Symptom**: Auth works then fails
- **Check**: Cookie domain, secure flag, expiry

### Phase 5 Debug Guide

#### /api/platform/me returns 500
- **Check**: `platform_users` collection exists in Firestore
- **Check**: User document exists for authenticated UID
- **Log**: Error includes errorId for Vercel log search

#### /api/platform/audit-logs returns 403
- **Cause**: User lacks `platform:audit:read` permission
- **Fix**: Only owner role has automatic access

#### Audit Logs Missing Index
- **Symptom**: 500 with "Missing index configuration"
- **Fix**: Create composite index in Firebase Console
