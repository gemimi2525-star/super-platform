# 🎯 APICOREDATA OS — Core System Contract
**Version 1.0.0 | Phase 7.1 | 2026-01-29**

---

## 📋 Table of Contents
1. [What is Core System?](#what-is-core-system)
2. [Quick Reference](#quick-reference)
3. [DO's and DON'Ts](#dos-and-donts)
4. [Token Usage](#token-usage)
5. [Responsive Rules](#responsive-rules)
6. [Appearance & Contrast](#appearance--contrast)

---

## What is Core System?

Core System คือ **มาตรฐานกลาง** ของ APICOREDATA OS ที่ทุก component และ page ต้องใช้ร่วมกัน ประกอบด้วย:

| System | ไฟล์ | หน้าที่ |
|--------|------|--------|
| **Design Tokens** | `lib/os-core/tokens.ts` | สี, spacing, radius, shadow, z-index, typography, motion |
| **CSS Variables** | `app/globals.css` | CSS custom properties สำหรับใช้ใน styles |
| **Breakpoints** | `lib/os-core/breakpoints.ts` | Responsive rules สำหรับ Desktop/Tablet/Mobile |
| **Appearance** | `lib/os-core/appearance.ts` | Background types และ Auto Contrast algorithm |

---

## Quick Reference

### 📦 Import
```typescript
import { osColors, osSpacing, osRadius, osShadow, osZIndex, osMotion } from '@/lib/os-core';
import { osBreakpoints, osLayoutRules, getDeviceType } from '@/lib/os-core';
import { getContrastForeground, osBackgrounds } from '@/lib/os-core';
```

### 🎨 CSS Variables
```css
/* ใช้ใน CSS/Tailwind */
color: var(--os-fg);
background: var(--os-bg-surface);
border-color: var(--os-border);
box-shadow: var(--os-shadow-2);
transition: all var(--os-duration-normal) var(--os-ease);
```

### ⚡ Utility Classes
```jsx
<div className="os-bg-surface os-shadow-2 os-transition">
  <p className="os-text-muted">Secondary text</p>
</div>
```

---

## DO's and DON'Ts

### ✅ DO (ต้องทำ)

| Category | Correct Usage |
|----------|---------------|
| **Colors** | `var(--os-fg)`, `var(--os-accent)`, `osColors.fg.default` |
| **Spacing** | `var(--os-space-4)`, `osSpacing[4]`, Tailwind: `p-4` (aligned with 8pt) |
| **Shadows** | `var(--os-shadow-2)`, `className="os-shadow-2"` |
| **Radius** | `var(--os-radius-xl)`, `rounded-xl` (12px) |
| **Z-Index** | `var(--os-z-overlay)`, `osZIndex.overlay` |
| **Transitions** | `className="os-transition"`, `var(--os-duration-normal)` |

### ❌ DON'T (ห้ามทำ)

| Category | Forbidden | Reason |
|----------|-----------|--------|
| **Hardcoded Colors** | `color: #333333` | ใช้ tokens เท่านั้น |
| **Magic Numbers** | `margin: 13px` | ต้องอยู่ใน 8pt grid (8, 12, 16...) |
| **Inline Shadows** | `box-shadow: 0 2px 4px rgba(...)` | ใช้ `--os-shadow-*` |
| **Random Z-Index** | `z-index: 9999` | ใช้ `osZIndex` layers |
| **Hardcoded Transitions** | `transition: 0.3s ease` | ใช้ `--os-duration-*` + `--os-ease` |
| **Non-standard Fonts** | `font-family: "Custom Font"` | ใช้ `--os-font-sans` หรือ `--os-font-mono` |

---

## Token Usage

### 🎨 Colors

```typescript
// Foreground (Text)
--os-fg           // Primary text
--os-fg-muted     // Secondary text
--os-fg-subtle    // Tertiary/placeholder
--os-fg-inverse   // White text on dark
--os-fg-disabled  // Disabled state

// Background
--os-bg           // Page background
--os-bg-subtle    // Subtle areas
--os-bg-muted     // Section backgrounds
--os-bg-surface   // Cards, panels
--os-bg-elevated  // Modals, dropdowns

// Accent
--os-accent       // Primary CTA (blue-600)
--os-accent-hover // Hover state

// Status
--os-success, --os-success-bg
--os-warning, --os-warning-bg
--os-error, --os-error-bg
--os-info, --os-info-bg
```

### 📏 Spacing (8pt Grid)

| Token | Value | Use Case |
|-------|-------|----------|
| `--os-space-1` | 4px | Tight inline spacing |
| `--os-space-2` | 8px | Icon gaps, small padding |
| `--os-space-3` | 12px | Form field spacing |
| `--os-space-4` | 16px | Standard padding |
| `--os-space-6` | 24px | Section spacing |
| `--os-space-8` | 32px | Large gaps |
| `--os-space-12` | 48px | Major section breaks |

### 🔲 Radius

| Token | Value | Use Case |
|-------|-------|----------|
| `--os-radius-sm` | 4px | Tags, badges |
| `--os-radius-md` | 6px | Buttons, inputs |
| `--os-radius-base` | 8px | Cards (standard) |
| `--os-radius-xl` | 12px | App surfaces, panels |
| `--os-radius-2xl` | 16px | Large containers |

### 🌫️ Shadows (Elevation Layers)

| Token | Use Case |
|-------|----------|
| `--os-shadow-1` | Subtle cards |
| `--os-shadow-2` | Standard cards, panels |
| `--os-shadow-3` | Hover states |
| `--os-shadow-4` | Dropdowns |
| `--os-shadow-app` | App surfaces (floating) |
| `--os-shadow-overlay` | Modals, overlay panels |
| `--os-shadow-focus` | Focus rings |

### 🗂️ Z-Index Layers

```
OS Layer Stack (Bottom → Top):
─────────────────────────────
 0   desktop          Background layer
10   app-surface      Active app
20   app-header       App headers
100  sidebar/topbar   Navigation chrome
200  dropdown         Dropdowns, menus
300  overlay          Overlay backdrops
400  modal            Modal dialogs
500  overlay-panel    OS Overlay Panels
600  system-menu      System menus
700  toast            Toast notifications
800  tooltip          Tooltips
```

---

## Responsive Rules

### 📱 Breakpoints

| Device | Breakpoint | Width Range |
|--------|------------|-------------|
| Mobile Compact | `mobile-compact` | 0 - 359px |
| Mobile | `mobile` | 360 - 639px |
| Tablet Portrait | `tablet-portrait` | 640 - 767px |
| Tablet Landscape | `tablet-landscape` | 768 - 1023px |
| Desktop Small | `desktop-sm` | 1024 - 1279px |
| Desktop Medium | `desktop-md` | 1280 - 1535px |
| Desktop Large | `desktop-lg` | 1536px+ |

### 🖥️ Layout Rules

#### Desktop
- Sidebar: Full width (240px), collapsible
- App Surface: max-width 1280px, padding 24px
- Desktop Grid: 4 columns, gap 24px

#### Tablet
- Sidebar: Collapsed by default (64px)
- Touch targets: min 44px
- Desktop Grid: 2 columns

#### Mobile
- No persistent sidebar (overlay only)
- Touch targets: min 48px
- Desktop Grid: 1 column (stack)

### ⚠️ Responsive Acceptance Criteria
- ❌ No layout shift when resizing
- ❌ No horizontal overflow
- ✅ Touch targets pass minimum sizes
- ✅ OS perception maintained (not "website feel")

---

## Appearance & Contrast

### 🎨 Background Types

```typescript
type BackgroundType = 'solid' | 'gradient' | 'image';

// Available presets:
'default'        // neutral-50 (light)
'white'          // pure white
'light-gray'     // neutral-100
'dark'           // neutral-900
'gradient-light' // light gray gradient
'gradient-blue'  // blue tint gradient
'gradient-dark'  // dark gradient
'gradient-ocean' // deep blue gradient
```

### 🔄 Auto Contrast

Auto Contrast จะปรับ foreground color อัตโนมัติตาม background:

```typescript
import { getContrastForeground, createAppearanceContext } from '@/lib/os-core';

// ตรวจสอบว่าต้องใช้ text สีอะไร
const contrast = getContrastForeground('rgb(23, 23, 23)'); // 'light'
const contrast = getContrastForeground('rgb(255, 255, 255)'); // 'dark'

// สร้าง context สำหรับ Desktop
const ctx = createAppearanceContext('gradient-dark');
// ctx.contrast = 'light' (ต้องใช้ text สีขาว)
```

### 📝 Usage in Components

```jsx
// Apply contrast class to container
<div className={`os-desktop ${contrast === 'light' ? 'os-contrast-light' : ''}`}>
  <p className="os-text">This text adapts to background</p>
</div>
```

---

## 🔒 Phase 7.1 Lock Rules

เมื่อ implement แล้ว ห้ามละเมิด:

1. **ห้ามแก้ A1 routing policy** `/home + ?app=`
2. **ห้ามทำ STEP 6.1-6.4 regression** (Focus/Background/Silence/Memory)
3. **ห้ามเพิ่มฟีเจอร์ OS ใหม่** (multi-window/tabs/minimize/maximize)
4. **ใช้ tokens เท่านั้น** — ห้าม hardcode

---

## 📁 File Locations

```
lib/os-core/
├── index.ts           # Central export
├── tokens.ts          # All design tokens
├── breakpoints.ts     # Responsive rules
└── appearance.ts      # Background + Auto Contrast

app/
└── globals.css        # CSS Custom Properties

modules/design-system/src/tokens/  # Legacy (reference only)
```

---

**Status**: Core System = STANDARDIZED ✅  
**Next**: Apply tokens to components progressively
