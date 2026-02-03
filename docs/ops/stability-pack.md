# Production Stability Pack
## APICOREDATA v2.23+

### Baseline Metrics

| Endpoint | Expected Status | Expected Response |
|----------|----------------|-------------------|
| `/en/login` | 200 | HTML page |
| `/os` | 200 | HTML page (requires auth) |
| `/api/auth/session` | 200 | `{"isAuth":true/false,...}` |
| `/api/platform/orgs` | 200/401 | `{"success":true,...}` or Unauthorized |
| `/api/platform/users` | 200/401 | `{"success":true,...}` or Unauthorized |
| `/api/platform/me` | 200/401 | Current user context |
| `/api/platform/audit-logs` | 200/401/403 | Audit log entries |
| `/en/trust` | 301/308 | Redirect → synapsegovernance.com |

### Smoke Test Checklist

```bash
# Run automated smoke test
npm run ops:smoke
```

#### Manual Check (if automated fails)
1. ✅ `curl -sI https://www.apicoredata.com/en/login | head -1` → `HTTP/2 200`
2. ✅ `curl -s https://www.apicoredata.com/api/auth/session | jq .isAuth` → `true/false`
3. ✅ `curl -s https://www.apicoredata.com/api/platform/orgs` → Not 503
4. ✅ `curl -s https://www.apicoredata.com/api/platform/me` → Not 503
5. ✅ `curl -s https://www.apicoredata.com/api/platform/audit-logs` → Not 503
6. ✅ `curl -sI https://www.apicoredata.com/en/trust | grep location` → synapsegovernance

### Recovery Procedures

#### Login Broken
1. Check `FIREBASE_*` env vars in Vercel
2. Verify Firebase Admin SDK initialization in logs
3. Check `lib/firebase-admin/index.ts`

#### Organizations 503
1. Check for webpack path resolution issues
2. Verify inline constants vs imports
3. See [ORGANIZATIONS_RESTORATION.md](file:///Users/jukkritsuwannakum/.gemini/antigravity/knowledge/apicoredata-platform/artifacts/implementation/ORGANIZATIONS_RESTORATION.md)

#### Trust Center Redirect Broken
1. Check `middleware.ts` host detection
2. Verify `NEXT_PUBLIC_SERVER_URL` env var
3. Check synapsegovernance.com Vercel deployment

### Version History
| Version | Date | Change |
|---------|------|--------|
| 2.24 | 2026-02-03 | Phase 5 (me, audit-logs) |
| 2.23 | 2026-02-02 | Organizations+Users restored |
| 2.22 | 2026-02-02 | Login restored |
| 2.21 | 2026-02-01 | TC-1.2 Live |
