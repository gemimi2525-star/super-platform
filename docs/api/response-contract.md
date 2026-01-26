# API Response Contract

This document defines the standardized response format for all API endpoints in the Super Platform.

---

## 1. Success Response

All successful API responses follow this structure:

```typescript
{
  "success": true,
  "data": T  // The actual response data
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "id": "role-001",
    "name": "Content Editor",
    "permissions": ["content:read", "content:write"]
  }
}
```

---

## 2. Error Response

All error responses follow this structure:

```typescript
{
  "success": false,
  "error": {
    "code": string,        // Error code (e.g., "NOT_FOUND", "FORBIDDEN")
    "message": string,     // Human-readable error message
    "errorId": string,     // Unique error ID for tracking
    "timestamp": string,   // ISO 8601 timestamp
    "path"?: string,       // Optional: API path
    "method"?: string      // Optional: HTTP method
  }
}
```

**Example:**
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

Validation errors include field-level details:

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errorId": string,
    "timestamp": string,
    "errors": [
      {
        "field": string,    // Field name
        "message": string,  // Error message
        "code": string,     // Validation error code
        "value"?: unknown   // Optional: Invalid value
      }
    ]
  }
}
```

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errorId": "err_1737390368_def34",
    "timestamp": "2026-01-20T15:46:08Z",
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

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `BAD_REQUEST` | Invalid request or business logic error | 400 |
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict (e.g., duplicate email) | 409 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## TypeScript Usage

### Basic Usage
```typescript
import type { ApiResponse } from '@/lib/api';

// Define response type
type UserResponse = ApiResponse<User>;
type UsersResponse = ApiResponse<User[]>;

// Fetch with type safety
const response: UserResponse = await fetch('/api/users/123').then(r => r.json());

if (response.success) {
  console.log(response.data.name); // Type-safe!
} else {
  console.error(response.error.message);
}
```

### With Type Guards
```typescript
import { isApiSuccess, isApiError, isValidationError } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';

const response: ApiResponse<User> = await fetchUser();

if (isApiSuccess(response)) {
  // TypeScript knows response.data exists
  console.log(response.data.name);
} else if (isValidationError(response.error)) {
  // TypeScript knows response.error.errors exists
  response.error.errors.forEach(err => {
    console.log(`${err.field}: ${err.message}`);
  });
}
```

---

## Implementation Notes

- All API routes must use `ApiSuccessResponse` and `ApiErrorResponse` builders
- Error IDs are automatically generated for tracking and debugging
- Validation uses Zod schemas with `validateRequest` utility
- Never expose raw error messages or stack traces in production
