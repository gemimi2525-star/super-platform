# กลยุทธ์ความปลอดภัย (Security Rules Strategy)

## กลยุทธ์ (Strategy)
เราใช้ **รูปแบบ Subcollection** เพื่อบังคับใช้การแยกข้อมูล (Data Isolation) ในระดับฐานข้อมูล
ด้วยการซ้อนข้อมูลไว้ภายใต้ `orgs/{orgId}` เราสามารถเขียนกฎ Wildcard เพียงกฎเดียวที่ครอบคลุมการเข้าถึงข้อมูลของผู้เช่าได้ถึง 99%

## กฎที่นำเสนอ (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ฟังก์ชันช่วยตรวจสอบ
    function isOrgMember(orgId) {
      return request.auth != null && request.auth.token.orgId == orgId;
    }

    function isPlatformOwner() {
      return request.auth != null && request.auth.token.role == 'platform_owner';
    }

    // 1. คอลเลกชันระดับแพลตฟอร์ม (Platform Global Collections)
    match /apps_catalog/{appId} {
      allow read: if request.auth != null; // ผู้ใช้ทุกคนดูรายการแอปได้
      allow write: if isPlatformOwner();
    }

    match /platform_audit_logs/{logId} {
      allow read, write: if isPlatformOwner();
    }

    match /orgs/{orgId} {
      // ข้อมูลเมตาขององค์กร (เช่น ชื่อ)
      allow read: if isOrgMember(orgId) || isPlatformOwner();
      allow write: if isPlatformOwner(); // เฉพาะเจ้าของแพลตฟอร์มที่สร้างองค์กร หรือ org_admin แก้ไข setting?

      // 2. การแยก Subcollection อย่างเข้มงวด
      // นำไปใช้กับเอกสารใดๆ ใน Subcollection ใดๆ ภายใต้ orgs/{orgId}
      match /{collectionName}/{docId} {
         allow read, write: if isOrgMember(orgId);
      }
      
      // การระบุเฉพาะเจาะจงสำหรับคอลเลกชันที่ละเอียดอ่อน (ถ้ามี)
      match /enabled_apps/{appId} {
         allow read: if isOrgMember(orgId);
         allow write: if isPlatformOwner(); // ผู้เช่าเปิดแอปเองไม่ได้ (ต้องผ่าน subscription)
      }
    }
  }
}
```

## หมายเหตุการย้ายระบบ (Migration Note)
ปัจจุบัน โค้ดเบสใช้ `seo_keywords` แบบ top-level ซึ่ง **ไม่ครอบคลุม** ด้วยกฎข้างต้นและถือว่าไม่ปลอดภัย (พึ่งพาแต่การ query filter)
เรา **จำเป็นต้อง** ย้ายข้อมูลไปสู่โครงสร้างใหม่เพื่อให้กฎเหล่านี้ใช้งานได้จริง
