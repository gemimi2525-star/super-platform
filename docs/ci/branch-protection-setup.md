# Branch Protection Setup — Main + Staging

## เป้าหมาย
บังคับให้ทุก PR ที่ merge เข้า `main` และ `staging` ต้องผ่าน **V2 Zone Guards** (`v2-compliance` check) ก่อนเสมอ

---

## ข้อกำหนดเบื้องต้น

### ✅ ต้องทำก่อน
1. Workflow **V2 Zone Guards** ต้องรันสำเร็จอย่างน้อย 1 ครั้ง
2. ต้องเห็น status check ชื่อ **`v2-compliance`** ใน PR (เขียว ✅)

### 📌 หมายเหตุ
- ถ้า `v2-compliance` ไม่โผล่ใน list: ให้รัน PR ที่แตะ V2 zone ให้ workflow ทำงานก่อน
- GitHub จะแสดง status checks เฉพาะที่เคยรันแล้วเท่านั้น

---

## ขั้นตอนการตั้งค่า

### 🔒 A) Protect Branch: `main`

#### 1. เข้าสู่ Branch Protection Settings
```
GitHub Repository
  → Settings (tab บนขวา)
  → Branches (เมนูซ้าย)
  → Branch protection rules
  → Add rule (หรือ Add branch protection rule)
```

#### 2. กรอก Branch Name Pattern
```
Branch name pattern: main
```

#### 3. เปิด Settings ตามนี้

##### ✅ Require a pull request before merging
เปิด checkbox นี้ และตั้งค่าภายใน:
- **Require approvals**: `1` (แนะนำ)
- [x] **Dismiss stale pull request approvals when new commits are pushed** (แนะนำ)

##### ✅ Require status checks to pass before merging
เปิด checkbox นี้ และ:
- [x] **Require branches to be up to date before merging**

**Search for status checks**:
- ในช่องค้นหา พิมพ์: `v2-compliance`
- เลือก: **v2-compliance** (จะย้ายไปอยู่ใน "Required checks" section)

##### ✅ Require conversation resolution before merging (แนะนำ)
เปิด checkbox นี้

##### ✅ Do not allow bypassing the above settings (แนะนำ)
เปิด checkbox นี้ (ป้องกัน admin bypass)

##### ✅ Restrictions (Optional)
ถ้าต้องการจำกัดใครที่สามารถ push ได้:
- เปิด **Restrict who can push to matching branches**
- เพิ่ม users/teams ที่อนุญาต

##### ✅ Rules applied to everyone including administrators
เปิด checkbox นี้ (แนะนำ)

##### ✅ Do not allow force pushes
เปิด checkbox นี้ (แนะนำ)

##### ✅ Do not allow deletions
เปิด checkbox นี้ (แนะนำ)

#### 4. Save
กด **Create** (หรือ **Save changes**)

---

### 🔒 B) Protect Branch: `staging`

ทำซ้ำขั้นตอนเดียวกับ `main` แต่เปลี่ยน:

```
Branch name pattern: staging
```

Settings อื่น ๆ ให้เหมือน `main`:
- ✅ Require PR
- ✅ Require status checks: **v2-compliance**
- ✅ Require branches to be up to date
- ✅ Conversation resolution
- ✅ No force push
- ✅ No deletions

---

## ภาพรวม Settings ที่แนะนำ

| Setting                                      | main | staging |
|----------------------------------------------|------|---------|
| Require a pull request before merging       | ✅    | ✅       |
| Require approvals                            | 1    | 1       |
| Dismiss stale approvals                      | ✅    | ✅       |
| **Require status checks to pass**           | ✅    | ✅       |
| **Required check: v2-compliance**            | ✅    | ✅       |
| **Require branches to be up to date**        | ✅    | ✅       |
| Require conversation resolution              | ✅    | ✅       |
| Do not allow bypassing                       | ✅    | ✅       |
| Rules applied to administrators              | ✅    | ✅       |
| Do not allow force pushes                    | ✅    | ✅       |
| Do not allow deletions                       | ✅    | ✅       |

---

## ตรวจสอบการทำงาน

### Test 1: สร้าง PR ที่ผ่าน guards

```bash
# สร้าง test branch
git checkout -b test/guards-pass

# แก้ไขไฟล์ V2 zone (เพิ่ม comment)
echo "// test" >> app/[locale]/(platform-v2)/v2/users/page.tsx

# Commit + push
git add .
git commit -m "test: v2 guards enforcement"
git push origin test/guards-pass
```

**สร้าง PR → `main`**:
1. GitHub → Pull requests → New pull request
2. base: `main` ← compare: `test/guards-pass`
3. Create pull request

**ผลลัพธ์ที่คาดหวัง**:
- ✅ Workflow **V2 Zone Guards** รัน
- ✅ Job `v2-compliance` PASS
- ✅ Status check สีเขียว: **v2-compliance** ✓
- ✅ ปุ่ม **Merge pull request** เปิดใช้งาน (clickable)

---

### Test 2: สร้าง PR ที่ fail guards (ใส่ inline style)

```bash
# สร้าง test branch
git checkout -b test/guards-fail

# แก้ไขไฟล์ V2 zone ให้มี inline style
cat >> app/[locale]/(platform-v2)/v2/users/page.tsx << 'EOF'
export function TestComponent() {
  return <div style={{ color: 'red' }}>Test</div>;
}
EOF

# Commit + push
git add .
git commit -m "test: should fail inline styles guard"
git push origin test/guards-fail
```

