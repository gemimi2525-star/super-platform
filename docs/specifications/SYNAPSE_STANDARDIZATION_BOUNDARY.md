# SYNAPSE Standardization Boundary — v1.0

> *"What is Standard, What is Implementation"*

**Document Type:** Governance Specification
**Version:** 1.0 (FINAL)
**Status:** FROZEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document formally declares the boundary between:
- **STANDARD** — Normative specifications that must be followed
- **IMPLEMENTATION** — Reference code that may be replaced

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STANDARD (Normative)

These specifications are **FROZEN** and define SYNAPSE compliance.

### Schemas

| Schema | Version | Status |
|--------|---------|--------|
| DecisionExplanation | 1.0 | FROZEN |
| AuditRecord | 1.0 | FROZEN |
| AttestationManifest | 1.0 | FROZEN |

### DecisionExplanation Schema
```
DecisionExplanation := {
    decision: "ALLOW" | "DENY" | "SKIP",
    intentType: string,
    correlationId: string,
    policyDomain: "SpacePolicy" | "CapabilityPolicy" | "WindowManager" | "System",
    failedRule?: string,          // Required if decision = DENY
    skipReason?: string,          // Required if decision = SKIP
    reasonChain: [string],        // Non-empty array
    timestamp: number             // Epoch milliseconds
}
```

### AuditRecord Schema
```
AuditRecord := {
    chainId: string,
    seq: number,                  // Positive integer, starting at 1
    recordedAt: number,           // Epoch milliseconds
    eventType: "DECISION_EXPLAINED",
    payload: DecisionExplanation,
    prevHash: string,             // "GENESIS" for first record
    recordHash: string,           // SHA-256 hex
    version: "1.0"
}
```

### AttestationManifest Schema
```
AttestationManifest := {
    version: "1.0",
    toolVersion: string,
    chainId: string,
    segmentName: string,
    seqStart: number,
    seqEnd: number,
    recordCount: number,
    headHash: string,
    segmentDigest: string,        // SHA-256 hex
    signature: string,            // Ed25519 base64
    algorithm: "ed25519",
    publicKeyId: string,          // SHA-256(pubKey)[:16] hex
    createdAt: number             // Epoch milliseconds
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Algorithms (FROZEN)

| Purpose | Algorithm | Standard |
|---------|-----------|----------|
| Content Hash | SHA-256 | FIPS 180-4 |
| Signature | Ed25519 | RFC 8032 |
| Encoding | UTF-8 | RFC 3629 |
| Serialization | Canonical JSON | See below |

### Canonical JSON Rules
1. Keys sorted alphabetically (ASCII order)
2. No whitespace between tokens
3. Undefined values omitted
4. Null values preserved
5. Numbers as JSON standard
6. Strings escaped per JSON spec

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Verification Rules (FROZEN)

1. Sequence numbers are continuous (1, 2, 3, ...)
2. First record has prevHash = "GENESIS"
3. Each record's prevHash = previous record's recordHash
4. recordHash = SHA-256(canonical(record without recordHash))
5. segmentDigest = SHA-256(file bytes)
6. Signature verifies against public key

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## IMPLEMENTATION (Non-Normative)

These are reference implementations. They may be replaced with any
implementation that conforms to the STANDARD.

### CoreOS Reference Implementation

| Component | Description | Replaceable |
|-----------|-------------|-------------|
| `coreos/types.ts` | TypeScript types | ✅ Yes |
| `coreos/kernel.ts` | Event kernel | ✅ Yes |
| `coreos/policy-engine.ts` | Policy evaluation | ✅ Yes |
| `coreos/window-manager.ts` | Window management | ✅ Yes |
| `coreos/audit/*` | Audit pipeline | ✅ Yes |
| `coreos/attestation/*` | Signing/verification | ✅ Yes |

### File Layout

| Item | Normative |
|------|-----------|
| Directory structure | ❌ No |
| File naming | ❌ No |
| Import paths | ❌ No |
| Build system | ❌ No |

### Programming Language

| Item | Normative |
|------|-----------|
| TypeScript | ❌ No |
| Node.js | ❌ No |
| npm | ❌ No |

### Test Framework

| Item | Normative |
|------|-----------|
| Scenario runner | ❌ No |
| Test structure | ❌ No |
| Assert patterns | ❌ No |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Compliance Definition

### SYNAPSE-Compliant System
A system is SYNAPSE-compliant if:
1. It produces DecisionExplanation matching the schema
2. It produces AuditRecord matching the schema
3. It produces AttestationManifest matching the schema
4. It uses the specified algorithms correctly
5. Its output can be verified by any conformant verifier

### SYNAPSE-Compliant Verifier
A verifier is SYNAPSE-compliant if:
1. It follows the Verification Specification
2. It produces identical results to other compliant verifiers
3. It requires no external dependencies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Boundary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         STANDARD                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Schemas   │  Algorithms  │  Verification Rules       │  │
│  │            │              │                           │  │
│  │  FROZEN    │  FROZEN      │  FROZEN                   │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                       IMPLEMENTATION                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CoreOS    │  TypeScript  │  File Layout  │  Tests    │  │
│  │            │              │               │           │  │
│  │  Reference │  Reference   │  Reference    │  Reference│  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      PRODUCT LAYER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI  │  API  │  Integrations  │  Features  │  UX      │  │
│  │      │       │                │            │          │  │
│  │  Out of Scope — Not governed by SYNAPSE              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Interoperability

### Cross-Implementation Compatibility

Any two SYNAPSE-compliant implementations MUST:
1. Produce verifiable output from one to the other
2. Accept each other's audit segments
3. Produce identical verification results

### Example

```
Implementation A (Rust):
    produces: segment-a.jsonl, manifest-a.json

Implementation B (Python):
    verifies: segment-a.jsonl, manifest-a.json
    result: { ok: true }

Implementation C (Go):
    verifies: segment-a.jsonl, manifest-a.json
    result: { ok: true }

All three implementations are interoperable.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Final Statement

SYNAPSE is a **specification**, not a product.
The reference implementation is **one way** to implement it.
Any correct implementation is **equally valid**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Standardization Boundary v1.0*
*Status: FROZEN*
