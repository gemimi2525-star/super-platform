# SYNAPSE Threat Model — v1.0

> *"What We Defend Against, What We Do Not"*

**Document Type:** Governance Specification
**Version:** 1.0 (FINAL)
**Status:** FROZEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document defines the threat model for SYNAPSE. It explicitly states:
- What attacks SYNAPSE defends against
- What attacks SYNAPSE does NOT defend against
- The trust boundaries of the system

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Scope

SYNAPSE is an **audit and governance framework**.
It is NOT:
- A general security system
- A firewall or intrusion detection
- An authentication system
- An authorization enforcement layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Threats SYNAPSE Defends Against

### T1: Audit Record Tampering

**Attack:** Modify audit records after creation
**Defense:** SHA-256 hash chain
**Guarantee:** Any modification is detectable

```
Tampered record → recordHash mismatch → DETECTED
```

### T2: Audit Record Deletion

**Attack:** Remove records from the chain
**Defense:** Sequence numbers + prevHash linkage
**Guarantee:** Missing records create gaps

```
Deleted record → seq gap or prevHash mismatch → DETECTED
```

### T3: Audit Record Insertion

**Attack:** Insert fabricated records
**Defense:** Hash chain + signature
**Guarantee:** Inserted records break the chain

```
Inserted record → chain integrity failure → DETECTED
```

### T4: Segment File Tampering

**Attack:** Modify the JSONL file directly
**Defense:** SHA-256 segment digest
**Guarantee:** Any byte change is detectable

```
Modified file → digest mismatch → DETECTED
```

### T5: Signature Forgery

**Attack:** Create fake signatures
**Defense:** Ed25519 cryptographic signature
**Guarantee:** Computationally infeasible without private key

```
Forged signature → verification failure → DETECTED
```

### T6: Manifest Tampering

**Attack:** Modify manifest fields
**Defense:** Signature covers the digest
**Guarantee:** Manifest changes don't match signature

```
Modified manifest → verification inconsistency → DETECTED
```

### T7: Decision Ambiguity

**Attack:** Dispute what decision was made
**Defense:** DecisionExplanation with reason chain
**Guarantee:** Every decision is traceable

```
Decision dispute → replay with same inputs → RESOLVED
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Threats SYNAPSE Does NOT Defend Against

### N1: Private Key Compromise

**Attack:** Attacker obtains the signing private key
**Not Defended:** Attacker can create valid signatures
**Mitigation:** Key management is outside SYNAPSE scope

```
Compromised key → valid signatures possible
SYNAPSE cannot detect this
```

### N2: Policy Misconfiguration

**Attack:** Policies are set incorrectly
**Not Defended:** Wrong policies produce wrong decisions
**Mitigation:** Policy validation is outside SYNAPSE scope

```
Bad policy → bad decisions (but correctly audited)
SYNAPSE audits what happened, not what should happen
```

### N3: System Compromise Before Audit

**Attack:** Attacker controls the system before audit starts
**Not Defended:** Attacker can prevent audit creation
**Mitigation:** System integrity is outside SYNAPSE scope

```
Compromised system → no records created
SYNAPSE cannot audit what isn't recorded
```

### N4: Physical Access Attack

**Attack:** Attacker has physical access to storage
**Not Defended:** Attacker can delete all files
**Mitigation:** Physical security is outside SYNAPSE scope

```
Physical access → files destroyed
SYNAPSE cannot recover deleted files
```

### N5: Side-Channel Attacks

**Attack:** Timing attacks, power analysis, etc.
**Not Defended:** SYNAPSE is not a secure enclave
**Mitigation:** Hardware security is outside SYNAPSE scope

```
Side-channel → key extraction possible
SYNAPSE is not HSM
```

### N6: Denial of Service

**Attack:** Overwhelm the audit system
**Not Defended:** System may stop recording
**Mitigation:** Resource management is outside SYNAPSE scope

```
DoS → audit collection stops
SYNAPSE is not a resilience system
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                    TRUSTED                              │
├─────────────────────────────────────────────────────────┤
│  - SHA-256 hash function                                │
│  - Ed25519 signature algorithm                          │
│  - Canonical JSON serialization                         │
│  - The specification document                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    NOT TRUSTED                          │
├─────────────────────────────────────────────────────────┤
│  - The implementation (verify independently)            │
│  - The developers (verify the math)                     │
│  - The operators (verify the records)                   │
│  - The storage (verify the chain)                       │
│  - The network (no network dependencies)                │
└─────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Attack Summary Matrix

| Attack | Defended | Detection |
|--------|----------|-----------|
| Record tampering | ✅ Yes | Hash mismatch |
| Record deletion | ✅ Yes | Seq/chain gap |
| Record insertion | ✅ Yes | Chain break |
| File tampering | ✅ Yes | Digest mismatch |
| Signature forgery | ✅ Yes | Verify fail |
| Manifest tampering | ✅ Yes | Inconsistency |
| Key compromise | ❌ No | — |
| Policy misconfiguration | ❌ No | — |
| System compromise | ❌ No | — |
| Physical access | ❌ No | — |
| Side-channel | ❌ No | — |
| Denial of service | ❌ No | — |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Assumptions

SYNAPSE security relies on these assumptions:

1. **Cryptographic assumptions**
   - SHA-256 is collision-resistant
   - Ed25519 is secure

2. **Operational assumptions**
   - Private key is kept secret
   - Audit collection runs correctly
   - Storage is not wholesale destroyed

3. **Specification assumptions**
   - This document is correct
   - Implementations follow the spec

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Final Statement

SYNAPSE provides:
- **After-the-fact verification** of audit integrity
- **Tamper detection** for audit records
- **Non-repudiation** through signatures

SYNAPSE does NOT provide:
- **Prevention** of attacks
- **Real-time** detection
- **Recovery** from compromise

Know the boundaries.
Trust the math, not the authority.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Threat Model v1.0*
*Status: FROZEN*