**สร้าง PR → `main`**:

**ผลลัพธ์ที่คาดหวัง**:
- ✅ Workflow รัน
- ❌ Job `v2-compliance` FAIL (step: Guard — No inline styles)
- ❌ Status check สีแดง: **v2-compliance** ✗
- ❌ ปุ่ม **Merge pull request** **disabled** (ไม่สามารถกดได้)
- ✅ แสดงข้อความ: "Required status checks must pass before merging"

**แก้ไข**:
```bash
# ย้อนกลับการเปลี่ยนแปลง
git revert HEAD
git push

# Workflow รันใหม่ → PASS → merge ได้
```

---

## การทำงานหลัง Enable Protection

### Scenario 1: PR ผ่าน guards
```
Developer:
  ✅ สร้าง PR → main
  ✅ แก้ไข V2 zone (ไม่มี inline styles/legacy imports)
  ✅ Push

GitHub Actions:
  ✅ Workflow "V2 Zone Guards" รัน
  ✅ v2-compliance PASS

GitHub UI:
  ✅ Status check สีเขียว
  ✅ Merge button เปิดใช้งาน
  ✅ สามารถ merge ได้

Result:
  ✅ PR merged successfully
```

### Scenario 2: PR fail guards
```
Developer:
  ✅ สร้าง PR → main
  ❌ แก้ไข V2 zone (มี inline style)
  ❌ Push

GitHub Actions:
  ✅ Workflow รัน
  ❌ v2-compliance FAIL

GitHub UI:
  ❌ Status check สีแดง
  ❌ Merge button **disabled**
  ❌ แสดงข้อความ: "Required status checks must pass"

Result:
  ❌ Cannot merge
  → Developer ต้องแก้ไขให้ผ่านก่อน
```

### Scenario 3: ลอง bypass (force push)
```
Developer:
  ❌ พยายาม force push ไป main

GitHub:
  ❌ Reject: "Cannot force-push to a protected branch"

Result:
  ❌ Blocked by branch protection
```

---

## Status Checks ที่ใช้

| Check Name       | Source                    | Purpose                      |
|------------------|---------------------------|------------------------------|
| `v2-compliance`  | V2 Zone Guards (workflow) | Guards ทั้งหมด (5 ตัว)        |

### ภายใน v2-compliance มี:
1. Guard — No inline styles (V2)
2. Guard — No legacy imports (V2)
3. Lint
4. Typecheck
5. Build

**ต้องผ่านทั้ง 5 ตัว** ถึงจะ merge ได้

---

## Troubleshooting

### ❌ ปัญหา: `v2-compliance` ไม่โผล่ใน status checks list

**สาเหตุ**: Workflow ยังไม่เคยรันสำเร็จสักครั้ง

**วิธีแก้**:
1. สร้าง PR ที่แตะ V2 zone
2. ให้ workflow รันจนเสร็จ (ไม่ว่าจะ PASS หรือ FAIL)
3. กลับไปที่ Branch protection settings
4. ลอง search `v2-compliance` ใหม่ → ควรเจอ

---

### ❌ ปัญหา: Merge button ยังเปิดใช้งานอยู่ แม้ check ยัง fail

**สาเหตุ**: Branch protection ยังไม่ save หรือตั้งค่าไม่ถูก

**วิธีแก้**:
1. ตรวจสอบ Settings → Branches
2. ดู rule สำหรับ `main` → Edit
3. ตรวจสอบว่า:
   - [x] Require status checks to pass before merging
   - Required checks: **v2-compliance** อยู่ในรายการ
   - [x] Require branches to be up to date before merging
4. Save changes

---

### ❌ ปัญหา: Admin ยัง merge ได้แม้ check fail

**สาเหตุ**: ไม่ได้เปิด "Rules applied to everyone including administrators"

**วิธีแก้**:
1. Branch protection rule → Edit
2. เปิด: [x] **Do not allow bypassing the above settings**
3. เปิด: [x] **Rules applied to everyone including administrators**
4. Save

---

## Done Criteria Checklist

- [ ] ✅ Branch `main` มี protection rule
  - [ ] Require PR
  - [ ] Require status checks: **v2-compliance**
  - [ ] Require up to date
- [ ] ✅ Branch `staging` มี protection rule (same as main)
- [ ] ✅ Test PR ที่ผ่าน guards → merge ได้
- [ ] ✅ Test PR ที่ fail guards → merge ไม่ได้ (blocked)
- [ ] ✅ Force push ไป main/staging → blocked

---

## สรุป

**Branch Protection** บังคับให้:
- ✅ ทุก PR ต้องผ่าน **v2-compliance** check
- ✅ ไม่สามารถ bypass ได้ (แม้แต่ admin)
- ✅ ไม่สามารถ force push ได้
- ✅ V2 zone code quality = **guaranteed**

**Impact**:
- 🛡️ ป้องกัน inline styles ใน V2 zone
- 🛡️ ป้องกัน legacy imports ใน V2 zone
- 🛡️ บังคับ lint + typecheck + build ผ่าน
- 🛡️ Code quality เข้า production = มั่นใจ 100%

---

**Branch Protection — พร้อมตั้งค่า** ✅  
**V2 Zone = Protected** 🔒
