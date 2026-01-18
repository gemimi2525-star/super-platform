# แนวคิดแพลตฟอร์ม (Platform Concept)

## 1. คำจำกัดความหลัก (Core Definitions)

### แพลตฟอร์ม (Platform / The Owner)
- **ตัวตน**: เราคือ "Super Platform" ผู้เป็นเจ้าของโครงสร้างพื้นฐาน โค้ด และแอปพลิเคชันทั้งหมด
- **บทบาท**: มีหน้าที่อนุมัติองค์กร (Organizations) จัดการแคตตาล็อกแอปพลิเคชันส่วนกลาง (Apps Catalog) และกำหนดกฎเกณฑ์ระดับแพลตฟอร์ม
- **ขอบเขตข้อมูล**: สามารถมองเห็น `apps_catalog`, `platform_audit_logs` และรายชื่อ `orgs` ได้ แต่ **ไม่มีสิทธิ์** อ่านข้อมูลทางธุรกิจของผู้เช่า (Tenant) เว้นแต่ได้รับอนุญาตอย่างชัดเจน (เช่น เพื่อการ Support)

### องค์กร (Organization / Tenant)
- **ตัวตน**: เอนทิตีลูกค้า (เช่น "บริษัท Acme Corp")
- **การแยกส่วน (Isolation)**: แต่ละองค์กรจะถูกแยกออกจากกันอย่างชัดเจน (Logical Silo)
- **แอปพลิเคชัน**: องค์กรทำการ "เปิดใช้งาน" แอปจากแคตตาล็อก และจะเห็นเฉพาะข้อมูลของแอปที่ตนเองเปิดใช้งานเท่านั้น
- **ขอบเขตข้อมูล**: จำกัดอยู่อย่างเคร่งครัดที่ `orgs/{theirOrgId}`

### ผู้ใช้งาน (User)
- **ตัวตน**: สมาชิกขององค์กรใดองค์กรหนึ่ง (ONE Organization)
- **บทบาท**:
  - `platform_owner`: ผู้ดูแลระบบสูงสุด (Super Admin) เข้าถึง `/platform`
  - `org_admin`: ผู้ดูแลองค์กร (Tenant Admin) จัดการผู้ใช้และการตั้งค่าใน `/app`
  - `org_member`: ผู้ใช้ทั่วไป ใช้งานแอปที่เปิดอยู่ใน `/app`

## 2. การแบ่งแยกหน้าจอการทำงาน (Interface Separation)

| อินเทอร์เฟซ | เส้นทาง URL | ผู้ใช้งานที่จำเป็น | วัตถุประสงค์ |
| :--- | :--- | :--- | :--- |
| **Platform Console** | `/platform/*` | `platform_owner` | จัดการผู้เช่า (Tenants), แคตตาล็อกแอป, การตั้งค่าส่วนกลาง |
| **Tenant Portal** | `/app/*` | `org_admin` หรือ `org_member` | การทำงานประจำวัน (เช่น SEO), จัดการตั้งค่าองค์กร |

*หมายเหตุ: หน้าสาธารณะ (Login, Landing Page) จะอยู่ที่ root `/`*

## 3. หลักการแยกข้อมูล (Data Isolation Principle)
**รูปแบบ Subcollection ที่เข้มงวด**: ข้อมูลของผู้เช่าทั้งหมดจะอยู่ภายใต้:
`orgs/{orgId}/[collectionName]/[docId]`

- **❌ "ไม่ควรทำ" (BAD)**: `db.collection('keywords').where('orgId', '==', 'X')` (เก็บรวมกันแล้วกรองเอา)
- **✅ "ต้องทำ" (GOOD)**: `db.collection('orgs').doc('X').collection('keywords')` (เก็บแยกใน Subcollection)

การออกแบบนี้ช่วยให้การเขียน Firestore Security Rules เรียบง่ายและปลอดภัย:
```match /orgs/{orgId}/{document=**} { allow read, write: if request.auth.token.orgId == orgId; }```
