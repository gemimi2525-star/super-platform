# Foundation Lock Checklist

## Documentation
- [x] Platform Concept (`platform_concept.md`)
- [x] Route Map (`route_map.md`)
- [x] Firestore Schema (`firestore_schema.md`)
- [x] Security Rules (`security_rules_strategy.md`)
- [x] Migration Plan (`migration_plan.md`)

## Implementation: Routes & Guards
- [ ] Create `/platform` layout/group
- [ ] Create `/app` layout/group
- [ ] Implement `middleware.ts` for role/org checks
- [ ] Verify `/platform` access denied for normal users
- [ ] Verify `/app` access requires Org ID

## Implementation: Data Isolation
- [ ] Refactor `keywords.ts` service (Subcollection)
- [ ] Refactor `pages.ts` service (Subcollection)
- [ ] Refactor `rank-history.ts` service (Subcollection)
- [ ] Refactor `audit-logs.ts` service (Subcollection)

## Implementation: Testing
- [ ] Create `/qa/foundation` page
- [ ] Implement checks for Role, Org, Isolation
- [ ] Create automated smoke test script

## Verification
- [ ] Build clean
- [ ] Automated tests PASS
- [ ] Manual QA PASS
