# SYNAPSE Whitepaper — Chapter 3
## Capability, Context, and Calm

> *"ความเงียบไม่ใช่การขาด — มันคือการเลือก"*

---

## บทนำ

ระบบปฏิบัติการส่วนใหญ่ถูกออกแบบรอบ "Application"
กดไอคอน → เปิด App → ใช้งาน → ปิด App

SYNAPSE ไม่ใช่ระบบแบบนั้น

SYNAPSE ถูกออกแบบรอบ **Capability**
ระบบไม่ได้ "เปิด App" — ระบบ "เปิดความสามารถ"
และเมื่อไม่มีอะไรต้องทำ — ระบบเงียบ

บทนี้อธิบายว่าทำไม Capability สำคัญกว่า Application
และทำไมความเงียบคือ Feature ไม่ใช่ Bug

---

## 3.1 Capability-Centric Computing

### หลักการ

> ระบบไม่เปิด "App" — ระบบเปิด "Capability"

**Application** คือ bundle ของ UI + logic + data
**Capability** คือ "สิ่งที่ระบบทำได้" — โดยไม่ผูกกับ UI

### ความแตกต่าง

| Application-Centric | Capability-Centric |
|---------------------|-------------------|
| เปิด "Settings App" | เปิด capability `core.settings` |
| App มี lifecycle | Capability มี state |
| App อาจมีหลาย feature | Capability = หนึ่งความสามารถ |
| ปิด App = feature หายไป | ปิด window ≠ capability หายไป |

### Capability Manifest

ทุก Capability มี **Manifest** ที่กำหนด:
- `id` — ชื่อเฉพาะ (e.g., `core.settings`)
- `hasUI` — มี window หรือไม่
- `windowMode` — เปิดได้กี่หน้าต่าง
- `requiredPolicies` — ต้องมี policy อะไร
- `requiresStepUp` — ต้อง verify identity หรือไม่

### เหตุผล

Application ผูก feature กับ UI
ถ้า UI เปลี่ยน — feature อาจหาย

Capability ผูก feature กับ **contract**
UI เปลี่ยนได้ — contract คงอยู่

SYNAPSE เลือก contract เหนือ UI

---

## 3.2 Context over Navigation

### หลักการ

> ผู้ใช้ไม่ได้ "ไปหน้าต่าง ๆ" — ผู้ใช้ "อยู่ใน context ต่าง ๆ"

ใน Web Application:
- คลิก link → navigate to page → URL เปลี่ยน

ใน SYNAPSE:
- แสดงเจตนา → capability เปิด → context เปลี่ยน

### ความแตกต่าง

| Navigation Model | Context Model |
|------------------|---------------|
| URL = state | URL = bootstrap only |
| Back = go to previous URL | Back = close window |
| History = URL stack | History = event log |
| Route = component tree | Capability = state machine |

### สิ่งที่ SYNAPSE ไม่มี

- ❌ Page
- ❌ Route
- ❌ Navigation stack
- ❌ URL-bound state
- ❌ `router.push()` หรือ `navigate()`

### สิ่งที่ SYNAPSE มี

- ✅ Capability
- ✅ Context
- ✅ Window (as visualization)
- ✅ State (in Kernel)
- ✅ `kernel.emit(Intent)`

### เหตุผล

Navigation model เกิดจากข้อจำกัดของ Web
ไม่ใช่ความต้องการของมนุษย์

มนุษย์ไม่ได้คิดว่า "ฉันจะไปหน้า /users/123"
มนุษย์คิดว่า "ฉันจะดูข้อมูลของ user นี้"

SYNAPSE ออกแบบให้ตรงกับความคิด — ไม่ใช่ข้อจำกัดทางเทคนิค

---

## 3.3 Window as Context View

### หลักการ

> Window ไม่ใช่ระบบ — Window คือ "มุมมอง" ของ context

Window เป็นแค่ **visualization layer**
มันแสดง state — มันไม่ใช่ state

### ลักษณะของ Window ใน SYNAPSE

- Window มาจาก Capability (ถ้า `hasUI: true`)
- Window สะท้อน state — ไม่สร้าง state
- ปิด Window ≠ ยกเลิกการกระทำ
- Minimize ≠ ปิด — แค่ซ่อน
- Focus = cognitive attention

### Window States

```
active    → มองเห็น, อาจ focused
minimized → ซ่อน, context ยังอยู่
closed    → หายไป, capability อาจยังอยู่
```

### สิ่งที่ SYNAPSE ห้าม

- ❌ Window เป็น controller ของ logic
- ❌ Window เก็บ state ที่ไม่อยู่ใน Kernel
- ❌ Window trigger action โดยไม่ผ่าน Intent
- ❌ Window bypass Policy

### เหตุผล

ใน Application model: App = brain + body
ใน SYNAPSE model: Window = just the face

Logic อยู่ใน Kernel
Window อยู่เพื่อแสดงผล

---

## 3.4 Calm Desktop as Mental Space

