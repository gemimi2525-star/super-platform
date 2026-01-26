# API Response Contract

**Source of Truth** สำหรับ API Response Format ของ Super Platform

---

## 1. Success Response

### Shape
```typescript
{
  success: true,
  data: T  // ข้อมูลที่ต้องการ (type ขึ้นกับ endpoint)
}
```

### ตัวอย่าง
```json
{
  "success": true,
  "data": {
    "id": "role-admin",
    "name": "Administrator",
    "description": "Full system access",
    "permissions": ["*"],
    "isSystem": true
  }
}
```

---

## 2. Error Response

### Shape
```typescript
{
  success: false,
  error: {
    code: string,        // Error code (ดูตารางด้านล่าง)
    message: string,     // คำอธิบายที่อ่านได้
    errorId: string,     // Unique ID สำหรับ tracking
    timestamp: string    // ISO 8601 timestamp
  }
}
```

### ตัวอย่าง
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Role not found",
    "errorId": "err_1737390368_abc12",
    "timestamp": "2026-01-20T15:46:08Z"
  }
}
```

---

## 3. Validation Error Response

### Shape
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: string,
    errorId: string,
    timestamp: string,
    errors: [              // Field-level errors
      {
        field: string,     // ชื่อ field ที่ผิด
        message: string,   // คำอธิบาย error
        code: string,      // Zod error code
        value?: unknown    // ค่าที่ผิด (optional)
      }
    ]
  }
}
```

### ตัวอย่าง
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errorId": "err_1737390370_def45",
    "timestamp": "2026-01-20T15:46:10Z",
    "errors": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "too_small"
      },
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      }
    ]
  }
}
```

---

## 4. Error Codes

| Code | คำอธิบาย | HTTP Status | การใช้งาน |
|------|----------|-------------|-----------|
| `VALIDATION_ERROR` | Request validation ผิด | 400 | Input ไม่ถูกต้องตาม schema |
| `BAD_REQUEST` | Request ไม่ถูกต้องตาม business logic | 400 | เช่น ลบ system role, resource ถูกใช้งานอยู่ |
| `UNAUTHORIZED` | ไม่มี authentication | 401 | Missing หรือ invalid token |
| `FORBIDDEN` | ไม่มีสิทธิ์เข้าถึง | 403 | Authenticated แต่ไม่มี permission |
| `NOT_FOUND` | ไม่พบ resource | 404 | ID ไม่มีในระบบ |
| `CONFLICT` | ข้อมูลซ้ำ | 409 | เช่น email ซ้ำ |
| `INTERNAL_ERROR` | Server error | 500 | Unexpected errors, DB issues |

---

## 5. แนวทางสำหรับ Frontend

### 5.1 Import Types
```typescript
// Import types สำหรับ type-safe responses
import type { 
  ApiResponse, 
  ApiErrorCode,
  ApiValidationError 
} from '@/lib/api';
```

### 5.2 ใช้ apiFetch (Low-level)
```typescript
import { apiFetch, isApiError } from '@/lib/http/apiFetch';

try {
  const user = await apiFetch<User>('/api/users/123');
  console.log(user); // Type-safe!
} catch (error) {
  if (isApiError(error)) {
    console.error(error.response.errorId);
    console.error(error.response.message);
  }
}
```

### 5.3 ใช้ errorMapper (Error Handling)
```typescript
import { mapError } from '@/lib/http/errorMapper';
import { isApiError } from '@/lib/http/apiFetch';

try {
  await apiFetch('/api/roles', { method: 'POST', body: data });
} catch (error) {
  if (isApiError(error)) {
    const mapped = mapError(error.response);
    
    if (mapped.type === 'toast') {
      showToast(mapped.message);
    } else if (mapped.type === 'form') {
      setFormErrors(mapped.fieldErrors);
    } else if (mapped.type === 'redirect') {
      router.push(mapped.redirectTo);
    }
  }
}
```

### 5.4 ใช้ useApi Hook (React - Recommended)
```typescript
import { useApi } from '@/lib/hooks/useApi';

