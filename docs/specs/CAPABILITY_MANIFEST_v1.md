# Capability Manifest Specification — v1.0

> *"Manifest คือสัญญาระหว่าง Capability กับ System"*

**Status:** CANONICAL — SPECIFICATION
**Authority:** SYNAPSE Canonical Pack v1.0 + Extension Law v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Capability Manifest คือ **เอกสารประจำตัวของ Capability**
ทุก Capability ต้องมี Manifest ที่สมบูรณ์ก่อนเข้าระบบ

Manifest ไม่ใช่ documentation — มันคือ **contract**
ถ้า Manifest พูดว่า A แต่ Capability ทำ B → **ถือว่าผิดกฎหมาย**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 1: Manifest Structure

### 1.1 Complete Interface

```typescript
interface CapabilityManifest {
    // ═══════════════════════════════════════════════════════
    // IDENTITY (Required)
    // ═══════════════════════════════════════════════════════
    
    /**
     * Unique capability identifier
     * Format: namespace.action (e.g., 'core.settings', 'user.manage')
     */
    id: CapabilityId;
    
    /**
     * Human-readable title
     * Displayed in Window title bar and Dock
     */
    title: string;
    
    /**
     * Icon identifier (emoji or icon name)
     * Displayed in Dock and Window header
     */
    icon: string;
    
    // ═══════════════════════════════════════════════════════
    // POLICY (Required)
    // ═══════════════════════════════════════════════════════
    
    /**
     * List of required policies to activate this capability
     * User must have ALL listed policies
     */
    requiredPolicies: string[];
    
    // ═══════════════════════════════════════════════════════
    // BEHAVIOR (Required)
    // ═══════════════════════════════════════════════════════
    
    /**
     * If true, only one window can exist for this capability
     * Opening again will focus existing window
     */
    singleInstance: boolean;
    
    /**
     * If true, requires step-up authentication before activation
     */
    requiresStepUp: boolean;
    
    /**
     * Challenge message shown during step-up
     * Required if requiresStepUp is true
     */
    stepUpMessage?: string;
    
    // ═══════════════════════════════════════════════════════
    // WINDOW (Required)
    // ═══════════════════════════════════════════════════════
    
    /**
     * How this capability appears on desktop
     * - 'window': Standard movable window
     * - 'modal': Blocking modal dialog
     * - 'none': No visual presence (BLOCKED - see note)
     */
    windowMode: 'window' | 'modal' | 'none';
    
    // ═══════════════════════════════════════════════════════
    // CERTIFICATION (Optional - System Assigned)
    // ═══════════════════════════════════════════════════════
    
    /**
     * Certification tier (assigned after review)
     */
    certificationTier?: 'core' | 'certified' | 'experimental';
    
    /**
     * ISO8601 timestamp of certification
     */
    certifiedAt?: string;
    
    /**
     * Who certified this capability
     */
    certifiedBy?: string;
}
```

### 1.2 Field Requirements by Tier

| Field | CORE | CERTIFIED | EXPERIMENTAL |
|-------|------|-----------|--------------|
| id | Required | Required | Required |
| title | Required | Required | Required |
| icon | Required | Required | Required |
| requiredPolicies | Required | Required | Required |
| singleInstance | Required | Required | Required |
| requiresStepUp | Required | Required | Required |
| stepUpMessage | If stepUp | If stepUp | If stepUp |
| windowMode | Required | Required | Required |
| certificationTier | core | certified | experimental |
| certifiedAt | N/A | Required | N/A |
| certifiedBy | N/A | Required | N/A |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 2: Field Details

### 2.1 Capability ID

```typescript
type CapabilityId = string & { readonly __brand: 'CapabilityId' };
```

**Format:** `namespace.action`

| Namespace | Usage | Examples |
|-----------|-------|----------|
| `core` | System-built capabilities | `core.settings` |
| `user` | User management | `user.manage`, `user.profile` |
| `org` | Organization management | `org.manage`, `org.settings` |
| `audit` | Audit functionality | `audit.view`, `audit.export` |
| `system` | System configuration | `system.configure` |
| `plugin` | Third-party plugins | `plugin.analytics` |
| `custom` | Custom capabilities | `custom.report` |

**Rules:**
- Lowercase only
- No special characters except `.`
- Maximum 2 levels (namespace.action)
- Must be unique in registry

### 2.2 Title

**Requirements:**
- Human-readable
- 2-30 characters
- No technical jargon
- Describable action or noun

**Examples:**
- ✅ `"Settings"`
- ✅ `"User Management"`
- ✅ `"Audit Logs"`
- ❌ `"core.settings"` (technical)
- ❌ `"S"` (too short)

### 2.3 Icon

**Supported Formats:**
- Emoji: `"⚙️"`, `"👤"`, `"📋"`
- Icon name: `"settings"`, `"user"`, `"audit"`

**Rules:**
- Must be visually distinct
- Should represent capability's function
- Required for Dock display

### 2.4 Required Policies

```typescript
requiredPolicies: string[];
```

**Examples:**
```typescript
// Read-only capability
requiredPolicies: ['settings.read']

// Read-write capability
requiredPolicies: ['users.read', 'users.write']

// Admin capability
requiredPolicies: ['system.admin']
```

**Evaluation:**
- User must have ALL listed policies
- Missing ANY → PolicyDecision: deny

### 2.5 Single Instance

```typescript
singleInstance: boolean;
```

