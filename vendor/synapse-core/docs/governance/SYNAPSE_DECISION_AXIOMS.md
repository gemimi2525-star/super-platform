# SYNAPSE Decision Axioms — v1.0

> *"First Principles of System Decisions"*

**Document Type:** Governance Specification
**Version:** 1.0 (FINAL)
**Status:** FROZEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document defines the **axioms** — the foundational truths that cannot be derived from anything simpler — upon which all SYNAPSE decisions are based.

These axioms are not configurable.
They are not preferences.
They are the laws of the system.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 1: Every Decision Has Three Outcomes

```
DECISION := ALLOW | DENY | SKIP
```

There is no fourth option.
There is no "maybe" or "pending".
Every intent that enters the system exits with one of these three.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 2: Every Decision Has a Reason Chain

```
DecisionExplanation := {
    decision: ALLOW | DENY | SKIP,
    reasonChain: [high-level, ..., low-level],
    ...
}
```

A decision without a reason chain is invalid.
The chain must trace from the intent to the specific rule that fired.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 3: Same Input, Same Output

```
evaluate(policy, intent, state) → decision

∀ (policy, intent, state):
    evaluate(policy, intent, state) at T1 
    === 
    evaluate(policy, intent, state) at T2
```

Decisions are **pure functions**.
Time does not affect the outcome (only timestamp in the record).
Random factors do not exist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 4: DENY Requires Failed Rule

```
if decision === DENY:
    failedRule must exist
    failedRule must be specific
    failedRule must be auditable
```

A DENY without a named rule is a system error.
The rule name must match a documented policy rule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 5: SKIP is Not DENY

```
SKIP := action not performed due to non-policy reason
DENY := action explicitly forbidden by policy
```

| Situation | Outcome |
|-----------|---------|
| Policy says "not allowed" | DENY |
| Window is backgroundOnly | SKIP |
| Context not found | SKIP |
| Permission not granted | DENY |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 6: Policy Domains Are Disjoint

```
PolicyDomain := SpacePolicy | CapabilityPolicy | WindowManager | System
```

A decision comes from exactly one domain.
Domains do not overlap.
Each domain has exclusive authority over its decisions.

```
SpacePolicy      → space access, window permissions
CapabilityPolicy → capability tier, step-up requirements
WindowManager    → window lifecycle, mode constraints
System           → bootstrap, authentication
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 7: Audit Records Are Append-Only

```
AuditChain := [R1, R2, R3, ...]

∀ N:
    R(N).prevHash === R(N-1).recordHash
    R(1).prevHash === "GENESIS"
```

No record can be inserted, modified, or deleted.
The chain extends forward only.
Any break in the chain is detectable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 8: Hash Binds Content to Identity

```
recordHash := SHA-256(canonical(record without hash))
```

If the content changes, the hash changes.
If the hash matches, the content is identical.
There are no exceptions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 9: Signature Binds Record to Signer

```
signature := Ed25519(privateKey, digest)
verify(publicKey, digest, signature) → boolean
```

A valid signature proves the signer had the private key.
An invalid signature proves tampering or wrong key.
There is no third interpretation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Axiom 10: Verification Requires No Authority

```
verify(segment, manifest, publicKey) → { ok, failures }
```

The verifier needs only:
- The data (JSONL)
- The manifest
- The public key

No network call.
No timestamp server.
No permission from anyone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary Table

| # | Axiom | Guarantee |
|---|-------|-----------|
| 1 | Three outcomes | Complete decision space |
| 2 | Reason chain | Traceable decisions |
| 3 | Deterministic | Replayable |
| 4 | Failed rule | Auditable denials |
| 5 | SKIP ≠ DENY | Semantic clarity |
| 6 | Disjoint domains | No ambiguity |
| 7 | Append-only | Immutable history |
| 8 | Hash = identity | Tamper detection |
| 9 | Signature = proof | Non-repudiation |
| 10 | No authority | Independent verification |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Final Statement

These axioms are not negotiable.
They are not "best practices" or "guidelines".
They are the mathematical foundation of SYNAPSE.

Any system claiming SYNAPSE compliance must satisfy all 10 axioms.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Decision Axioms v1.0*
*Status: FROZEN*
