# Audit Read API Plan

**Version:** 1.0  
**Date:** 2026-01-22  
**Phase:** 10.7  
**Status:** DESIGN DOCUMENT

---

## 🎯 Objective

ออกแบบ Read APIs สำหรับ Audit Logs:
- ค้นหา/กรอง audit ได้อย่างปลอดภัย
- รองรับ pagination มาตรฐาน
- บังคับ access control แบบ least-privilege

---

## 🔐 Access Control Rules

### Role-based Access

| Role | Platform Audit | Org Audit | Self Audit |
|------|----------------|-----------|------------|
| **Owner** | ✅ Full access | ✅ All orgs | ✅ |
| **Admin** | ❌ | ✅ Own org only | ✅ |
| **User** | ❌ | ❌ | ❌ |

### Rules

1. **Owner:** สามารถอ่าน audit ทั้งหมดของ platform
2. **Admin:** สามารถอ่าน audit เฉพาะ org ที่ตนรับผิดชอบ
3. **User:** ไม่สามารถอ่าน audit ใดๆ
4. **Cross-org:** ไม่มี role ใดอ่าน audit ของ org อื่นได้

---

## 🔍 Query Capabilities

### Supported Filters

| Filter | Type | Description |
|--------|------|-------------|
| `eventType` | string | "permission", "org", "user", "role", "auth" |
| `action` | string | "created", "updated", "denied", etc. |
| `actorId` | string | Filter by actor UID |
| `targetId` | string | Filter by target ID |
| `targetType` | string | "org", "user", "role" |
| `success` | boolean | true = success, false = denial |
| `startDate` | timestamp | From date |
| `endDate` | timestamp | To date |

### Sorting

| Sort | Direction | Default |
|------|-----------|---------|
| `timestamp` | DESC | ✅ Default |

**Note:** เฉพาะ `timestamp DESC` เพื่อลด index complexity

---

## 📄 Pagination Strategy

### Cursor-based Pagination

```json
{
  "items": [...],
  "nextCursor": "eyJ0aW1lc3RhbXAiOiIyMDI2....",
  "hasMore": true,
  "totalCount": 1234
}
```

### Page Size Options

| Option | Value |
|--------|-------|
| Default | 25 |
| Min | 10 |
| Max | 100 |

### Why Cursor-based?

- ✅ Consistent results with concurrent writes
- ✅ Better performance for large datasets
- ✅ Works well with Firestore
- ❌ Skip to page N not supported

---

## 🗂️ Indexing Strategy (Conceptual)

### Required Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| Primary | `timestamp DESC` | Default listing |
| By Event | `eventType, timestamp DESC` | Filter by type |
| By Actor | `actor.uid, timestamp DESC` | Filter by actor |
| By Target | `target.id, timestamp DESC` | Filter by target |
| By Success | `success, timestamp DESC` | Filter failures |

### Composite Indexes

- `(eventType, success, timestamp DESC)` - Filter denials by type
- `(actor.uid, eventType, timestamp DESC)` - Actor's actions by type

---

## 🧩 Endpoint Design

### 1. List Audit Logs

```
GET /api/platform/audit-logs
```

**Query Parameters:**
- `eventType`: Filter by event type
- `action`: Filter by action
- `actorId`: Filter by actor UID
- `targetId`: Filter by target ID
- `success`: Filter by success status
- `startDate`: ISO timestamp
- `endDate`: ISO timestamp
- `pageSize`: Items per page (10-100)
- `cursor`: Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [AuditEvent, AuditEvent, ...],
    "nextCursor": "...",
    "hasMore": true
  }
}
```

**Access:** Owner only (platform-wide)

### 2. Get Audit Detail

```
GET /api/platform/audit-logs/:id
```

**Response:**
```json
{
  "success": true,
  "data": AuditEvent
}
```

**Access:** Owner only, scoped check

---

## 🛡️ Data Exposure Rules

### ✅ Fields Returned

- `id`
- `eventType`
- `action`
- `timestamp`
- `actor` (uid, email, role)
- `target` (id, type, name, email)
- `success`
- `requiredRole` / `actualRole`
- `method`, `path`
- `details` (filtered)

### ❌ Fields Never Returned

- `ipAddress` (privacy)
- `userAgent` (privacy)
- Full request/response body
- Tokens, sessions, credentials
- Raw error stacks

### Redaction Rules

- If `details` contains sensitive keys → redact or omit
- Sensitive keys: `password`, `token`, `secret`, `key`

---

## ⚠️ Open Questions / Risks

| # | Question | Proposed Answer |
|---|----------|-----------------|
| 1 | Should Admin see user audit only in their org? | Yes, scoped to org |
| 2 | Should we support fulltext search? | No (Phase 10 scope) |
| 3 | Rate limiting on audit reads? | Recommend 100 req/min |
| 4 | Retain audit logs forever? | Recommend 1 year minimum |

---

## 📊 Implementation Notes

### For Phase 10.8

1. Create `/api/platform/audit-logs` endpoint
2. Add Firestore indexes
3. Implement cursor-based pagination
4. Add access control checks
5. Test with all roles

---

## ✅ Exit Criteria

- ✅ Access control rules defined
- ✅ Query capabilities planned
- ✅ Pagination strategy set
- ✅ Index concept defined
- ✅ Data exposure rules clear
- ✅ Ready for Phase 10.8

---

## ▶️ Next Step

**Phase 10.8 — Verification & Phase Lock**
