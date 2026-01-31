# SYNAPSE Core

> **Governance Kernel for Explainable, Verifiable Access Control**

**Version:** 1.0 (FROZEN)
**Status:** Read-Only Reference Implementation

---

## What SYNAPSE Is

SYNAPSE is a **governance kernel** that provides:

- **Explainable Decisions** — Every ALLOW/DENY/SKIP has a reason chain
- **Immutable Audit Trail** — Hash-chained, append-only records
- **Cryptographic Attestation** — Ed25519 signed audit segments
- **Independent Verification** — Verify without running the system

---

## What SYNAPSE Is NOT

- ❌ NOT a product or application
- ❌ NOT a UI framework
- ❌ NOT a runtime system
- ❌ NOT a feature library
- ❌ NOT modifiable (FROZEN v1.0)

---

## Core Modules

| Module | Description |
|--------|-------------|
| `core/kernel` | Intent → Policy → Decision |
| `core/policy-engine` | Policy evaluation |
| `core/audit` | Hash-chained audit records |
| `core/attestation` | Ed25519 signing & verification |
| `core/types` | Schema definitions |

---

## Usage

SYNAPSE is consumed via adapter layer. Do NOT import directly.

```typescript
// ✅ Correct - via adapter
import { SynapseAdapter } from 'your-app/governance/synapse';

// ❌ Wrong - direct import
import { Kernel } from 'synapse-core';
```

---

## Frozen Specifications

- DecisionExplanation v1.0
- AuditRecord v1.0
- AttestationManifest v1.0
- SHA-256 (FIPS 180-4)
- Ed25519 (RFC 8032)

---

## License

See CORE_FREEZE.md for terms.