function RolesList() {
  const { data, error, loading, refetch } = useApi<Role[]>('/api/roles');
  
  if (loading) return <Spinner />;
  
  if (error) {
    if (error.type === 'toast') {
      return <Alert>{error.message}</Alert>;
    }
  }
  
  return <List items={data} />;
}
```

---

## 6. Best Practices

### สำหรับ Backend
- ✅ ใช้ `ApiSuccessResponse.ok()` สำหรับ success
- ✅ ใช้ `ApiErrorResponse.validationError()` สำหรับ validation
- ✅ ใช้ `ApiErrorResponse.notFound()`, `.forbidden()` ตาม error type
- ✅ ใช้ `handleError()` เพื่อสร้าง errorId
- ✅ ใช้ `logApiError()` สำหรับ logging
- ❌ ห้าม return `NextResponse.json()` โดยตรง
- ❌ ห้าม expose stack traces ใน production

### สำหรับ Frontend
- ✅ ใช้ `useApi` hook สำหรับ React components
- ✅ ใช้ `errorMapper` เพื่อ handle errors อย่างสม่ำเสมอ
- ✅ แสดง errorId ให้ผู้ใช้เมื่อเกิด INTERNAL_ERROR
- ✅ ใช้ type guards (`isApiSuccess`, `isApiError`)
- ❌ อย่า assume response structure โดยไม่ check
- ❌ อย่า log sensitive data จาก error response

---

## 7. ตัวอย่างการใช้งาน End-to-End

### Backend Route
```typescript
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@/lib/errors';
import { logApiError } from '@/lib/api/logging';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate
    const validation = validateRequest(schema, body);
    if (!validation.success) {
      return ApiErrorResponse.validationError(validation.errors);
    }
    
    // Business logic
    const result = await createRole(validation.data);
    
    return ApiSuccessResponse.created(result);
  } catch (error) {
    const appError = handleError(error as Error);
    logApiError({
      method: 'POST',
      path: '/api/roles',
      errorId: appError.errorId,
      message: appError.message,
    });
    return ApiErrorResponse.internalError();
  }
}
```

### Frontend Component
```typescript
import { useApi } from '@/lib/hooks/useApi';

function CreateRole() {
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  
  const handleSubmit = async () => {
    try {
      await apiFetch('/api/roles', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      toast.success('Role created successfully');
      router.push('/roles');
    } catch (error) {
      if (isApiError(error)) {
        const mapped = mapError(error.response);
        
        if (mapped.type === 'form') {
          // แสดง field errors
          const errors = {};
          mapped.fieldErrors?.forEach(err => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
        } else {
          toast.error(mapped.message);
        }
      }
    }
  };
  
  return <RoleForm onSubmit={handleSubmit} errors={fieldErrors} />;
}
```

---

## 8. Migration Checklist

เมื่อต้องการ migrate route เดิมมาใช้ contract นี้:

- [ ] แทนที่ `NextResponse.json()` ด้วย `ApiSuccessResponse`
- [ ] เพิ่ม Zod validation schema
- [ ] ใช้ `validateRequest()` สำหรับ input validation
- [ ] ใช้ `ApiErrorResponse.*` สำหรับ errors
- [ ] เพิ่ม `handleError()` + `logApiError()` ใน catch
- [ ] ทดสอบด้วย integration tests
- [ ] อัปเดต frontend ให้ใช้ `useApi` หรือ `apiFetch`

---

## 9. เอกสารที่เกี่ยวข้อง

- [Error ID Debug Playbook](../observability/errorid-playbook.md) - วิธี debug production errors
- [Type Definitions](../../lib/api/types.ts) - TypeScript types
- [Error Mapper](../../lib/http/errorMapper.ts) - Error handling logic
- [API Tests](../../tests/api/) - Contract verification tests

---

**Last Updated:** 2026-01-20  
**Version:** 2.0  
**Status:** ✅ Production Ready
