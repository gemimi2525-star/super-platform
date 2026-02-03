# Phase 5: Operational Visibility — User Guide

> Version: 1.0  
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
| **System Health** | สถานะระบบ, Build info, Current user |
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

---

## 📋 Smoke Test Commands

```bash
# รัน smoke tests ทั้งหมด
npm run ops:smoke

# ผลลัพธ์ที่คาดหวัง
✅ Login Page          → 200 OK
✅ OS Dashboard        → 200 OK  
✅ Auth Session API    → 200 + isAuth
✅ Organizations API   → 200/401
✅ Me API (P5.1)       → 200/401
✅ Audit Logs API (P5.2) → 200/401/403
✅ Health API (P5.3)   → 200 + healthy
```

---

## 🏷️ Phase 5 Files

| ไฟล์ | คำอธิบาย |
|------|----------|
| `app/api/platform/health/route.ts` | Health check endpoint |
| `app/api/platform/me/route.ts` | Current user endpoint |
| `app/api/platform/audit-logs/route.ts` | Audit logs endpoint |
| `coreos/manifests/ops.center.ts` | Ops Center capability manifest |
| `coreos/ui/OpsCenterMVP.tsx` | Ops Center UI (4 tabs) |
| `scripts/smoke-test.ts` | Automated smoke tests |
