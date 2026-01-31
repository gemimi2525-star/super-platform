# SYNAPSE Whitepaper — Chapter 2
## Authority, Determinism, and Legitimacy

> *"ระบบที่ไม่รู้ว่าใครมีอำนาจ คือระบบที่ไม่รู้ว่าตนคืออะไร"*

---

## บทนำ

ระบบปฏิบัติการคือโครงสร้างพื้นฐานของอำนาจดิจิทัล
มันไม่ใช่แค่ซอฟต์แวร์ที่รัน — มันคือกรอบที่กำหนดว่า
"ใครทำอะไรได้" และ "ใครต้องถามก่อน"

SYNAPSE ถูกออกแบบบนสมมติฐานว่า:
**อำนาจต้องถูกออกแบบอย่างตั้งใจ — ไม่ใช่เกิดขึ้นเอง**

บทนี้อธิบายหลักการ 5 ประการของ Authority Model
และเหตุผลว่าทำไม Determinism คือพื้นฐานของความชอบธรรม

---

## 2.1 Human as Source of Intent

### หลักการ

> ทุกการกระทำในระบบต้องเริ่มต้นจากมนุษย์

มนุษย์คือ **แหล่งกำเนิดของเจตนา (Intent)**
ไม่มีกระบวนการใดในระบบที่ควรเกิดขึ้นโดยไม่มีเจตนาจากมนุษย์เป็นต้นทาง

### ความหมายเชิงระบบ

- **Intent** คือหน่วยพื้นฐานของการร้องขอ
- ทุก Intent ต้องมี **CorrelationId** เพื่อระบุแหล่งที่มา
- ระบบไม่สร้าง Intent เอง — ระบบตอบสนอง Intent เท่านั้น

### สิ่งที่ SYNAPSE ห้าม

- ❌ Background automation ที่ไม่มี trigger จากมนุษย์
- ❌ AI-initiated actions
- ❌ Implicit execution (ทำโดยไม่ขออนุญาต)
- ❌ Engagement-driven automation (ทำเพื่อดึง attention)

### เหตุผล

ถ้าระบบสามารถ "ตัดสินใจแทนมนุษย์" ได้
มันไม่ใช่เครื่องมือ — มันคือเจ้านาย

SYNAPSE เลือกเป็นเครื่องมือ

---

## 2.2 Policy as Highest Authority

### หลักการ

> Policy คือกฎหมายของระบบ
> ไม่มีใครอยู่เหนือ Policy — รวมถึง Kernel เอง

ทุก Intent ที่เข้าสู่ระบบต้องผ่าน **Policy Engine**
Policy Engine ทำหน้าที่ตัดสินว่า:
- `allow` — อนุญาต
- `deny` — ปฏิเสธ
- `require_stepup` — ต้องยืนยันตัวตนเพิ่ม
- `degrade` — อนุญาตแบบจำกัด

### ลำดับการตัดสิน (Resolution Order)

```
1. locked     → ปฏิเสธทุกอย่าง (ยกเว้น unlock)
2. step-up   → ถ้า capability ต้องการ และยังไม่ verify
3. deny      → ถ้าไม่มี policy อนุญาต
4. unknown   → capability ไม่รู้จัก = ปฏิเสธ
5. allow     → ผ่านทุกเงื่อนไข = อนุญาต
```

### สิ่งที่ SYNAPSE ห้าม

- ❌ Hardcoded permission ใน component
- ❌ UI ที่ bypass policy
- ❌ Feature flag ที่ข้าม policy
- ❌ "Admin override" ที่ไม่ผ่าน policy

### เหตุผล

ระบบที่มี "ทางลัด" รอบ policy
คือระบบที่ policy ไม่มีความหมาย

SYNAPSE ไม่มีทางลัด

---

## 2.3 Kernel as Source of Truth

### หลักการ

> Kernel คือแหล่งความจริงเดียวของระบบ
> ถ้า Kernel ไม่รู้ — มันไม่มีอยู่จริง

**SystemState** ใน Kernel คือสถานะที่ถูกต้องที่สุด
UI อ่านจาก State — UI ไม่สร้าง State เอง

### โครงสร้าง

```
Kernel
├─ State Store (Single Source of Truth)
├─ Event Bus (Communication Channel)
├─ Policy Engine (Authority)
├─ Capability Graph (What Can Be Done)
└─ Window Manager (Visualization)
```

### สิ่งที่ SYNAPSE ห้าม

