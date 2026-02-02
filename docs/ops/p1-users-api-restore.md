# P1 Users API Restoration Report

## Summary
Successfully restored the `/api/platform/users` and `/api/platform/users/[uid]` endpoints which were disabled since TC-1.2.

## Root Cause
Routes were disabled in commit `e495746` to unblock TC-1.2 Payload CMS build due to webpack path resolution issues with `@/lib/firebase` collection exports.

## Fix Applied
Same pattern as Organizations restoration:
- Replaced imported collection constants with inline string constants
- `const COLLECTION_PLATFORM_USERS = 'platform_users';`
- `const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';`

## Files Modified

| File | Changes |
|------|---------|
| `app/api/platform/users/route.ts` | Restored GET (list users) + POST (create user) |
| `app/api/platform/users/[uid]/route.ts` | Restored GET + PATCH + DELETE |

## Endpoints Restored

### `/api/platform/users`
| Method | Function | Auth Required |
|--------|----------|---------------|
| GET | List all platform users | Yes (platform:users:read) |
| POST | Create new user | Yes (platform:users:write) |

### `/api/platform/users/[uid]`
| Method | Function | Auth Required |
|--------|----------|---------------|
| GET | Get user details | Yes (platform:users:read) |
| PATCH | Update user | Yes (platform:users:write) |
| DELETE | Disable user | Yes (platform:users:delete) |

## Security Features
- Role hierarchy enforcement (can't modify higher/equal role)
- Owner protection (only owner can see/modify owner users)
- Self-delete prevention
- Audit logging for all mutations

## Verification
```bash
# Check endpoint is active (not 503 disabled)
curl -s https://www.apicoredata.com/api/platform/users | jq .

# Expected: 200 (with data) or 401 (unauthorized)
# NOT: 503 LEGACY_ROUTE_DISABLED
```

## Commit
`cf94e74` - feat(P0-P1): add stability guardrails and restore users API
