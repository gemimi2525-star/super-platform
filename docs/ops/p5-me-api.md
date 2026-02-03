# P5.1 — User Context API (`/api/platform/me`)

## Summary
Restored the `/api/platform/me` endpoint for operational visibility.

## Endpoint

### GET `/api/platform/me`
Returns the current authenticated user's context.

| Response Code | Meaning |
|--------------|---------|
| 200 | Success - user context returned |
| 401 | Unauthorized - not logged in |
| 500 | Internal error |

### Response Schema
```json
{
  "success": true,
  "data": {
    "uid": "string",
    "email": "string",
    "isPlatformUser": true|false,
    "role": "owner"|"admin"|"user"|null,
    "displayName": "string"|null,
    "permissions": ["string"],
    "enabled": true|false,
    "createdAt": "ISO8601"|null,
    "lastLogin": "ISO8601"|null
  }
}
```

## Implementation Notes
- Uses inline `COLLECTION_PLATFORM_USERS` constant (webpack fix)
- No legacy imports from `@/lib/firebase/collections`
- Returns `isPlatformUser: false` if user exists in Firebase Auth but not in `platform_users`

## Verification
```bash
# Unauthenticated
curl -s https://www.apicoredata.com/api/platform/me | jq .
# Expected: 401 UNAUTHORIZED

# Authenticated (via browser/session)
# Expected: 200 with user context
```
