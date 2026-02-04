# App Development Guide v1.0

> Phase 9 — Core Apps & App Platform Foundation
>
> คู่มือสร้าง Core Apps สำหรับ NEXUS OS

---

## 1. Overview

NEXUS OS ใช้ระบบ App ที่ประกอบด้วย:
- **Shell Manifest** — กำหนด visibility/role gating (components/os-shell/apps/manifest.ts)
- **SYNAPSE Capability** — กำหนด authority/policy (vendor/synapse-core)
- **React Component** — UI ของ app (components/os-shell/apps/)

```
┌───────────────────────────────────────┐
│            Shell Manifest             │  ← Visibility, Role Gate
├───────────────────────────────────────┤
│         SYNAPSE Capability            │  ← Authority, Policy
├───────────────────────────────────────┤
│           React Component             │  ← UI
└───────────────────────────────────────┘
```

---

## 2. Shell App Manifest

### Interface

```typescript
interface ShellAppManifest {
    // Identity
    appId: string;              // Must match CapabilityId
    name: string;               // Display name
    icon: string;               // Emoji or icon
    version: string;            // semver
    category: AppCategory;      // 'core' | 'utility' | 'admin' | 'experimental'
    
    // Access Control
    requiredRole: UserRole;     // 'guest' | 'user' | 'admin' | 'owner'
    capabilities: string[];     // SYNAPSE capabilities
    
    // Behavior
    singleInstance: boolean;    // Only one window?
    showInDock: boolean;        // Show in dock?
    showInFinder: boolean;      // Show in Finder?
}
```

### ตัวอย่าง

```typescript
// components/os-shell/apps/manifest.ts

'core.settings': {
    appId: 'core.settings',
    name: 'System Settings',
    icon: '⚙️',
    version: '1.0.0',
    category: 'core',
    requiredRole: 'user',       // ทุก user เห็น
    capabilities: ['core.settings'],
    singleInstance: true,       // เปิดได้แค่ 1 window
    showInDock: true,
    showInFinder: true,
},

'system.configure': {
    appId: 'system.configure',
    name: 'System Configure',
    icon: '🔧',
    version: '1.0.0',
    category: 'admin',
    requiredRole: 'owner',      // เฉพาะ owner เห็น
    capabilities: ['system.configure'],
    singleInstance: true,
    showInDock: true,
    showInFinder: true,
},
```

---

## 3. Creating a New App

### Step 1: Create Component

```typescript
// components/os-shell/apps/myapp/MyApp.tsx

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
import type { AppProps } from '../registry';

export function MyApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'var(--nx-surface-window)',
            color: 'var(--nx-text-primary)',
            fontFamily: 'var(--nx-font-system)',
            padding: 'var(--nx-space-4)',
        }}>
            <h1 style={{
                fontSize: 'var(--nx-text-title)',
                fontWeight: 'var(--nx-weight-semibold)',
            }}>
                My App
            </h1>
        </div>
    );
}
```

### Step 2: Add to Registry

```typescript
// components/os-shell/apps/registry.tsx

const MyAppLazy = lazy(() =>
    import('./myapp/MyApp').then(m => ({ default: m.MyApp }))
);

export const appRegistry: Record<string, ComponentType<AppProps>> = {
    // ...existing apps
    'my.app': createLazyApp(MyAppLazy),
};
```

### Step 3: Add Shell Manifest

```typescript
// components/os-shell/apps/manifest.ts

'my.app': {
    appId: 'my.app',
    name: 'My App',
    icon: '🚀',
    version: '1.0.0',
    category: 'utility',
    requiredRole: 'user',
    capabilities: [],
    singleInstance: true,
    showInDock: true,
    showInFinder: true,
},
```

### Step 4: Register SYNAPSE Capability (if needed)

> ⚠️ **SYNAPSE kernel is FROZEN** — ต้องใช้ CapabilityId ที่มีอยู่
> หรือขอเพิ่มใน Phase ถัดไป

---

## 4. Design System Rules

### ✅ DO

```typescript
// Use NEXUS tokens
background: 'var(--nx-surface-window)'
color: 'var(--nx-text-primary)'
fontSize: 'var(--nx-text-body)'
padding: 'var(--nx-space-4)'
borderRadius: 'var(--nx-radius-md)'
```

### ❌ DON'T

```typescript
// Hardcode values
background: '#ffffff'
color: '#333333'
fontSize: '14px'
padding: '16px'
borderRadius: '6px'
```

---

## 5. Single-Instance Apps

ใช้ `useSingleInstanceOpen` เพื่อจัดการ single-instance:

```typescript
import { useSingleInstanceOpen } from '@/governance/synapse';

function DockItem({ appId }: { appId: string }) {
    const open = useSingleInstanceOpen();
    
    return (
        <button onClick={() => open(appId)}>
            Launch
        </button>
    );
}
```

Behavior:
- ถ้า app มี `singleInstance: true` และเปิดอยู่แล้ว → focus window เดิม
- ถ้ายังไม่เปิด → เปิด window ใหม่

---

## 6. Persona Gating

### Dock Visibility

`useDockCapabilities` จะ filter apps ตาม role อัตโนมัติ:

```typescript
const capabilities = useDockCapabilities();
// Returns only apps where roleHasAccess(userRole, manifest.requiredRole) === true
```

### Manual Check

```typescript
import { useCanLaunchApp } from '@/governance/synapse';

function LaunchButton({ appId }) {
    const canLaunch = useCanLaunchApp(appId);
    
    if (!canLaunch) return null;
    
    return <button>Launch</button>;
}
```

---

## 7. App Categories

| Category | Description | Example |
|----------|-------------|---------|
| `core` | Essential system apps | Settings, Finder |
| `utility` | General purpose tools | Browser, Calculator |
| `admin` | Admin-only features | Users, Orgs, Audit |
| `experimental` | Unstable/testing | Analytics |

---

## 8. Governance

### ❄️ FROZEN (ห้ามแก้ไข)

- SYNAPSE Kernel
- Interaction Model v1.0
- Window Lifecycle behavior

### ✅ Modifiable

- Shell Manifests (visibility only)
- UI Components (visual only)
- NEXUS tokens (append-only)

---

## 9. Quick Reference

### Hooks

| Hook | Purpose |
|------|---------|
| `useOpenCapability` | Open any capability |
| `useSingleInstanceOpen` | Single-instance aware open |
| `useDockCapabilities` | Get visible dock apps |
| `useCanLaunchApp` | Check if user can launch |
| `useWindowControls` | Focus/minimize/close |
| `useSecurityContext` | Get current role |

### Token Categories

| Prefix | Example | Usage |
|--------|---------|-------|
| `--nx-surface-*` | `--nx-surface-window` | Backgrounds |
| `--nx-text-*` | `--nx-text-primary` | Text colors |
| `--nx-space-*` | `--nx-space-4` | Spacing (16px) |
| `--nx-radius-*` | `--nx-radius-md` | Border radius |
| `--nx-weight-*` | `--nx-weight-medium` | Font weights |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial guide (Phase 9) |
