# แผนผังเส้นทางและกลยุทธ์การป้องกัน (Route Map & Guard Strategy)

## 1. โครงสร้างเส้นทาง (Route Structure)

### กลุ่มสาธารณะ `(auth)`
- `/login`: หน้าเข้าสู่ระบบ
- `/register`: หน้าสมัครสมาชิก
- `/forgot-password`: หน้าลืมรหัสผ่าน

### กลุ่มแพลตฟอร์ม `(platform)`
**ตัวป้องกัน (Guard)**: ต้องการสิทธิ์ `user.role == 'platform_owner'`
- `/platform`: เปลี่ยนเส้นทางไป `/platform/tenants`
- `/platform/tenants`: รายชื่อองค์กรทั้งหมด
- `/platform/tenants/new`: เพิ่มองค์กรใหม่
- `/platform/tenants/[orgId]`: รายละเอียดองค์กร, เปิด/ปิดแอป
- `/platform/apps`: จัดการแคตตาล็อกแอปพลิเคชันส่วนกลาง
- `/platform/audit`: ดูบันทึกกิจกรรมของแพลตฟอร์ม

### กลุ่มผู้เช่า `(tenant)`
**ตัวป้องกัน (Guard)**: ต้องการ `user.orgId != null`
- `/app`: แดชบอร์ด (หน้าแรก)
- `/app/apps`: "App Store" ขององค์กร (รายการแอปที่เปิดใช้)
- `/app/settings`: การตั้งค่าองค์กร (เฉพาะ Admin)
- `/app/activity`: บันทึกกิจกรรมขององค์กร (แทนที่ `/seo/activity` เดิม โดยรวมไว้ที่นี่หรือใช้ `/app/seo/activity` ก็ได้)

### โมดูลผู้เช่า `(modules)`
**ตัวป้องกัน (Guard)**: ต้องการ `user.orgId` และ `app.isEnabled(appId)`

#### SEO Module (`appId: seo`)
- `/app/seo`: แดชบอร์ด SEO
- `/app/seo/keywords`: รายการคีย์เวิร์ด
- `/app/seo/pages`: รายการหน้าเว็บ
- `/app/seo/activity`: กิจกรรมเฉพาะ SEO

---

## 2. การติดตั้งตัวป้องกัน (Middleware Implementation)

### `middleware.ts`
1. **ตรวจสอบการยืนยันตัวตน (Auth Check)**: หากไม่มี Session -> ส่งไป `/login`
2. **ตรวจสอบแพลตฟอร์ม (Platform Check)**: หากเส้นทางขึ้นต้นด้วย `/platform`:
   - ตรวจสอบ `token.role === 'platform_owner'`
   - หากไม่ใช่ -> 403 Forbidden หรือส่งไป `/app`
3. **ตรวจสอบผู้เช่า (Tenant Check)**: หากเส้นทางขึ้นต้นด้วย `/app`:
   - ตรวจสอบว่ามี `token.orgId` หรือไม่
   - หากไม่มี -> ส่งไปหน้า `/onboarding` หรือ `/login`

### ตัวป้องกันระดับโมดูล (Module Guard ใน Server Components)
ภายในไฟล์ `/app/[module]/layout.tsx`:
1. ดึงค่า `orgId`
2. ตรวจสอบเอกสาร `db.doc(orgs/{orgId}/enabled_apps/{moduleId})`
3. หากไม่มี -> แสดงข้อความ "App Not Enabled" หรือเปลี่ยนเส้นทางไป `/app`
