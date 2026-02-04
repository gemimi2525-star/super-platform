# NEXUS Design Principles v1.0

> Phase 8 — OS Design System
> 
> หลักการออกแบบ NEXUS Shell — นิ่ง เท่ พรีเมียม แบบ macOS

---

## 1. Design Philosophy

### OS-First (ไม่ใช่ Web-First)
NEXUS ออกแบบเป็น **Operating System UI** ไม่ใช่ Web Application
- Window-based interaction
- Focus management at system level
- Desktop metaphor (not page-based navigation)

### Calm, Neutral, Low-Noise
- ลดสิ่งรบกวนสายตา
- สีเป็นกลาง ไม่ว้าว
- Animation มีเฉพาะที่จำเป็น

### Typography-Driven
- Typography เป็นตัวนำ ก่อนสี/กราฟิก
- System font stack (SF Pro, -apple-system)
- ข้อความอ่านง่าย ชัดเจน

### Subtle Depth
- Shadows ละเอียด ไม่หนักมือ
- ไม่มี drop shadow เกินจำเป็น
- Blur effects สร้าง depth แทน shadows หนัก

---

## 2. Token Reference

### Typography Scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 32px | Bold | Hero headings, splash |
| Title | 20px | Semibold | Window titles, sections |
| Section | 16px | Medium | Subsection headers |
| Body | 14px | Regular | Default content |
| Caption | 12px | Regular | Labels, helper text |
| Micro | 11px | Regular | Timestamps, badges |

**CSS Variables:**
```css
--nx-text-display: 32px;
--nx-text-title: 20px;
--nx-text-section: 16px;
--nx-text-body: 14px;
--nx-text-caption: 12px;
--nx-text-micro: 11px;
```

---

### Color Palette

#### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `--nx-surface-desktop` | Gradient (dark blue) | Desktop background |
| `--nx-surface-window` | #ffffff | Window background |
| `--nx-surface-panel` | #f5f5f7 | Sidebar, panels |
| `--nx-surface-titlebar` | Gradient (light gray) | Window title bar |
| `--nx-surface-menubar` | rgba(30,30,30,0.85) | Menu bar |
| `--nx-surface-dock` | rgba(255,255,255,0.18) | Dock background |

#### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--nx-text-primary` | #1d1d1f | Primary text |
| `--nx-text-secondary` | #6e6e73 | Secondary text |
| `--nx-text-tertiary` | #86868b | Tertiary/placeholder |
| `--nx-text-inverse` | #ffffff | Text on dark bg |

#### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `--nx-accent` | #007aff | Links, primary actions |
| `--nx-success` | #34c759 | Success states |
| `--nx-warning` | #ff9500 | Warnings |
| `--nx-danger` | #ff3b30 | Errors, destructive |

---

### Elevation

| Level | Token | Usage |
|-------|-------|-------|
| Desktop | `--nx-z-desktop` (0) | Background layer |
| Window | `--nx-shadow-window` | Focused windows |
| Unfocused | `--nx-shadow-window-unfocused` | Inactive windows |
| Dock | `--nx-shadow-dock` | Dock bar |
| Dropdown | `--nx-shadow-dropdown` | Menus, dropdowns |

---

### Spacing (4px Grid)

```css
--nx-space-1: 4px;
--nx-space-2: 8px;
--nx-space-3: 12px;
--nx-space-4: 16px;
--nx-space-5: 20px;
--nx-space-6: 24px;
--nx-space-8: 32px;
```

---

### Motion

| Duration | Token | Usage |
|----------|-------|-------|
| Instant | 80ms | Micro-interactions |
| Fast | 120ms | Hover, focus states |
| Normal | 180ms | Window transitions |
| Slow | 250ms | Complex animations |

**Easing:** Always use `ease-out` variants
```css
--nx-ease-out: cubic-bezier(0.25, 0.1, 0.25, 1.0);
```

---

## 3. Do / Don't

### ✅ DO

- ใช้ token ทุกครั้ง (`var(--nx-*)`)
- ให้ typography นำ สีตาม
- Animation สั้น < 250ms
- ใช้ blur สร้าง depth
- Contrast ratio ≥ 4.5:1

### ❌ DON'T

- ❌ Hardcode สี (`#333`, `rgb()`)
- ❌ ใช้ shadow หนัก
- ❌ Animation นานเกิน 300ms
- ❌ สีจี๊ดหรือ gradients หลากสี
- ❌ Custom fonts นอก system stack
- ❌ App-specific theming

---

## 4. Component Patterns

### Window Chrome
```tsx
// ✅ Correct
background: 'var(--nx-surface-window)'
boxShadow: isFocused 
    ? 'var(--nx-shadow-window)' 
    : 'var(--nx-shadow-window-unfocused)'

// ❌ Wrong
background: '#ffffff'
boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
```

### Title Bar Text
```tsx
// ✅ Correct
color: isFocused 
    ? 'var(--nx-text-titlebar)' 
    : 'var(--nx-text-titlebar-unfocused)'

// ❌ Wrong
color: isFocused ? '#333' : '#888'
```

### Dock Item
```tsx
// ✅ Correct
background: hover 
    ? 'var(--nx-surface-dock-item-hover)' 
    : 'var(--nx-surface-dock-item)'

// ❌ Wrong
background: hover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'
```

---

## 5. Governance

- ❄️ **SYNAPSE Kernel FROZEN** — ห้ามแก้ไข
- ❄️ **Interaction Model v1.0 FROZEN** — ห้ามเปลี่ยน behavior
- Design เปลี่ยนหน้าตาได้ แต่ห้ามเปลี่ยนพฤติกรรม

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial design system (Phase 8) |
