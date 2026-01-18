# ข้อกำหนดโครงสร้าง Firestore (Firestore Schema Specification)

## 1. คอลเลกชันระดับโกลบอล (Platform Scope)

### `apps_catalog`
*คำจำกัดความของโมดูลที่มีให้ใช้งานทั้งหมด*
- `id`: string (รหัสแอป เช่น "seo-pro")
- `name`: string ("SEO Pro")
- `version`: string
- `status`: "active" | "deprecated" | "beta"
- `requiredRoles`: string[]

### `platform_audit_logs`
*บันทึกกิจกรรมของผู้ดูแลระบบแพลตฟอร์ม (Platform Owners)*
- `id`: auto-id
- `actorId`: string (userId)
- `action`: string ("org.create", "app.update")
- `targetOrgId`: string (ระบุหรือไม่ก็ได้)
- `timestamp`: serverTimestamp

### `orgs`
*เอกสารหลักสำหรับผู้เช่าแต่ละราย (Root document)*
- `id`: string (orgId)
- `name`: string
- `status`: "active" | "suspended"
- `createdAt`: timestamp

---

## 2. คอลเลกชันย่อยของผู้เช่า (Subcollections under `orgs/{orgId}`)

### `orgs/{orgId}/memberships`
*ผู้ใช้งานที่สังกัดในองค์กรนี้*
- `id`: string (userId)
- `email`: string
- `role`: "org_admin" | "org_member"
- `status`: "active" | "disabled"

### `orgs/{orgId}/enabled_apps`
*แอปพลิเคชันที่เปิดใช้งานสำหรับองค์กรนี้*
- `id`: string (รหัสแอป ตรงกับ `apps_catalog`)
- `enabledAt`: timestamp
- `config`: map (การตั้งค่าเฉพาะของแอป)

### `orgs/{orgId}/seo_pages` (Module: SEO)
*เดิมคือ `seo_pages` (top-level)*
- `id`: auto-id
- `url`: string
- `title`: string
- `siteId`: string

### `orgs/{orgId}/seo_keywords` (Module: SEO)
*เดิมคือ `seo_keywords` (top-level)*
- `id`: auto-id
- `term`: string
- `pageId`: string (ref)
- `ranking`: map
- *Index*: `createdAt DESC`

### `orgs/{orgId}/seo_rank_history` (Module: SEO)
*ประวัติการตรวจสอบอันดับ*
- `id`: auto-id
- `keywordId`: string
- `rank`: number
- `date`: string (YYYY-MM-DD)

### `orgs/{orgId}/audit_logs`
*บันทึกกิจกรรมระดับองค์กร*
- `id`: auto-id
- `action`: string
- `actor`: map { userId, email }
- `entity`: map { type, id, name }
- `timestamp`: serverTimestamp
