# Admin Auth Context Switching

## Overview
To facilitate testing and management of multiple organizations by Platform Owners and Admins, the system supports an **Explicit Context Switching** mechanism via HTTP Headers.

This allows a Platform Admin to strictly operate within the context of a specific Organization without changing their global session token.

## How it Works
The `getAuthContext(req)` helper in `@/lib/auth/server` inspects the request for a specific header and overrides the user's `orgId` context **IF AND ONLY IF** the user has sufficient platform privileges.

### Requirements
1. **User Role**: Must be `owner` or `admin` (Platform Level).
2. **Header**: `x-org-id` must be present in the request.

### Usage

#### 1. Browser / Frontend (Default)
The system automatically uses the strict `__session` cookie set by Firebase Auth.
- **Switching Context**: The Admin UI sends the `x-org-id` header.
- **Authentication**: Handled transparently via Cookies.

#### 2. Curl / Backend Scripts (Alternative)
You can use a Bearer token if utilizing the `Authorization` header (e.g., for Service Accounts or Dev Testing).

```bash
# Example with Cookie (Recommended for Browser context)
curl -X POST http://localhost:3000/api/platform/documents \
  -H "Cookie: __session=<TOKEN>" \
  -H "x-org-id: org-123" \
  ...

# Example with Bearer (requires token handling logic)
curl -X POST http://localhost:3000/api/platform/documents \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-org-id: org-123" \
  ...
```
When the Admin uses the "Org Switcher" UI:
1. The UI stores the selected `targetOrgId` in state/local storage.
2. The API Client (Axios/Fetch wrapper) injects `x-org-id: <targetOrgId>` into every request.

## Security Rules
- **Standard Users**: The `x-org-id` header is **IGNORED**. Standard users can only access the `orgId` embedded in their verified session token.
- **Validation**: The system verifies that the header value is a valid string, but currently relies on strict Role-Based Access Control (RBAC) to allow the switch.
- **Audit**: Context switching events should be logged (implicitly via the API access logs containing the `orgId`).

## Error States
- **401 Unauthorized**: No valid session token.
- **403 Forbidden (Org Context Missing)**: Session is valid, but no `orgId` found in Token AND no `x-org-id` header provided (or user not allowed to switch).
