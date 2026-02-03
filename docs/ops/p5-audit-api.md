# P5.2 — Audit Log API (`/api/platform/audit-logs`)

## Summary
Read-only API for viewing platform audit logs.

## Access Control
- **Owner**: Full access
- **Admin**: Requires `platform:audit:read` permission
- **User**: No access (403)

## Endpoint

### GET `/api/platform/audit-logs`

| Response Code | Meaning |
|--------------|---------|
| 200 | Success - logs returned |
| 401 | Unauthorized - not logged in |
| 403 | Forbidden - insufficient permission |
| 500 | Internal error |

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `eventType` | string | Filter by event type |
| `action` | string | Filter by action (e.g., `user.created`) |
| `actorId` | string | Filter by actor UID |
| `targetId` | string | Filter by target ID |
| `targetType` | enum | `org`, `user`, `role` |
| `success` | enum | `true` or `false` |
| `startDate` | ISO8601 | Filter from date |
| `endDate` | ISO8601 | Filter to date |
| `limit` | number | 10-100 (default: 25) |
| `cursor` | string | Pagination cursor |

### Response Schema
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "eventType": "string",
        "action": "string",
        "actor": { "uid": "string", "email": "string" },
        "target": { "id": "string", "type": "string" },
        "timestamp": "ISO8601",
        "success": true
      }
    ],
    "nextCursor": "ISO8601 | null",
    "hasMore": true|false
  }
}
```

## Implementation Notes
- **Read-only**: No POST/PATCH/DELETE methods
- Uses inline constants (webpack fix)
- Cursor-based pagination using timestamp
- Firestore composite indexes may be required for complex filters

## Verification
```bash
# Unauthenticated
curl -s https://www.apicoredata.com/api/platform/audit-logs | jq .
# Expected: 401

# Non-owner without permission
# Expected: 403
```
