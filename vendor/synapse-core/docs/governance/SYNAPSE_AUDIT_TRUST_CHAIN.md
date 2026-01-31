# SYNAPSE Audit Trust Chain — v1.0

> *"From Decision to Verification: The Complete Chain"*

**Document Type:** Governance Specification
**Version:** 1.0 (FINAL)
**Status:** FROZEN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document traces the complete trust chain from a system decision to external verification. Every link in this chain is mathematically verifiable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## The Complete Chain

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   1. INTENT                                                 │
│   ↓                                                         │
│   2. POLICY EVALUATION                                      │
│   ↓                                                         │
│   3. DECISION (ALLOW | DENY | SKIP)                         │
│   ↓                                                         │
│   4. DECISION EXPLANATION                                   │
│   ↓                                                         │
│   5. AUDIT RECORD                                           │
│   ↓                                                         │
│   6. HASH CHAIN                                             │
│   ↓                                                         │
│   7. SEGMENT                                                │
│   ↓                                                         │
│   8. ATTESTATION (SIGNATURE)                                │
│   ↓                                                         │
│   9. MANIFEST                                               │
│   ↓                                                         │
│   10. EXTERNAL VERIFICATION                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 1→2: Intent to Policy

**Input:** Intent (action request)
**Process:** Policy Engine evaluates against registered policies
**Output:** Policy Decision

**Trust Guarantee:**
- Policy evaluation is deterministic
- Same intent + same policy + same state = same decision
- No external factors influence the outcome

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 2→3: Policy to Decision

**Input:** Policy evaluation result
**Process:** Classification into ALLOW/DENY/SKIP
**Output:** DecisionType

**Trust Guarantee:**
- Exactly one outcome
- DENY requires failedRule
- SKIP indicates non-policy skip

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 3→4: Decision to Explanation

**Input:** Decision + context
**Process:** Build reason chain
**Output:** DecisionExplanation

```
DecisionExplanation {
    decision: ALLOW | DENY | SKIP
    intentType: string
    correlationId: string
    policyDomain: SpacePolicy | CapabilityPolicy | WindowManager | System
    failedRule?: string
    reasonChain: [high-level → low-level]
    timestamp: number
}
```

**Trust Guarantee:**
- Every decision has an explanation
- Reason chain traces from intent to rule
- Explanation is pure (no side effects)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 4→5: Explanation to Audit Record

**Input:** DecisionExplanation
**Process:** Wrap in audit envelope with hash chain
**Output:** AuditRecord

```
AuditRecord {
    chainId: string
    seq: number                    ← Sequential (1, 2, 3...)
    recordedAt: number
    eventType: "DECISION_EXPLAINED"
    payload: DecisionExplanation
    prevHash: string               ← Previous record's hash
    recordHash: string             ← This record's hash
    version: "1.0"
}
```

**Trust Guarantee:**
- seq is continuous
- prevHash links to previous record
- recordHash is computed from canonical JSON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 5→6: Record to Hash Chain

**Input:** Current record + previous hash
**Process:** Compute recordHash = SHA-256(canonical(record))
**Output:** Chained record

```
R1: prevHash = "GENESIS"
    recordHash = SHA-256(R1)

R2: prevHash = R1.recordHash
    recordHash = SHA-256(R2)

R3: prevHash = R2.recordHash
    recordHash = SHA-256(R3)
```

**Trust Guarantee:**
- Any modification breaks the chain
- Chain can be validated independently
- No record can be inserted/removed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 6→7: Chain to Segment

**Input:** Multiple AuditRecords
**Process:** Export as JSONL (one record per line)
**Output:** Segment file

```
segment.jsonl:
{"chainId":"x","seq":1,...,"recordHash":"abc"}
{"chainId":"x","seq":2,...,"recordHash":"def"}
{"chainId":"x","seq":3,...,"recordHash":"ghi"}
```

**Trust Guarantee:**
- LF line endings only
- UTF-8 encoding
- Canonical JSON per line
- Order preserved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 7→8: Segment to Attestation

**Input:** Segment file
**Process:** 
  1. Compute segmentDigest = SHA-256(file bytes)
  2. Sign digest with Ed25519 private key
**Output:** Signature

```
segmentDigest = SHA-256(segment.jsonl)
signature = Ed25519.sign(privateKey, segmentDigest)
```

**Trust Guarantee:**
- Digest binds to exact file content
- Signature binds to specific key holder
- Base64 encoding for portability

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 8→9: Attestation to Manifest

**Input:** Segment metadata + signature
**Process:** Build manifest document
**Output:** AttestationManifest

```
AttestationManifest {
    version: "1.0"
    chainId: string
    segmentName: string
    seqStart: number
    seqEnd: number
    recordCount: number
    headHash: string
    segmentDigest: string     ← SHA-256 hex
    signature: string         ← Ed25519 base64
    algorithm: "ed25519"
    publicKeyId: string       ← Key fingerprint
    createdAt: number
}
```

**Trust Guarantee:**
- All fields are verifiable
- Manifest is self-contained
- No external lookup required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Link 9→10: Manifest to Verification

**Input:** JSONL + Manifest + Public Key
**Process:** Independent verification
**Output:** VerificationResult

```
Verification Steps:
1. Parse JSONL → records
2. Validate hash chain (prevHash linkage)
3. Compute segmentDigest → compare to manifest
4. Verify signature with public key
5. Check manifest consistency (counts, hashes)
```

**Trust Guarantee:**
- No network required
- No authority required
- Anyone can verify
- Result is deterministic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Trust Chain Visualization

```
Intent ─┬─→ Policy ─→ Decision ─→ Explanation
        │
        ↓
    AuditRecord ─→ Hash Chain ─→ Segment
        │
        ↓
    SHA-256 Digest ─→ Ed25519 Signature ─→ Manifest
        │
        ↓
    VERIFICATION (No Authority Needed)
        │
        ↓
    ✅ VALID or ❌ TAMPERED
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## What Breaks the Chain

| Attack | Detection |
|--------|-----------|
| Modify record content | recordHash mismatch |
| Insert record | seq gap or prevHash mismatch |
| Delete record | seq gap or prevHash mismatch |
| Reorder records | seq or prevHash mismatch |
| Modify segment file | segmentDigest mismatch |
| Forge signature | Signature verification fails |
| Wrong key | Signature verification fails |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Final Statement

Every link in this chain is:
- **Mathematically defined** — no ambiguity
- **Independently verifiable** — no trust required
- **Tamper-evident** — any break is detectable

The chain is only as strong as its weakest link.
In SYNAPSE, every link is cryptographic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Audit Trust Chain v1.0*
*Status: FROZEN*