| Value | Behavior |
|-------|----------|
| `true` | Only one window allowed. Re-open focuses existing. |
| `false` | Multiple windows allowed. Each has unique windowId. |

**Use Cases:**
- `true`: Settings, System Config (single source of truth)
- `false`: Documents, Reports (multiple instances useful)

### 2.6 Step-Up Authentication

```typescript
requiresStepUp: boolean;
stepUpMessage?: string;
```

**When to use stepUp:**
- Sensitive data access
- Irreversible actions
- Admin operations
- Financial transactions

**Step-Up Flow:**
1. User triggers capability
2. Policy Engine returns `require_stepup`
3. StepUp modal appears with `stepUpMessage`
4. User verifies identity
5. Capability activates

### 2.7 Window Mode

```typescript
windowMode: 'window' | 'modal' | 'none';
```

| Mode | Description | Use Case |
|------|-------------|----------|
| `window` | Standard desktop window | Most capabilities |
| `modal` | Blocking overlay | Confirmations, step-up |
| `none` | No visual presence | **BLOCKED** |

> ⚠️ **WARNING:** `windowMode: 'none'` will fail certification.
> All capabilities must have visual presence to maintain Calm principles.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 3: Example Manifests

### 3.1 Core Settings (CORE Tier)

```typescript
const SETTINGS_MANIFEST: CapabilityManifest = {
    id: 'core.settings',
    title: 'Settings',
    icon: '⚙️',
    requiredPolicies: ['settings.read'],
    singleInstance: true,
    requiresStepUp: false,
    windowMode: 'window',
    certificationTier: 'core',
};
```

### 3.2 User Management (CORE Tier, Step-Up)

```typescript
const USER_MANAGE_MANIFEST: CapabilityManifest = {
    id: 'user.manage',
    title: 'Users',
    icon: '👤',
    requiredPolicies: ['users.read', 'users.write'],
    singleInstance: true,
    requiresStepUp: true,
    stepUpMessage: 'Verify your identity to access user management',
    windowMode: 'window',
    certificationTier: 'core',
};
```

### 3.3 Audit Logs (CORE Tier)

```typescript
const AUDIT_VIEW_MANIFEST: CapabilityManifest = {
    id: 'audit.view',
    title: 'Audit Logs',
    icon: '📋',
    requiredPolicies: ['audit.view'],
    singleInstance: false, // Multiple audit views allowed
    requiresStepUp: false,
    windowMode: 'window',
    certificationTier: 'core',
};
```

### 3.4 System Configure (CORE Tier, Step-Up)

```typescript
const SYSTEM_CONFIGURE_MANIFEST: CapabilityManifest = {
    id: 'system.configure',
    title: 'System',
    icon: '🔧',
    requiredPolicies: ['system.admin'],
    singleInstance: true,
    requiresStepUp: true,
    stepUpMessage: 'Verify your identity to access system configuration',
    windowMode: 'window',
    certificationTier: 'core',
};
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 4: Manifest Validation

### 4.1 Required Field Check

```typescript
function validateManifest(m: CapabilityManifest): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!m.id) errors.push('id is required');
    if (!m.title) errors.push('title is required');
    if (!m.icon) errors.push('icon is required');
    if (!m.requiredPolicies?.length) errors.push('requiredPolicies is required');
    if (typeof m.singleInstance !== 'boolean') errors.push('singleInstance is required');
    if (typeof m.requiresStepUp !== 'boolean') errors.push('requiresStepUp is required');
    if (!m.windowMode) errors.push('windowMode is required');
    
    // Conditional
    if (m.requiresStepUp && !m.stepUpMessage) {
        errors.push('stepUpMessage required when requiresStepUp is true');
    }
    
    // Constraints
    if (m.windowMode === 'none') {
        errors.push('windowMode:none is not allowed');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

### 4.2 ID Format Check

```typescript
const ID_PATTERN = /^[a-z]+\.[a-z]+$/;

if (!ID_PATTERN.test(m.id)) {
    errors.push('id must be namespace.action format (lowercase)');
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 5: Manifest Lifecycle

### 5.1 Creation → Registration → Certification

```
DRAFT → REGISTERED → CERTIFIED
           ↓              ↓
       REJECTED      EXPERIMENTAL
```

### 5.2 Immutability After Certification

Once CERTIFIED:
- `id` → IMMUTABLE
- `requiredPolicies` → Proposal required to change
- `requiresStepUp` → Proposal required to change
- `title`, `icon` → May change with review

---

## Section 6: Alignment with Phase C

### 6.1 Extension Law Alignment

| Extension Law | Manifest Enforcement |
|---------------|---------------------|
| Extension ต้องต่อได้ | ✅ Manifest defines clear boundaries |
| Extension ครอบงำไม่ได้ | ✅ Manifest cannot override Policy |
| Kernel ไม่ถูกแตะ | ✅ Manifest ไม่ access Kernel |

### 6.2 Window Semantics Alignment

| Window Contract | Manifest Enforcement |
|-----------------|---------------------|
| Window = Context View | ✅ windowMode defines how |
| No auto-open | ✅ Requires Intent to activate |
| Calm-safe | ✅ windowMode:none blocked |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Manifest คือ DNA ของ Capability
ถ้า Manifest ผิด → Capability ผิด

> **Manifest ที่สมบูรณ์ = Capability ที่ไว้ใจได้**
> **Manifest ที่หายไป = Capability ที่ไม่มีอยู่จริง**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Capability Manifest Specification v1.0*
*Canonical — Specification*
