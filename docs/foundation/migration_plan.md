# แผนการย้ายข้อมูล: จาก Top-level สู่ Subcollection

**สถานะปัจจุบัน**: ข้อมูลถูกเก็บใน `seo_keywords`, `seo_pages`, `audit_logs` (Root Collections)
**สถานะเป้าหมาย**: ข้อมูลถูกเก็บใน `orgs/{orgId}/seo_keywords`, `orgs/{orgId}/seo_pages`, `orgs/{orgId}/audit_logs`

## ขั้นตอนที่ 1: การย้ายโค้ด (ทำทันที)
อัปเดตโค้ด Services ให้อ่าน/เขียนจากเส้นทางใหม่
- แก้ไข `services/keywords.ts`, `services/pages.ts`, `services/rank-history.ts`, `services/audit-logs.ts` ให้รับค่า `organizationId` และสร้าง path: `collection(db, 'orgs', organizationId, 'seo_keywords')`
- **DEPLOY** การเปลี่ยนแปลงนี้ ข้อมูลใหม่จะถูกเขียนลงที่ใหม่ทันที

## ขั้นตอนที่ 2: การย้ายข้อมูล (สคริปต์)
รันสคริปต์ (Node.js admin script) เพื่อย้ายเอกสารเดิม

```typescript
// ตัวอย่างตรรกะของ Admin Script
async function migrateKeywords() {
  const snapshot = await db.collection('seo_keywords').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const orgId = data.organizationId;
    if (orgId) {
      // คัดลอกไปที่ใหม่
      await db.collection('orgs').doc(orgId).collection('seo_keywords').doc(doc.id).set(data);
      // ลบอันเก่า (ตรวจสอบให้ดีก่อนลบ!)
      // await doc.ref.delete(); 
    }
  }
}
```

## ขั้นตอนที่ 3: การตรวจสอบ (Verification)
1. เข้าสู่ระบบในฐานะ Org A
2. ตรวจสอบหน้ารายการ Keyword (จะว่างเปล่าในช่วงแรกถ้ายังไม่ได้รัน Step 2)
3. สร้าง Keyword ใหม่ -> ควรปรากฏในรายการ
4. ตรวจสอบ Firestore Path -> ต้องเป็น `orgs/A/seo_keywords/NEW_ID`
5. รันสคริปต์ Migration (ถ้าจำเป็น)
6. ตรวจสอบว่า Keyword เก่ากลับมาแสดงผลแล้ว