### หลักการ

> Desktop ว่าง ไม่ใช่ว่างเปล่า — มันคือ "พื้นที่สำหรับคิด"

เมื่อไม่มี window — Desktop ว่าง
ความว่างนี้คือ **design** ไม่ใช่ **failure**

### Calm State คืออะไร

```
isCalm = true เมื่อ:
  - ไม่มี focused window
  - ไม่มี active window (minimized OK)
  - ไม่มี pending step-up
  - cognitive mode = calm
```

### สิ่งที่ Calm Desktop ไม่มี

- ❌ Dashboard
- ❌ Widgets
- ❌ Call-to-action (CTA)
- ❌ ข้อความ "Welcome" หรือ "Start here"
- ❌ Notification badges
- ❌ Engagement prompts

### สิ่งที่ Calm Desktop มี

- ✅ Ambient wallpaper
- ✅ Menu Bar (แสดง system + time)
- ✅ Dock (launcher + restore)
- ✅ ความเงียบ

### ทำไมต้อง Calm

| Dashboard Model | Calm Model |
|-----------------|------------|
| "มาดูสิว่ามีอะไร" | "มีอะไรก็บอก — ไม่มีก็ไม่ต้อง" |
| ดึง attention | ปล่อย attention |
| Engagement-first | Human-first |
| ระบบเรียกร้อง | ระบบรอเรียก |

### เหตุผล

มนุษย์ไม่ต้องการ "ถูกกระตุ้น" ตลอดเวลา
หน้าจอที่ว่างคือการเคารพเวลาและสมาธิของผู้ใช้

SYNAPSE เชื่อว่า:
**ถ้าไม่มีอะไรต้องแสดง — ก็ไม่ต้องแสดง**

---

## 3.5 Why Silence Is a Feature

### หลักการ

> ความเงียบคือ feature — ไม่ใช่ bug

ใน Product สมัยใหม่:
- Notification = engagement
- Empty state = failure
- Silence = something wrong

ใน SYNAPSE:
- Notification = ต้องบอกจริง ๆ เท่านั้น
- Empty state = design
- Silence = ระบบทำงานถูกต้อง

### Silence vs. Emptiness

| Emptiness | Silence |
|-----------|---------|
| "ไม่มีอะไร — แก้ด้วยการใส่อะไรมา" | "ไม่มีอะไรต้องแสดง — ดีแล้ว" |
| ถูกมองว่าเป็นปัญหา | ถูกมองว่าเป็น state ที่ถูกต้อง |
| ต้องแก้ไข | ต้องรักษา |

### SYNAPSE Contract

```
Calm by Default = System Contract
```

หมายความว่า:
- Default state = เงียบ
- ถ้ามีอะไรแสดง = มีเหตุผล
- ถ้าไม่มีเหตุผล = ไม่แสดง

### สิ่งที่ถูกห้ามโดยหลักการนี้

- ❌ Widget ที่แสดง "เพราะมันดูดี"
- ❌ Notification ที่ไม่ได้ขอ
- ❌ Animation เพื่อดึง attention
- ❌ Empty state ที่มี CTA

### เหตุผล

Screen real estate ไม่ใช่ของระบบ — มันเป็นของมนุษย์
SYNAPSE ไม่ "ยึดครอง" หน้าจอโดยไม่จำเป็น

เมื่อไม่มีอะไรต้องพูด — ระบบเงียบ
นั่นคือ feature

---

## บทสรุป

SYNAPSE ออกแบบ 3 หลักการนี้เพื่อเคารพมนุษย์:

| หลักการ | ความหมาย |
|---------|----------|
| **Capability > Application** | ระบบตอบสนองความสามารถ — ไม่ใช่ UI bundle |
| **Context > Navigation** | ผู้ใช้อยู่ใน context — ไม่ใช่เดินทางระหว่างหน้า |
| **Calm > Engagement** | ระบบเงียบเมื่อไม่มีอะไร — ไม่เรียกร้อง attention |

เมื่อระบบรู้ว่า:
- มันทำอะไร (Capability)
- มันอยู่ที่ไหน (Context)
- มันต้องพูดหรือเปล่า (Calm)

มันก็ทำหน้าที่ได้ถูกต้อง — โดยไม่รบกวน

---

## Closing Statement

> SYNAPSE ไม่ได้ออกแบบมาเพื่อให้คุณ "ใช้งานมากขึ้น"
> SYNAPSE ออกแบบมาเพื่อให้คุณ "ใช้งานเมื่อต้องใช้ — และหยุดเมื่อเสร็จ"

ระบบที่ดีคือระบบที่หายไปเมื่อไม่ต้องการ
SYNAPSE ตั้งใจให้เป็นแบบนั้น

**Capability ทำงาน — Window แสดง — Desktop เงียบ**

นั่นคือ SYNAPSE

---

*SYNAPSE Whitepaper — Chapter 3*
*Capability, Context, and Calm*
*Version 1.0 — Canonical*
