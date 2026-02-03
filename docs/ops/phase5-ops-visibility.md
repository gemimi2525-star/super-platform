# Phase 5: Operational Visibility — User Guide

> Version: 1.1 (Phase 5.4)  
> Last Updated: 3 กุมภาพันธ์ 2569

---

## 📊 Ops Center

แอปพลิเคชัน Admin Observability ที่เข้าถึงได้จาก Core OS Dock

### วิธีเปิดใช้งาน

1. ไปที่ https://www.apicoredata.com/os
2. Login ด้วย Platform Admin account
3. คลิกไอคอน 🎛️ (Ops Center) จาก Dock

### 4 แท็บหลัก

| แท็บ | ฟังก์ชัน |
|------|----------|
| **System Health** | สถานะระบบ, Build info, **Session Status** (ใหม่!) |
| **Audit Trail** | ดู audit logs พร้อม filter/search |
| **Incidents** | เหตุการณ์ผิดปกติ (ดูรายละเอียดด้านล่าง) |
| **API Monitor** | ตรวจสอบ endpoints + latency |

---

## 🔍 API Endpoints

### Health Check (Public)
```bash
curl https://www.apicoredata.com/api/platform/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-03T04:00:00Z",
    "build": { "commit": "abc1234", "environment": "production" },
    "project": { "kind": "apicoredata", "domain": "apicoredata.com" }
  }
}
```

### Session Debug (Authenticated) — Phase 5.4
```bash
curl https://www.apicoredata.com/api/platform/session-debug
```

Response (เมื่อ login แล้ว):
```json
{
  "success": true,
  "data": {
    "session": { "isAuth": true, "hasSessionCookie": true },
    "environment": { "vercelEnv": "production", "devBypassActive": false },
    "request": { "host": "www.apicoredata.com" }
  }
}
```

### Current User (Authenticated)
```bash
curl https://www.apicoredata.com/api/platform/me
```

### Audit Logs (Authenticated + RBAC)
```bash
curl "https://www.apicoredata.com/api/platform/audit-logs?limit=25&action=login"
```

Query params: `limit`, `cursor`, `action`, `actorId`, `startDate`, `endDate`, `success`

---

## ⚠️ Incident Signal Rules

### ไฮไลท์เป็น Incident

| Signal | Level | คำอธิบาย |
|--------|-------|----------|
| 5xx | 🔴 Critical | Server errors |
| 401/403 spike | 🟠 Warning | Auth failures |
| `DENY org.manage` | 🟠 Warning | Unauthorized org access |
| `DENY platform:users:write` | 🟠 Warning | Unauthorized user modification |

### ⚠️ Known Normal Behaviors

> **`DENY stepup.cancel`** = ผู้ใช้กด Cancel บน Step-up modal  
> ไม่ถือเป็น Incident! เป็น user-initiated cancellation

---

## 🔐 ทำไมบางครั้งเข้า /os ได้เลย? (Phase 5.4)

> **สาเหตุ 3 ประการหลัก:**

### 1. มี Session Cookie หลงเหลือ
- ถ้าเคย login มาก่อน, `__session` cookie ยังอยู่
- **วิธีแก้:** ใช้ **Incognito Window** หรือ Clear Cookies

### 2. Dev Bypass เปิดอยู่ (dev/preview เท่านั้น)
- `AUTH_DEV_BYPASS=true` ใช้ได้เฉพาะใน development และ preview deployments
- **ใน Production จะถูกล็อกอัตโนมัติ** ไม่ว่าจะตั้งค่าอย่างไร

### 3. Browser Cache
- บางครั้ง browser cache หน้าเก่าที่ render ก่อน auth check
- **วิธีแก้:** Hard refresh (Cmd+Shift+R) หรือ Clear Cache

### วิธีทดสอบ Auth Gate ที่ถูกต้อง

```bash
# 1. ตรวจสอบ Session (ไม่มี cookie)
curl -s https://www.apicoredata.com/api/auth/session | jq
# → Should return: {"isAuth": false}

# 2. ตรวจสอบ /os redirect
curl -sI https://www.apicoredata.com/os | grep -i location
# → Should return: Location: /login?callbackUrl=%2Fos
```

### Policy: Dev Bypass ใช้เฉพาะ dev/preview เท่านั้น

| Environment | AUTH_DEV_BYPASS |
|-------------|-----------------|
| Development (localhost) | ✅ Works if enabled |
| Vercel Preview | ✅ Works if enabled |
| **Production** | 🔒 **LOCKED** — ไม่ทำงานแม้ตั้งค่า |

---

## 🔧 Troubleshooting

### กรณี API ไม่ตอบ

1. ตรวจสอบ `/api/platform/health`
   - ถ้า 200 แต่แอปอื่นพัง → ดู Vercel logs
   - ถ้า 5xx → อาจมี deployment issue

2. รัน smoke test:
```bash
npm run ops:smoke
```

3. ตรวจสอบ Vercel Dashboard สำหรับ deployment status

### กรณี Audit Logs ไม่แสดง

1. ตรวจสอบว่า login แล้ว (401 = ยังไม่ login)
2. ตรวจสอบ role (ต้องเป็น owner หรือมี `audit:read` permission)
3. ตรวจสอบ Firestore indexes (500 + "index" error)

### กรณี Session Debug ใน Ops Center แสดง Error

1. อาจยังไม่ได้ login → ใช้ปุ่ม "Go to Login"
2. ตรวจสอบ network tab สำหรับ 401/500 errors

---

## 📋 Smoke Test Commands

```bash
# รัน smoke tests ทั้งหมด
npm run ops:smoke

# ผลลัพธ์ที่คาดหวัง (Phase 5.4)
✅ Login Page             → 200 OK
✅ OS Dashboard           → 307 (redirect)
✅ OS Auth Gate           → 307 → /login?callbackUrl
✅ Auth Session API       → 200 + isAuth
✅ Organizations API      → 401
✅ Me API (P5.1)          → 401
✅ Audit Logs API (P5.2)  → 401
✅ Health API (P5.3)      → 200 + healthy
✅ Session Debug (P5.4)   → 401 (protected)
```

---

## 🏷️ Phase 5 Files

| ไฟล์ | คำอธิบาย |
|------|----------|
| `app/api/platform/health/route.ts` | Health check endpoint |
| `app/api/platform/session-debug/route.ts` | Session debug endpoint (P5.4) |
| `app/api/platform/me/route.ts` | Current user endpoint |
| `app/api/platform/audit-logs/route.ts` | Audit logs endpoint |
| `coreos/manifests/ops.center.ts` | Ops Center capability manifest |
| `coreos/ui/OpsCenterMVP.tsx` | Ops Center UI (includes Session Status) |
| `scripts/smoke-test.ts` | Automated smoke tests |
| `middleware.ts` | Auth gate with Production Bypass Lock |
