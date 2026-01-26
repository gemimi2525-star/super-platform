# Legacy Code Freeze & Quarantine

## Status: 🔒 FROZEN (Effective 2026-01-26)

**Established**: 2026-01-26  
**Enforcement**: Automated via `pnpm check:no-legacy-imports:v2`

---

## Overview

The legacy platform code (V1) is now **FROZEN**. All new development MUST happen in the V2 zone using the design system.

This is a **quarantine guard** to prevent legacy patterns from contaminating the new V2 architecture.

---

## The Rule

### ✅ ALLOWED: V2 → Design System
```tsx
// ✅ GOOD: V2 imports from design system
import { Button } from '@/modules/design-system/src/components/Button';
import { PageHeader } from '@/modules/design-system/src/patterns/PageHeader';
```

### ❌ PROHIBITED: V2 → Legacy
```tsx
// ❌ BAD: V2 importing from legacy platform zone
import { OldButton } from '@/components/OldButton';
import { LegacyTable } from '@/app/[locale]/(platform)/components/table';
```

### ⚠️ LIMITED: Legacy changes
Legacy code may ONLY be modified for:
- **Build-breaking formatting** (e.g., lint auto-fix)
- **Critical security patches**
- **Bug fixes** that block production

**NO new features** in legacy zone.

---

## Frozen Paths (Legacy Zone)

The following paths are **FROZEN** for new feature development:

### App Routes (Legacy)
- `app/[locale]/(platform)/` - All V1 platform pages
- `app/[locale]/(auth)/` - Legacy auth flows (if separate from v2)

### Components (Legacy)
- `components/` - Root-level legacy components
- Any legacy UI components not in design-system

### Legacy Patterns
- Old table components
- Legacy form patterns
- Custom styled components with inline styles
- V1 layout patterns

---

## Active Development Zones (V2)

### ✅ V2 Zone
- `app/[locale]/(platform-v2)/` - All V2 pages
- Build all new features here

### ✅ Design System
- `modules/design-system/` - Shared components/patterns
- Extend components here, not in legacy

### ✅ Shared Infrastructure
- `lib/` - Utilities, Firebase, API clients (if clean)
- `types/` - Shared TypeScript types
- `hooks/` - React hooks (must be V2-compliant)

---

## Migration Strategy

### When you need functionality from legacy:

#### Option 1: Rebuild in V2 (Preferred)
```tsx
// Instead of importing LegacyTable:
// 1. Use design-system Table
import { Table } from '@/modules/design-system/src/components/Table';

// 2. Or create new component if needed
// /modules/design-system/src/components/DataGrid.tsx
```

#### Option 2: Extract to Shared Util
```tsx
// If it's pure logic (no UI):
// 1. Extract to lib/
// /lib/utils/dataTransform.ts

// 2. Import in V2
import { transformData } from '@/lib/utils/dataTransform';
```

#### Option 3: Duplicate temporarily
```tsx
// Last resort: copy-paste the logic into V2
// Better to duplicate than create legacy dependency
// Mark with TODO to consolidate later
```

### ❌ NEVER: Import legacy UI into V2

---

## Enforcement

### Automated Check
```bash
pnpm check:no-legacy-imports:v2
```

**Runs on**:
- Pre-commit hook
- CI/CD pipeline
- Manual verification

**Script location**: [`scripts/check-no-legacy-imports.sh`](file:///Users/jukkritsuwannakum/Super-Platform/scripts/check-no-legacy-imports.sh)

### Manual Review
Any PR touching V2 zone must:
1. Pass `check:no-legacy-imports:v2`
2. Have zero imports from frozen zones
3. Use only design-system components

---

## Violation Examples

### ❌ Direct Import
```tsx
// app/[locale]/(platform-v2)/v2/users/page.tsx
import { UserTable } from '@/app/[locale]/(platform)/components/UserTable'; // VIOLATION
```

### ❌ Re-export
```tsx
// app/[locale]/(platform-v2)/v2/components/index.ts
export { LegacyModal } from '@/components/Modal'; // VIOLATION
```

### ❌ Relative Import to Legacy
```tsx
// app/[locale]/(platform-v2)/v2/settings/page.tsx
import { SettingsForm } from '../../../(platform)/settings/SettingsForm'; // VIOLATION
```

---

## Exception Process

**No exceptions** for importing legacy UI components.

If you believe you need legacy code:
1. Open GitHub issue with justification
2. Team evaluates if:
   - Pure utility (can extract to `lib/`)
   - Rebuild cost vs. risk
3. If approved: extract to shared location (not direct import)

---

## Gradual Migration Plan

### Phase 17+: Page-by-Page Migration
- Take one legacy page at a time
- Rebuild in V2 zone with design system
- Deploy alongside legacy (different route)
- Switch users gradually
- Archive legacy version

### Not a "Big Bang"
- Legacy continues to work
- No forced immediate migration
- V2 grows, V1 shrinks over time

---

## Benefits

### For V2 Development
✅ Zero legacy dependencies  
✅ Clean architecture  
✅ No CSS conflicts  
✅ Faster builds (smaller bundle)  
✅ Easier testing  

### For Legacy Code
✅ Frozen = stable  
✅ Limited change surface = less risk  
✅ Clear migration path  

---

## Monitoring

### Metrics to Track
- Legacy imports in V2: **Target 0**
- V2 page count vs. Legacy page count
- Design system coverage
- Bundle size (V2 vs Legacy)

### Regular Audits
- Monthly: Run `check:no-legacy-imports:v2`
- Quarterly: Review for new violations
- Annually: Assess legacy retirement plan

---

## FAQs

**Q: Can I fix a bug in legacy code?**  
A: Yes, but only critical bugs. No new features.

**Q: Can I use a legacy utility function?**  
A: Only if it's pure logic. Extract to `lib/` first, don't import directly from legacy.

**Q: What if design-system doesn't have component X?**  
A: Build it in design-system, not in V2 app. Design-system is the shared library.

**Q: Can legacy code import from V2?**  
A: No. Legacy should not depend on V2 either. Keep them isolated.

**Q: When will legacy be deleted?**  
A: When 100% of features migrated to V2 and traffic is zero. Not before.

---

## References

- [Repository Map](file:///Users/jukkritsuwannakum/Super-Platform/docs/REPO_MAP.md)
- [Phase Tracker](file:///Users/jukkritsuwannakum/Super-Platform/docs/phase-tracker.md)
- [Zero Inline Styles Standard](file:///Users/jukkritsuwannakum/Super-Platform/.agent/standards/zero-inline-styles.md)
- [Design System Components](file:///Users/jukkritsuwannakum/Super-Platform/modules/design-system/src/components)

---

**Last Updated**: 2026-01-26  
**Status**: Active enforcement ✅
