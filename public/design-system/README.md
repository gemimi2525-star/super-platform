# Super Platform – Design System Demo

**This is the single source of truth for UI/UX.**

## ⚠️ Rules

- **Do NOT change UI styles directly in product pages**
- **tokens.css is the only source of colors, spacing, and typography**
- **All React components must follow this demo**
- **If design looks different from this page, the code is wrong**

---

## 🚀 View Design System

**Live Demo:**
```
http://localhost:3000/design-system/index.html
```

Before writing any UI code, check this demo first.

---

## 📁 Files

```
design-system/
├── index.html      # Complete demo (9 sections, 2100+ lines)
├── tokens.css      # Design tokens (colors, typography, spacing, shadows)
├── base.css        # Layout and typography utilities
├── components.css  # All component styles
└── README.md       # This file
```

## 🎨 Design Principles

**Calm, Clean, Premium**
- Neutral-first color palette
- Generous whitespace (64px between sections)
- Subtle shadows and borders
- Semantic-soft colors (no aggressive reds/yellows)

**Token-Based**
- 100% CSS variables (zero hardcoded values)
- Single source of truth in `tokens.css`
- Systematic naming: `var(--color-accent)`, `var(--space-16)`

**i18n Ready**
- Multi-language font stacks (EN/TH/ZH)
- Layout stability across languages
- RTL-safe spacing patterns

**Accessible**
- Semantic HTML (`nav`, `table`, `label`)
- ARIA attributes (`aria-label`, `aria-invalid`)
- Clear focus-visible states (3px soft glow)

## 📦 What's Included

### 1. Interactive UI Components
- **Buttons**: 4 variants (Primary, Secondary, Ghost, Destructive) × 3 sizes
- **Form Controls**: Input, Select, Checkbox, Radio, Switch
- **Navigation**: Tabs, Pagination, Links
- **Modal**: Static representation

### 2. Typography System
- **Font Families**: EN (Inter), TH (Sarabun), ZH (Noto Sans SC)
- **Type Scale**: H1-H6, Body (Large/Default/Small), Caption
- **Usage Guidance**: Do/Don't examples for color, weight, spacing

### 3. Form Components
- **10 Input Types**: Text, Password, Select, Textarea, Date, Checkbox, Radio, Switch
- **Validation States**: Error, Success, Info with semantic colors
- **Density Modes**: Default (comfortable) vs Dense (compact)
- **i18n Examples**: EN/TH/ZH form labels

### 4. Navigation Components
- **Sidebar**: Default (220px), Collapsed (64px), with groups
- **Top Navbar**: Brand + actions
- **Breadcrumb**: Default and dense variants
- **Menu/Submenu**: Dropdown content with groups and dividers
- **Tabs**: Underline (editor-style) and Pill (soft background)

### 5. Feedback / Status
- **Alert**: 4 variants (Info, Success, Warning, Error) + compact
- **Toast**: Stacked notifications with actions
- **Loading**: CSS spinner + skeleton loaders
- **Empty State**: Generic and filtered patterns
- **Error/Success States**: Page-level with actions
- **Progress Bar**: 0%, 50%, 100% examples

### 6. Data Display / Tables
- **Standard Table**: 5 columns with row hover
- **Density Modes**: Default vs Dense
- **Column Types**: User (avatar+name), Status badge, Numeric, Truncated
- **Selection**: Checkboxes with selected state
- **Table States**: Empty, Loading (skeleton), Error
- **Toolbar**: Search + Filter + Rows per page
- **Pagination**: With "Showing X-Y of Z" info
- **i18n**: TH/ZH table demos

## 🛠️ Usage

### As Design Reference

Open `index.html` in browser and inspect the code:

```html
<!-- Example: Primary Button -->
<button class="ui-button ui-button--primary ui-button--md">
  Click me
</button>
```

### For Component Development

Use as blueprint when building React/Vue components:

```tsx
// Convert HTML pattern to React component
<Button variant="primary" size="md">
  Click me
</Button>
```

### Token Usage

Always use design tokens, never hardcode values:

```css
/* ❌ WRONG */
color: #3b82f6;
padding: 12px;

/* ✅ CORRECT */
color: var(--color-accent);
padding: var(--space-12);
```

## 📐 Token Reference

### Colors
- **Neutral**: `--color-neutral-50` to `--color-neutral-950` (12 steps)
- **Semantic Text**: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`
- **Semantic Surface**: `--color-bg`, `--color-surface-1`, `--color-surface-2`
- **Semantic Border**: `--color-border-subtle`, `--color-border-default`, `--color-border-strong`
- **Accent**: `--color-accent`, `--color-accent-hover`, `--color-accent-soft`
- **Status**: `--color-{success|warning|error|info}[-text|-border|-soft]`

### Typography
- **Sizes**: `--font-size-1` (12px) to `--font-size-9` (48px)
- **Weights**: `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)
- **Line Heights**: `--line-height-tight` (1.1) to `--line-height-loose` (2)

### Spacing
- **Scale**: `--space-2` (2px) to `--space-96` (96px), all divisible by 4
- **Common**: `--space-8`, `--space-12`, `--space-16`, `--space-24`

### Border Radius
- `--radius-2` (2px) to `--radius-16` (16px), plus `--radius-full` (9999px)

### Shadows
- **Elevation**: `--shadow-1` to `--shadow-6`
- **Focus**: `--focus-ring-default`, `--focus-ring-danger`

## 🔄 Next Steps

### Immediate Actions
1. **Share with team** for design review
2. **Use as reference** for all new UI development
3. **Audit existing components** against design system

### Component Library Development

Convert static HTML to framework components:

**Priority Order:**
1. Button (4 variants × 3 sizes)
2. Table (with all features)
3. Form Controls (Input, Select, Checkbox, Radio)
4. Alert / Toast (feedback system)
5. Empty State (reusable pattern)

### Page Refactoring

Apply design system to existing pages:

1. **Users Page** → Use table patterns, add density toggle
2. **Organizations Page** → Use status badges, toolbar
3. **Roles Page** → Follow table system exactly

## 📚 Additional Resources

- **Walkthrough**: Full build documentation with screenshots
- **Token Reference**: Complete token catalog
- **Design Spec**: Conceptual design system specification

## ✅ Quality Checklist

- [x] 100% token usage (no hardcoded values)
- [x] 9 complete sections implemented
- [x] 50+ component variants
- [x] i18n verified (EN/TH/ZH)
- [x] Accessibility ready (semantic HTML + ARIA)
- [x] Browser tested and screenshot verified

---

**Built with**: Vanilla HTML + CSS  
**Philosophy**: Apple/Google/Stripe - Calm, Clean, Premium  
**Status**: Production Ready ✅
