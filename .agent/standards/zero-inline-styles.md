# Zero Inline Styles Standard

## Status: ✅ PERMANENT STANDARD (Enforced)

**Established**: 2026-01-26  
**Scope**: V2 Zone + Design System  
**Compliance**: 100% (0 violations)

---

## Rule

**NO `style={...}` ANYWHERE in:**
- `app/[locale]/(platform-v2)/`
- `modules/design-system/`

All styling MUST use `className` with Tailwind CSS or component variants.

---

## Enforcement

### Automated Check
```bash
npm run check:no-inline-styles:v2
```

**Script**: [`scripts/check-v2-inline-styles.sh`](file:///Users/jukkritsuwannakum/Super-Platform/scripts/check-v2-inline-styles.sh)

**CI/CD**: This check runs on every commit/PR and MUST pass before merge.

---

## Approved Patterns

### ✅ USE: className with Tailwind
```tsx
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <Button variant="primary" size="lg">Submit</Button>
</div>
```

### ✅ USE: Component variants
```tsx
<Toast variant="success" position="top-right" />
<Dialog size="lg" />
<Badge variant="danger" dot />
```

### ✅ USE: Conditional className
```tsx
<button className={isActive ? 'bg-primary-600 text-white' : 'bg-white text-neutral-700'}>
  {label}
</button>
```

### ✅ USE: Data attributes for complex states (if needed)
```tsx
<div data-state={isOpen ? 'open' : 'closed'} className="dropdown">
  {/* CSS handles [data-state="open"] */}
</div>
```

---

## Prohibited Patterns

### ❌ NEVER: Inline style objects
```tsx
// PROHIBITED
<div style={{ padding: '24px', color: '#333' }}>
```

### ❌ NEVER: Computed inline styles
```tsx
// PROHIBITED
<div style={{ width: `${sidebarWidth}px` }}>
```

### ❌ NEVER: Event-based inline styles
```tsx
// PROHIBITED
<button 
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'red'}
>
```

### ❌ NEVER: Style prop pass-through (in design-system)
```tsx
// PROHIBITED in design-system components
interface Props {
  style?: React.CSSProperties; // Remove this
}
```

---

## Migration Guide

### Dynamic Values
**Before**:
```tsx
style={{ width: sidebarWidth }}
```

**After**:
```tsx
// Option 1: Map to className
const widthClass = { '240px': 'w-60', '256px': 'w-64' }[sidebarWidth];
className={widthClass}

// Option 2: CSS variables (if truly dynamic)
className="sidebar"
// + CSS: .sidebar { width: var(--sidebar-width); }
// + Set via: element.style.setProperty('--sidebar-width', value);
```

### Positioning
**Before**:
```tsx
style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
```

**After**:
```tsx
className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
```

### Hover States
**Before**:
```tsx
<button
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = neutral[50]}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
>
```

**After**:
```tsx
<button className="bg-white hover:bg-neutral-50 transition-colors">
```

---

## Enforcement History

### Phase 16 Cleanup
- **Step 2B**: V2 pages cleaned (45 violations → 0)
- **Step 2C.1**: Design-system cleaned (62 violations → 0)
- **Total**: 107 violations → 0 ✅

### Components Migrated (11 total)
1. Button, Badge, EmptyState, Tabs, Input
2. Toast, Dialog, Select
3. AppShell, Pagination, Table
4. DataPageLayout, PageHeader

---

## Exception Process

**No exceptions allowed** for v2 zone or design-system.

If you believe you need an exception:
1. **Don't use inline styles**
2. Create a GitHub issue explaining the use case
3. Team will evaluate if a new component variant or pattern is needed
4. Implement the approved pattern without inline styles

---

## Verification

### Before Commit
```bash
npm run check:no-inline-styles:v2
```

### Before PR Merge
- CI check MUST show: `✓ No inline styles found`
- Build MUST pass
- No exceptions

---

## References

- [Phase 16 Step 2C.1 Completion Report](file:///Users/jukkritsuwannakum/.gemini/antigravity/brain/68729827-4bcb-41ef-87b1-7fdca2636c6b/walkthrough.md)
- [Design System Components](file:///Users/jukkritsuwannakum/Super-Platform/modules/design-system/src/components)
- [Tailwind Config](file:///Users/jukkritsuwannakum/Super-Platform/tailwind.config.ts)
