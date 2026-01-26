# Repository Map

**Last Updated**: 2026-01-26

This document provides a clear navigation guide for the Super Platform codebase, distinguishing between active development zones and legacy/frozen areas.

---

## 🟢 Active Development (V2 Zone)

### V2 Application Routes
**Path**: `app/[locale]/(platform-v2)/`  
**Status**: ✅ Active Development  
**Purpose**: New platform features built with design system

**Structure**:
```
app/[locale]/(platform-v2)/
├── layout.tsx               # V2 app shell (sidebar + topbar)
├── v2/
│   ├── page.tsx            # V2 dashboard
│   ├── orgs/
│   │   └── page.tsx        # Organizations CRUD
│   └── test-login/
│       └── page.tsx        # Dev test login page
```

**Standards**:
- Zero inline styles ✅
- Design system components only
- No legacy imports
- TypeScript strict mode

---

### Design System
**Path**: `modules/design-system/`  
**Status**: ✅ Active Development  
**Purpose**: Shared component library

**Structure**:
```
modules/design-system/src/
├── components/              # UI components
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Table.tsx
│   ├── Dialog.tsx
│   ├── Toast.tsx
│   ├── Tabs.tsx
│   ├── EmptyState.tsx
│   └── Pagination.tsx
├── patterns/                # Layout patterns
│   ├── AppShell.tsx
│   ├── PageHeader.tsx
│   └── DataPageLayout.tsx
└── tokens/                  # Design tokens
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    ├── radius.ts
    ├── shadow.ts
    ├── zIndex.ts
    └── motion.ts
```

**Standards**:
- Zero inline styles ✅
- All components use Tailwind className
- Export TypeScript interfaces
- Comprehensive prop types

---

## 🔴 Legacy Zone (FROZEN)

### Legacy Platform Routes
**Path**: `app/[locale]/(platform)/`  
**Status**: 🔒 FROZEN (See [LEGACY_FREEZE.md](file:///Users/jukkritsuwannakum/Super-Platform/docs/LEGACY_FREEZE.md))  
**Purpose**: V1 platform (maintenance only)

**Allowed Changes**:
- Critical security patches
- Build-breaking fixes only
- No new features

**Migration Path**: Page-by-page rebuild in `(platform-v2)/`

---

### Legacy Components
**Path**: `components/`  
**Status**: 🔒 FROZEN  
**Purpose**: V1 UI components (do not use in V2)

**Migration Path**: 
- Use `modules/design-system/` components instead
- If needed, build new component in design-system

---

## 🟡 Shared Infrastructure

### Library Utilities
**Path**: `lib/`  
**Status**: ⚠️ Shared (review before use)  
**Purpose**: Utilities, Firebase, API clients

**Usage Guidelines**:
- ✅ Pure utility functions (e.g., `formatDate`, `parseQuery`)
- ✅ Firebase client setup
- ✅ API client wrappers
- ⚠️ Review for legacy patterns before importing into V2

---

### TypeScript Types
**Path**: `types/`  
**Status**: ✅ Shared  
**Purpose**: Global TypeScript definitions

**Usage**: Safe to import in both V1 and V2

---

### React Hooks
**Path**: `hooks/`  
**Status**: ⚠️ Review required  
**Purpose**: Custom React hooks

**Usage Guidelines**:
- Review for legacy patterns (inline styles, old components)
- Prefer creating new hooks in V2 zone if unsure
- Safe if hook is pure logic (no UI)

---

## 📁 Configuration & Build

### Next.js Config
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Package Management
- `package.json` - Dependencies and scripts
- `pnpm-lock.yaml` - Lock file
- `.npmrc` - npm configuration

### Build Scripts
**Path**: `scripts/`
- `check-v2-inline-styles.sh` - Enforce zero inline styles
- `check-no-legacy-imports.sh` - Enforce no legacy imports

---

## 🔧 Development Workflows

### Starting Development
```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # Run ESLint
```

### Quality Checks
```bash
pnpm check:no-inline-styles:v2    # Check for inline styles (must pass)
pnpm check:no-legacy-imports:v2    # Check for legacy imports (must pass)
```

### Testing
```bash
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

---

## 📊 Code Organization Rules

### V2 Development Rules
1. ✅ **DO**: Build in `app/[locale]/(platform-v2)/`
2. ✅ **DO**: Import from `modules/design-system/`
3. ✅ **DO**: Use Tailwind className (no inline styles)
4. ❌ **DON'T**: Import from `app/[locale]/(platform)/`
5. ❌ **DON'T**: Import from root `components/`
6. ❌ **DON'T**: Use inline `style={...}`

### Design System Rules
1. ✅ **DO**: Export components with TypeScript interfaces
2. ✅ **DO**: Use Tailwind className exclusively
3. ✅ **DO**: Provide size/variant props
4. ❌ **DON'T**: Accept `style` prop (removed)
5. ❌ **DON'T**: Use inline styles
6. ❌ **DON'T**: Import from legacy components

---

## 📖 Documentation

### Standards & Guides
- [`docs/LEGACY_FREEZE.md`](file:///Users/jukkritsuwannakum/Super-Platform/docs/LEGACY_FREEZE.md) - Legacy freeze rules
- [`docs/phase-tracker.md`](file:///Users/jukkritsuwannakum/Super-Platform/docs/phase-tracker.md) - Development phases
- [`.agent/standards/zero-inline-styles.md`](file:///Users/jukkritsuwannakum/Super-Platform/.agent/standards/zero-inline-styles.md) - Styling standards

### UAT & Testing
- `docs/uat/` - User acceptance test checklists

---

## 🎯 Quick Navigation

### I want to...

**Build a new page**
→ `app/[locale]/(platform-v2)/v2/{feature}/page.tsx`

**Create a new component**
→ `modules/design-system/src/components/{Component}.tsx`

**Add a utility function**
→ `lib/utils/{feature}.ts`

**Fix a legacy bug**
→ `app/[locale]/(platform)/...` (critical only)

**Add TypeScript types**
→ `types/{feature}.ts`

**Update design tokens**
→ `modules/design-system/src/tokens/{token}.ts`

---

## 🚫 Anti-Patterns to Avoid

### ❌ DON'T DO THIS:
```tsx
// ❌ Importing legacy component into V2
import { OldTable } from '@/components/Table';

// ❌ Using inline styles
<div style={{ padding: '20px' }}>

// ❌ Importing from (platform) in V2
import { UserCard } from '@/app/[locale]/(platform)/users/UserCard';
```

### ✅ DO THIS INSTEAD:
```tsx
// ✅ Use design system component
import { Table } from '@/modules/design-system/src/components/Table';

// ✅ Use className
<div className="p-5">

// ✅ Build new component in V2 or design-system
import { UserCard } from '@/modules/design-system/src/components/UserCard';
```

---

## 📈 Migration Progress

### V2 Pages (Active)
- ✅ Dashboard (`v2/page.tsx`)
- ✅ Organizations (`v2/orgs/page.tsx`)
- ✅ Test Login (`v2/test-login/page.tsx`)

### V1 Pages (To Migrate)
- ⏳ Users
- ⏳ Roles
- ⏳ Settings
- ⏳ Tenants
- ⏳ Audit Logs
- ⏳ Analytics

**Migration Strategy**: One page at a time, V1 and V2 coexist during transition.

---

**For questions or clarifications, see**: [`docs/LEGACY_FREEZE.md`](file:///Users/jukkritsuwannakum/Super-Platform/docs/LEGACY_FREEZE.md)
