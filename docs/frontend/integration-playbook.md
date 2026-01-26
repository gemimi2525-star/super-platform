# Frontend Integration Playbook

Quick guide สำหรับ integrate หน้าใหม่ให้ใช้มาตรฐาน error handling และ API consumption

**เวลาที่ใช้:** ~5-10 นาที  
**มาตรฐาน:** RolesList, Audit Logs, Insights Dashboard

---

## 📋 Integration Pattern

### Read-Only Pages
```
useApi → ApiErrorBanner → Render Data
```

### Action Pages  
```
useApi → ApiErrorBanner → Render Data
       → notify helpers (สำหรับ user actions)
```

---

## ✅ Integration Checklist

- [ ] **1. Import dependencies**
  ```tsx
  import { useApi } from '@/lib/hooks/useApi';
  import ApiErrorBanner from '@/components/common/ApiErrorBanner';
  import { notifySuccess, notifyError, notifyLoading } from '@/lib/ui/notify'; // ถ้ามี actions
  import { toast } from 'sonner'; // ถ้าต้อง dismiss loading
  ```

- [ ] **2. แทนที่ manual fetch ด้วย useApi**
  ```tsx
  // ❌ Before
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch... }, []);
  
  // ✅ After
  const { data, error, loading } = useApi<YourType>('/api/endpoint');
  ```

- [ ] **3. เพิ่ม ApiErrorBanner**
  ```tsx
  <ApiErrorBanner error={error} />
  ```

- [ ] **4. Handle null data (ถ้าจำเป็น)**
  ```tsx
  {data && (
    <div>
      {/* Your content */}
    </div>
  )}
  ```

- [ ] **5. เพิ่ม notify สำหรับ user actions** (ถ้ามี)
  ```tsx
  const handleDelete = async (id) => {
    const toastId = notifyLoading('Deleting...');
    try {
      // ... API call
      toast.dismiss(toastId);
      notifySuccess('Deleted successfully');
    } catch (error) {
      toast.dismiss(toastId);
      notifyError({ type: 'toast', message: error.message });
    }
  };
  ```

- [ ] **6. ลบ console.error เดิม**

- [ ] **7. ลบ alert() เดิม**

- [ ] **8. ลบ custom error UI เดิม**

- [ ] **9. Run build**
  ```bash
  npm run build
  ```

- [ ] **10. Run tests**
  ```bash
  npm test
  ```

---

## 📖 ตัวอย่าง: Read-Only Page

**Use Case:** Audit Logs, Insights, Reports

```tsx
'use client';

import { useApi } from '@/lib/hooks/useApi';
import ApiErrorBanner from '@/components/common/ApiErrorBanner';
import { Card } from '@super-platform/ui';

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  // 1️⃣ Use useApi hook
  const { data: logs, error, loading } = useApi<AuditLog[]>('/api/platform/audit-logs');

  // 2️⃣ Loading state
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </header>

      {/* 3️⃣ Error Display */}
      <ApiErrorBanner error={error} />

      {/* 4️⃣ Conditional Content */}
      {logs && (
        <Card>
          <table className="w-full">
            <thead>
              <tr>
                <th>Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
```

---

## 📖 ตัวอย่าง: Action Page

**Use Case:** RolesList, UsersList, Resource Management

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/hooks/useApi';
import ApiErrorBanner from '@/components/common/ApiErrorBanner';
import { notifySuccess, notifyError, notifyLoading } from '@/lib/ui/notify';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
}

export default function RolesList() {
  const router = useRouter();
  
  // 1️⃣ Use useApi for fetching
  const { data: roles, error, loading, refetch } = useApi<Role[]>('/api/roles');
  const [actionLoading, setActionLoading] = useState(false);

  // 2️⃣ Delete with toast notifications
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    const toastId = notifyLoading('Deleting role...');

    try {
      setActionLoading(true);
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      
      if (!res.ok) throw new Error('Failed to delete');

      await refetch();
      router.refresh();
      
      toast.dismiss(toastId);
      notifySuccess('Role deleted successfully');
    } catch (error: any) {
      toast.dismiss(toastId);
      notifyError({ 
        type: 'toast', 
        message: error.message || 'Failed to delete role',
        originalError: null as any 
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 3️⃣ Error Banner */}
      <ApiErrorBanner error={error} />

      {/* 4️⃣ Content */}
      {roles && (
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(role.id)}
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## ❌ ข้อห้าม (CRITICAL)

### 1. ห้าม alert()
```tsx
// ❌ DON'T
alert('Error occurred');

// ✅ DO
notifyError({ type: 'toast', message: 'Error occurred', originalError: null as any });
```

### 2. ห้าม console.error raw
```tsx
// ❌ DON'T
catch (error) {
  console.error('Failed:', error);
}

// ✅ DO
catch (error) {
  notifyError({ type: 'toast', message: error.message, originalError: null as any });
}
```

### 3. ห้าม toast จาก page-level error อัตโนมัติ
```tsx
// ❌ DON'T - ใช้ toast สำหรับ error state ของหน้า
const { error } = useApi('/api/data');
if (error) {
  toast.error(error.message); // ❌ ผิด! ใช้ ApiErrorBanner แทน
}

// ✅ DO - ใช้ ApiErrorBanner สำหรับ page-level errors
<ApiErrorBanner error={error} />

// ✅ DO - ใช้ toast เฉพาะ user actions
const handleSave = async () => {
  try {
    await save();
    notifySuccess('Saved!'); // ✅ ถูกต้อง
  } catch (e) {
    notifyError(...); // ✅ ถูกต้อง
  }
};
```

### 4. ห้ามสร้าง custom error UI ซ้ำ
```tsx
// ❌ DON'T
{error && (
  <div className="bg-red-50 border border-red-200 p-4">
    <p className="text-red-800">{error.message}</p>
  </div>
)}

// ✅ DO
<ApiErrorBanner error={error} />
```

### 5. ห้าม manual state management สำหรับ API calls
```tsx
// ❌ DON'T
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// ✅ DO
const { data, error, loading } = useApi('/api/data');
```

---

## 🔍 Verification Commands

### Build Check
```bash
npm run build
```
**Expected:** ✅ Compiled successfully

### Test Check
```bash
npm test
```
**Expected:** ✅ All tests passing

---

## 📚 Related Documentation

- [API Contract](../api/api-contract.md) - API response format specification
- [Error ID Playbook](../observability/errorid-playbook.md) - Production debugging guide
- [API Routes Catalog](../api/routes.md) - All available endpoints

---

## 🎯 Quick Reference

| Scenario | Tool | Usage |
|----------|------|-------|
| Page-level error | `ApiErrorBanner` | Always show error state |
| User action success | `notifySuccess()` | Toast notification |
| User action error | `notifyError()` | Toast notification |
| Loading action | `notifyLoading()` | Toast with dismiss |
| Fetch data | `useApi<T>()` | Type-safe API calls |

---

**Last Updated:** 2026-01-20  
**Version:** 1.0  
**Status:** ✅ Production Ready
