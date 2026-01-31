# SYNAPSE / APICOREDATA Architecture

## Directory Structure

```
APICOREDATA/
├── vendor/
│   └── synapse-core/           # ← SYNAPSE GOVERNANCE KERNEL (FROZEN)
│       ├── core/
│       │   ├── kernel/
│       │   ├── policy-engine/
│       │   ├── audit/
│       │   ├── attestation/
│       │   └── types/
│       ├── docs/
│       └── package.json
│
├── governance/
│   └── synapse/                # ← ADAPTER LAYER
│       ├── synapse-adapter.ts   # Bridge to SYNAPSE
│       ├── intent-mapper.ts     # UI → Intent mapping
│       └── index.ts
│
├── coreos/                     # ← RUNTIME + PRODUCT (to be split)
│   ├── [GOVERNANCE SOURCE]     # Temporary - migrating to vendor/synapse-core
│   ├── desktop-ui.tsx          # PRODUCT: React UI
│   ├── react.tsx               # PRODUCT: React integration
│   ├── scenario-runner.ts      # TEST: Scenario validation
│   └── intelligence/           # PRODUCT: AI features
│
└── app/
    └── [locale]/
        └── core-os-demo/       # Uses coreos/desktop-ui
```

## Import Rules

### ✅ ALLOWED

```typescript
// Product layer imports from governance adapter
import { synapseAdapter, IntentFactory } from '@/governance/synapse';

// Product layer imports from coreos product files
import { CoreOSDesktop } from '@/coreos/desktop-ui';

// Governance adapter imports from coreos (bridge layer)
// (inside governance/synapse/*.ts only)
import { getKernel } from '../../coreos/index';
```

### ❌ NOT ALLOWED (after migration)

```typescript
// Direct kernel imports in product layer
import { getKernel } from '@/coreos/kernel';  // ❌
import { getPolicyEngine } from '@/coreos/policy-engine';  // ❌
```

## File Categories

| File | Category | Location |
|------|----------|----------|
| `types.ts` | GOVERNANCE | vendor/synapse-core |
| `kernel.ts` | GOVERNANCE | vendor/synapse-core |
| `policy-engine.ts` | GOVERNANCE | vendor/synapse-core |
| `audit/*` | GOVERNANCE | vendor/synapse-core |
| `attestation/*` | GOVERNANCE | vendor/synapse-core |
| `desktop-ui.tsx` | PRODUCT | coreos/ (stays) |
| `react.tsx` | PRODUCT | coreos/ (stays) |
| `scenario-runner.ts` | TEST | coreos/ (stays) |

## Migration Status

- [x] vendor/synapse-core created
- [x] governance/synapse adapter created
- [x] Build passes
- [x] 123/123 tests pass
- [ ] Product files migrated to use governance/synapse
- [ ] Duplicate governance source removed from coreos/