- ❌ UI-local state ที่ขัดกับ Kernel state
- ❌ Optimistic update ที่ไม่ sync กลับ
- ❌ Multiple sources of truth
- ❌ State ใน URL (URL = bootstrap only)

### เหตุผล

ระบบที่มี "หลายความจริง" คือระบบที่โกหกตัวเอง
SYNAPSE มีความจริงเดียว — อยู่ใน Kernel

---

## 2.4 Intelligence without Authority

### หลักการ

> AI มีปัญญา — แต่ไม่มีอำนาจ
> AI อ่านได้ แต่สั่งไม่ได้

Intelligence Layer อยู่ "ใต้" Kernel และ Policy
มันสามารถ:
- อ่าน State (immutable snapshot)
- Subscribe Events (read-only)
- ให้ Insight และ Explanation
- แนะนำ Capability (passive)

มันไม่สามารถ:
- ❌ Emit Intent
- ❌ Mutate State
- ❌ Bypass Policy
- ❌ Auto-execute

### การทดสอบความถูกต้อง

> ถ้าถอด Intelligence Layer ออก — ระบบต้องทำงานเหมือนเดิม 100%

ถ้าระบบพังเมื่อไม่มี AI = AI มี authority มากเกินไป

### ตำแหน่งเชิงสถาปัตยกรรม

```
Human Intent
     ↓
SYNAPSE Kernel
├─ Policy Engine      ← Authority สูงสุด
├─ Capability Graph
├─ State Engine
├─ Window Manager
├─ Event Bus
└─ Intelligence Layer ← READ-ONLY
```

### เหตุผล

AI ที่มีอำนาจคือ AI ที่ควบคุมมนุษย์
SYNAPSE ใช้ AI เพื่อ "เข้าใจมนุษย์มากขึ้น"
ไม่ใช่เพื่อ "ตัดสินใจแทนมนุษย์"

---

## 2.5 Why Non-Deterministic Authority Breaks Trust

### หลักการ

> ความน่าเชื่อถือเกิดจากความสามารถทำนายได้
> ระบบที่ unpredictable คือระบบที่ไม่น่าไว้ใจ

### Determinism ใน SYNAPSE หมายความว่า:

1. **เดียวกัน Input → เดียวกัน Output**
   - Intent เดียวกัน + State เดียวกัน = ผลลัพธ์เดียวกัน

2. **ลำดับชัดเจน**
   - Intent → Policy → Capability → Window
   - ไม่มี shortcut, ไม่มี random path

3. **Policy เปลี่ยน = Behavior เปลี่ยน**
   - การเปลี่ยนแปลงพฤติกรรมต้องมาจาก Policy เท่านั้น
   - ไม่เปลี่ยนจาก AI, UI หรือ external factor

### สิ่งที่ทำลาย Determinism

- AI ที่ตัดสินใจต่างกันในแต่ละครั้ง
- Feature flag ที่เปลี่ยน behavior โดยไม่ผ่าน policy
- A/B testing ที่กระทบ permission
- Engagement optimization ที่เปลี่ยน UX flow

### เหตุผล

ผู้ใช้ต้องสามารถ "ทำนาย" ระบบได้
ถ้าคลิกปุ่มเดียวกัน 10 ครั้ง ต้องได้ผลเหมือนกันทุกครั้ง
(ยกเว้น state เปลี่ยน — ซึ่งต้องมองเห็นได้)

ระบบที่ "น่าประหลาดใจ" ไม่ใช่ระบบที่ดี
มันคือระบบที่น่ากลัว

---

## บทสรุป

Authority Model ของ SYNAPSE ไม่ใช่ข้อจำกัด — มันคือ **รากฐาน**

| Layer | Role | Authority |
|-------|------|-----------|
| Human | Source of Intent | สูงสุดในฐานะผู้เริ่มต้น |
| Policy | Law | สูงสุดในฐานะผู้ตัดสิน |
| Kernel | Truth | สูงสุดในฐานะแหล่งข้อมูล |
| AI | Insight | ไม่มี authority |
| UI | Visualization | ไม่มี authority |

เมื่อทุก layer รู้ตำแหน่งของตัวเอง
ระบบก็ทำงานได้อย่างถูกต้อง

**Authority ที่ชัดเจน คือ Trust ที่ยั่งยืน**

---

*SYNAPSE Whitepaper — Chapter 2*
*Authority, Determinism, and Legitimacy*
*Version 1.0 — Canonical*
