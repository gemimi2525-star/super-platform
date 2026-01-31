# Auth Gate Smoke Test Checklist

> **Purpose:** Prevent auth regressions. Run this checklist after ANY changes to auth/middleware/session code.

## Pre-requisites
- Dev server running (`npm run dev`)
- Browser DevTools open (Network + Application tabs)
- Test credentials: `admin@apicoredata.com` / `Password@123`

---

## ✅ Smoke Test Checklist

### 1. Login Page Access
- [ ] Navigate to `/en/auth/login`
- [ ] Page loads with status `200`
- [ ] Google Login shows "Temporarily Disabled" message
- [ ] Email/Password form is visible

### 2. Login Flow
- [ ] Enter test credentials
- [ ] Click "Sign In"
- [ ] Network shows `POST /api/auth/session -> 200`
- [ ] Console shows `[Session] ✅ Session cookie should be set!`
- [ ] Automatic redirect to `/en/v2`

### 3. Session Cookie Verification
- [ ] DevTools → Application → Cookies → `localhost:3000`
- [ ] Cookie `__session` exists
- [ ] Cookie is `HttpOnly` (not visible in `document.cookie`)

### 4. Middleware Authorization
- [ ] Server logs show: `hasSession: true`
- [ ] Server logs show: `decision: 'ALLOW'`
- [ ] No redirect to login page

### 5. Session Persistence (Refresh Test)
- [ ] Refresh `/en/v2` page (F5)
- [ ] Page reloads successfully
- [ ] No redirect to login
- [ ] `__session` cookie still exists

### 6. Logout Flow
- [ ] Click "Logout" button
- [ ] Network shows `DELETE /api/auth/session -> 200`
- [ ] Redirect to `/en/auth/login`
- [ ] Cookie `__session` is deleted
- [ ] Attempting to access `/en/v2` redirects to login

---

## 🚨 Failure Indicators (STOP if any occur)

| Symptom | Meaning |
|---------|---------|
| Redirect loop between `/v2` and `/login` | Session not being created or read |
| `hasSession: false` after login | Cookie not set or not sent |
| Unexpected `DELETE /api/auth/session` after login | Auth state race condition |
| Cookie exists but still redirected | Middleware not reading cookie |

---

## 📝 Test Results Template

```
Date: YYYY-MM-DD HH:mm
Tester: [Name/Agent]
Build: [commit hash if known]

Results:
- Login Access: PASS / FAIL
- Login Flow: PASS / FAIL  
- Session Cookie: PASS / FAIL
- Middleware Auth: PASS / FAIL
- Session Persistence: PASS / FAIL
- Logout Flow: PASS / FAIL

Overall: ✅ PASS / ❌ FAIL
Notes: [any observations]
```

---

## 🔧 Quick Fixes for Common Issues

### Cookie not being set
1. Check `/api/auth/session` response status
2. Verify `credentials: 'include'` in fetch
3. Check `SameSite` cookie attribute

### Middleware not seeing cookie
1. Check cookie name matches (`__session`)
2. Verify cookie path is `/`
3. Check request headers include cookie

### Unexpected logout
1. Check `AuthProvider.tsx` for race conditions
2. Look for unintended `DELETE /api/auth/session` calls
3. Verify `onAuthStateChanged` logic

---

*Last updated: 2026-01-27*
