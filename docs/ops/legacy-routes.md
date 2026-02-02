# Legacy Routes Inventory
## APICOREDATA Platform

Last updated: 2026-02-02

### Route Status Legend
- ✅ **Enabled** - Route is active and working
- ❌ **Disabled** - Route returns `LEGACY_ROUTE_DISABLED` (503)
- 🔄 **Restored** - Recently restored from disabled state

---

## Core APIs (Priority)

| Route | Status | Risk | Re-enable Criteria | Notes |
|-------|--------|------|---------------------|-------|
| `/api/auth/session` | ✅ Enabled | Critical | N/A | Session management |
| `/api/auth/login` | ✅ Enabled | Critical | N/A | Login endpoint |
| `/api/auth/logout` | ✅ Enabled | Critical | N/A | Logout endpoint |
| `/api/auth/bootstrap` | ❌ Disabled | Low | smoke test | Bootstrap flow |
| `/api/auth/context` | ❌ Disabled | Medium | smoke test | Auth context lookup |

---

## Platform APIs

### Organizations (🔄 Restored)
| Route | Status | Risk | Notes |
|-------|--------|------|-------|
| `/api/platform/orgs` | 🔄 Restored | High | GET list, POST create |
| `/api/platform/orgs/[id]` | 🔄 Restored | High | GET, PATCH, DELETE |

### Users (🔄 Restored)
| Route | Status | Risk | Notes |
|-------|--------|------|-------|
| `/api/platform/users` | 🔄 Restored | High | GET list, POST create |
| `/api/platform/users/[uid]` | 🔄 Restored | High | GET, PATCH, DELETE |

### Roles (❌ Disabled)
| Route | Status | Risk | Notes |
|-------|--------|------|-------|
| `/api/roles` | ❌ Disabled | Medium | Role management |
| `/api/roles/[id]` | ❌ Disabled | Medium | Single role ops |
| `/api/roles/copy` | ❌ Disabled | Low | Copy role |
| `/api/platform/roles` | ❌ Disabled | Medium | Platform roles |

### Audit (❌ Disabled)
| Route | Status | Risk | Notes |
|-------|--------|------|-------|
| `/api/platform/audit-logs` | ❌ Disabled | Medium | View audit logs |

### Business Modules (❌ Disabled - Low Priority)
| Route | Status | Risk | Notes |
|-------|--------|------|-------|
| `/api/platform/products` | ❌ Disabled | Low | Product CRUD |
| `/api/platform/products/[productId]` | ❌ Disabled | Low | Single product |
| `/api/platform/customers` | ❌ Disabled | Low | Customer CRUD |
| `/api/platform/customers/[customerId]` | ❌ Disabled | Low | Single customer |
| `/api/platform/warehouses` | ❌ Disabled | Low | Warehouse CRUD |
| `/api/platform/warehouses/[warehouseId]` | ❌ Disabled | Low | Single warehouse |
| `/api/platform/stock-movements` | ❌ Disabled | Low | Stock movements |
| `/api/platform/stock-movements/[movementId]` | ❌ Disabled | Low | Single movement |
| `/api/platform/transactions` | ❌ Disabled | Low | Transactions |
| `/api/platform/transactions/[transactionId]` | ❌ Disabled | Low | Single transaction |
| `/api/platform/documents` | ❌ Disabled | Low | Documents |
| `/api/platform/documents/[documentId]` | ❌ Disabled | Low | Single document |
| `/api/platform/insights` | ❌ Disabled | Low | Analytics |
| `/api/platform/insights/[orgId]` | ❌ Disabled | Low | Org insights |
| `/api/platform/me` | ❌ Disabled | Medium | Current user profile |

---

## Re-enable Process

### Pre-requisites
1. Backup current disabled route template
2. Identify original implementation in git history (`b05c12d` or earlier)
3. Check for collection imports that need inline constant fix

### Steps
1. Find original code: `git show b05c12d:app/api/platform/[route]/route.ts`
2. Replace collection imports with inline constants
3. Build locally: `npm run build`
4. Run smoke test: `npm run ops:smoke`
5. Commit and deploy
6. Verify on production

### Webpack Fix Pattern
```typescript
// DON'T: Import from @/lib/firebase/collections (breaks in production)
import { COLLECTION_USERS } from '@/lib/firebase/collections';

// DO: Use inline constant
const COLLECTION_USERS = 'platform_users';
```

---

## Phase 5+ Roadmap

### Next Restoration Priority
1. `/api/platform/audit-logs` - Needed for admin visibility
2. `/api/platform/me` - Current user profile
3. `/api/roles/*` - Role management

### Business Modules (Deferred)
These can wait until business features are actively developed:
- Products, Customers, Warehouses
- Stock Movements, Transactions, Documents
- Insights
