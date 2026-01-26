# Error ID Debug Playbook

คู่มือสำหรับ debug production errors ผ่าน Error ID

---

## 1. Error ID คืออะไร?

**Error ID** คือ unique identifier ที่ระบบสร้างขึ้นทุกครั้งที่เกิด error ในระดับ API เพื่อให้ติดตามและ debug ได้ง่าย

**รูปแบบ:** `err_<timestamp>_<random>`

**ตัวอย่าง:** `err_1737390368_abc12`

### ผู้ใช้หา Error ID ได้จากไหน?

จาก API error response:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "errorId": "err_1737390368_abc12",
    "timestamp": "2026-01-20T15:46:08Z"
  }
}
```

---

## 2. รูปแบบ Log มาตรฐาน

```
[API] <METHOD> <PATH> [<errorId>]: <message>
```

**ตัวอย่าง:**
```
[API] GET /api/roles [err_1737390368_abc12]: Role not found
[API] POST /api/roles [err_1737390370_def45]: Validation failed
[API] DELETE /api/roles/[id] [err_1737390375_ghi78]: Cannot delete system role
```

---

## 3. ขั้นตอน Debug

### Step 1: รับข้อมูลจากผู้ใช้
- **Error ID** (เช่น `err_1737390368_abc12`)
- **เวลาที่เกิด error** (ประมาณเวลา)
- **การกระทำที่ทำ** (เช่น สร้าง role, ลบ user)

### Step 2: ระบุ Timestamp
Error ID มี timestamp ฝังอยู่ในตัว:
```
err_1737390368_abc12
     ^^^^^^^^^
     timestamp (Unix seconds)
```

แปลงเป็นเวลาที่อ่านได้:
```bash
date -r 1737390368
# Output: Mon Jan 20 15:46:08 +07 2026
```

### Step 3: ค้นหาใน Logs
ใช้ Error ID ค้นหาใน log system:

```bash
# ตัวอย่าง: ค้นหาใน console logs
grep "err_1737390368_abc12" /var/log/app/*.log

# หรือใน log aggregation service
# Splunk: errorId="err_1737390368_abc12"
# CloudWatch: { $.errorId = "err_1737390368_abc12" }
```

### Step 4: วิเคราะห์ Log Entry
จาก log entry จะได้ข้อมูล:
- **Method**: GET, POST, PUT, DELETE
- **Path**: endpoint ที่เกิด error
- **Message**: คำอธิบาย error
- **Extra context**: ข้อมูลเพิ่มเติม (ถ้ามี) เช่น `{ id: "role-123" }`

### Step 5: แยกประเภท Error

#### ✅ Validation Error (`VALIDATION_ERROR`)
```
[API] POST /api/roles [err_xxx]: Validation failed
```
- **ตรวจสอบ:** field errors ใน response
- **แก้ไข:** ปรับ input validation หรือแจ้งผู้ใช้แก้ input

#### ❌ Not Found (`NOT_FOUND`)
```
[API] GET /api/roles/[id] [err_xxx]: Role not found
```
- **ตรวจสอบ:** ID ที่ request มาถูกต้องหรือไม่
- **แก้ไข:** ตรวจสอบว่า resource ถูกลบไปหรือยัง

#### ⚠️ Internal Error (`INTERNAL_ERROR`)
```
[API] GET /api/roles [err_xxx]: Database connection failed
```
- **ตรวจสอบ:** message และ extra context
- **แก้ไข:** ดู infrastructure (DB, network, services)

---

## 4. ตัวอย่างการ Debug

### 🔍 Case 1: Validation Error

**รายงานจากผู้ใช้:**
> "ไม่สามารถสร้าง role ใหม่ได้ Error ID: err_1737390370_def45"

**ขั้นตอน:**

1. **ค้นหา log:**
   ```
   [API] POST /api/roles [err_1737390370_def45]: Validation failed
   ```

2. **ตรวจสอบ response:**
   ```json
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "errors": [
         {
           "field": "name",
           "message": "Name is required",
           "code": "too_small"
         }
       ]
     }
   }
   ```

3. **วินิจฉัย:** ผู้ใช้ลืมใส่ชื่อ role

4. **แก้ไข:** แจ้งผู้ใช้ให้ใส่ชื่อ role

---

### 🔍 Case 2: Internal Error

**รายงานจากผู้ใช้:**
> "ไม่สามารถดู role ได้ Error ID: err_1737390375_ghi78"

**ขั้นตอน:**

1. **ค้นหา log:**
   ```
   [API] GET /api/roles/[id] [err_1737390375_ghi78]: Firestore unavailable { id: "role-admin" }
   ```

2. **วิเคราะห์:**
   - Method: GET
   - Path: /api/roles/[id]
   - Extra: `{ id: "role-admin" }`
   - Message: Firestore unavailable

3. **วินิจฉัย:** Database connection issue

4. **ขั้นตอนแก้ไข:**
   - ตรวจสอบ Firestore status
   - ตรวจสอบ network connectivity
   - ตรวจสอบ service account credentials
   - ตรวจสอบ rate limits/quotas

5. **Follow-up:**
   - ดู logs ในช่วงเวลาเดียวกัน (±5 นาที)
   - ตรวจสอบว่ามี error pattern เดียวกันหรือไม่
   - ดู monitoring metrics (CPU, memory, network)

---

## 5. Best Practices

### สำหรับ Developers
- ✅ ใส่ Error ID ใน error response เสมอ
- ✅ ใช้ `logApiError()` สำหรับ logging
- ✅ เพิ่ม extra context ที่เป็นประโยชน์ (แต่ไม่ใช่ข้อมูลลับ)

### สำหรับ Support Team
- ✅ เก็บ Error ID จากผู้ใช้เสมอ
- ✅ บันทึกเวลาและการกระทำที่ทำ
- ✅ ส่งต่อ Error ID ให้ทีม Dev พร้อม context

### สำหรับ Monitoring
- ✅ ตั้ง alert สำหรับ error rate สูง
- ✅ Track error patterns โดยใช้ error code
- ✅ สร้าง dashboard แสดง error trends

---

## 6. เครื่องมือที่แนะนำ

### Log Search
- **grep**: สำหรับ local logs
- **CloudWatch Logs Insights**: AWS
- **Splunk**: Enterprise logging
- **Datadog**: APM + Logging

### Monitoring
- **Sentry**: Error tracking
- **New Relic**: APM
- **Prometheus + Grafana**: Metrics

---

## 7. คำถามที่พบบ่อย

**Q: Error ID ซ้ำกันได้ไหม?**  
A: ไม่ เพราะมี timestamp + random string รวมกัน

**Q: Error ID หายไปจาก log ได้ไหม?**  
A: ได้ ถ้า log rotation เร็วเกินไป ควร configure log retention ให้เหมาะสม

**Q: ควร log อะไรใน extra context?**  
A: ข้อมูลที่ช่วย debug เช่น ID, action type แต่ห้าม log password, token, PII

---

**Last Updated:** 2026-01-20  
**Version:** 1.0
