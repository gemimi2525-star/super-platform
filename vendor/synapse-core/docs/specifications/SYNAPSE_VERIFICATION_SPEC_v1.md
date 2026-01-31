# SYNAPSE Verification Specification — v1.0

> *"How to Verify Without Our Code"*

**Document Type:** Technical Specification
**Version:** 1.0 (FINAL)
**Status:** FROZEN
**Language-Neutral:** Yes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This specification defines how to verify a SYNAPSE audit segment **without using any SYNAPSE code**. Any implementation that follows this specification must produce identical verification results.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Prerequisites

### Required Algorithms
| Purpose | Algorithm | Standard |
|---------|-----------|----------|
| Hash | SHA-256 | FIPS 180-4 |
| Signature | Ed25519 | RFC 8032 |
| Encoding | UTF-8 | RFC 3629 |

### Required Inputs
1. **JSONL file** — The audit segment to verify
2. **Manifest file** — The AttestationManifest (JSON)
3. **Public key** — Ed25519 public key (32 bytes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Verification Algorithm

### Overview

```
VERIFY(jsonl, manifest, publicKey) → { ok, failures, stats }
```

### Step-by-Step

```
Step 1: PARSE_JSONL
Step 2: VALIDATE_HASH_CHAIN
Step 3: COMPUTE_DIGEST
Step 4: VERIFY_SIGNATURE
Step 5: CHECK_MANIFEST_CONSISTENCY
Step 6: RETURN_RESULT
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 1: Parse JSONL

### Input
- JSONL file content (string)

### Process
```
lines = split(content, LF)
records = []
for each line in lines:
    if line is empty or whitespace:
        skip
    record = JSON.parse(line)
    records.append(record)
```

### Output
- Array of AuditRecord objects

### Failure Modes
- `JSONL_PARSE_ERROR`: Invalid JSON on any line

### Notes
- Line terminator is LF (0x0A) only
- CRLF (0x0D 0x0A) must be normalized to LF
- Empty lines are ignored
- Trailing newline is optional

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 2: Validate Hash Chain

### Input
- Array of AuditRecord objects

### Process
```
for i = 0 to records.length - 1:
    record = records[i]
    
    // Check sequence
    expectedSeq = i + 1
    if record.seq != expectedSeq:
        FAIL("Sequence gap: expected {expectedSeq}, got {record.seq}")
    
    // Check prevHash
    if i == 0:
        expectedPrevHash = "GENESIS"
    else:
        expectedPrevHash = records[i-1].recordHash
    
    if record.prevHash != expectedPrevHash:
        FAIL("PrevHash mismatch at record {i+1}")
    
    // Verify recordHash
    computedHash = COMPUTE_RECORD_HASH(record)
    if record.recordHash != computedHash:
        FAIL("RecordHash mismatch at record {i+1}")
```

### COMPUTE_RECORD_HASH Function
```
function COMPUTE_RECORD_HASH(record):
    // Create a copy without recordHash
    recordWithoutHash = copy(record)
    delete recordWithoutHash.recordHash
    
    // Serialize to canonical JSON
    canonical = CANONICAL_JSON(recordWithoutHash)
    
    // Compute SHA-256
    return SHA256(canonical).toHex()
```

### CANONICAL_JSON Function
```
function CANONICAL_JSON(value):
    if value is null:
        return "null"
    if value is boolean:
        return value ? "true" : "false"
    if value is number:
        return string(value)
    if value is string:
        return JSON_ESCAPE(value)
    if value is array:
        return "[" + join(map(value, CANONICAL_JSON), ",") + "]"
    if value is object:
        keys = sorted(keys(value))
        pairs = []
        for key in keys:
            if value[key] is not undefined:
                pairs.append(JSON_ESCAPE(key) + ":" + CANONICAL_JSON(value[key]))
        return "{" + join(pairs, ",") + "}"
```

### Canonical JSON Rules
1. **Sort keys alphabetically** (ASCII order)
2. **No whitespace** between tokens
3. **Omit undefined values** (do not include key)
4. **Preserve null values** (include as "null")
5. **Preserve number precision** (as JSON standard)
6. **Escape strings** according to JSON spec

### Output
- Success: continue to next step
- Failure: add to failures list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 3: Compute Segment Digest

### Input
- JSONL file content (raw bytes)

### Process
```
digest = SHA256(bytes).toHex()
```

### Compare
```
if digest != manifest.segmentDigest:
    FAIL("Segment digest mismatch")
```

### Notes
- Hash the raw file bytes, not the parsed content
- Ensure consistent encoding (UTF-8)
- Do not modify line endings before hashing

### Output
- Success: continue to next step
- Failure: add "Segment digest mismatch" to failures

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 4: Verify Signature

### Input
- Segment digest (string, hex-encoded)
- Signature (string, base64-encoded)
- Public key (32 bytes)

### Process
```
signatureBytes = base64_decode(manifest.signature)
digestBytes = utf8_encode(manifest.segmentDigest)

isValid = Ed25519.verify(publicKey, digestBytes, signatureBytes)

if not isValid:
    FAIL("Signature verification failed")
```

### Ed25519 Verification
- Use RFC 8032 compliant Ed25519 implementation
- Public key must be 32 bytes
- Signature must be 64 bytes

### Output
- Success: continue to next step
- Failure: add "Signature verification failed" to failures

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 5: Check Manifest Consistency

### Input
- Parsed records
- Manifest

### Process
```
firstRecord = records[0]
lastRecord = records[records.length - 1]

if manifest.seqStart != firstRecord.seq:
    FAIL("seqStart mismatch")

if manifest.seqEnd != lastRecord.seq:
    FAIL("seqEnd mismatch")

if manifest.recordCount != records.length:
    FAIL("recordCount mismatch")

if manifest.chainId != firstRecord.chainId:
    FAIL("chainId mismatch")

if manifest.headHash != lastRecord.recordHash:
    FAIL("headHash mismatch")
```

### Output
- Success: continue to final step
- Failure: add specific mismatch to failures

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step 6: Return Result

### Output Structure
```
{
    "ok": boolean,
    "failures": [string],
    "stats": {
        "seqStart": number,
        "seqEnd": number,
        "recordCount": number,
        "chainId": string
    }
}
```

### Logic
```
result = {
    ok: failures.length == 0,
    failures: failures,
    stats: {
        seqStart: records[0].seq,
        seqEnd: records[records.length - 1].seq,
        recordCount: records.length,
        chainId: records[0].chainId
    }
}

return result
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Failure Modes Summary

| Failure | Description |
|---------|-------------|
| JSONL_PARSE_ERROR | Invalid JSON syntax |
| SEQUENCE_GAP | seq is not continuous (1, 2, 3...) |
| PREVHASH_MISMATCH | prevHash doesn't match previous recordHash |
| RECORDHASH_MISMATCH | recordHash doesn't match computed hash |
| DIGEST_MISMATCH | File digest doesn't match manifest |
| SIGNATURE_INVALID | Ed25519 signature verification failed |
| SEQSTART_MISMATCH | manifest.seqStart != first record seq |
| SEQEND_MISMATCH | manifest.seqEnd != last record seq |
| RECORDCOUNT_MISMATCH | manifest.recordCount != actual count |
| CHAINID_MISMATCH | manifest.chainId != record chainId |
| HEADHASH_MISMATCH | manifest.headHash != last recordHash |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Determinism Guarantee

Any correct implementation of this specification MUST produce:
- **Identical result** for the same inputs
- **No external dependencies** (no network, no time, no random)
- **No side effects** (pure function)

Two implementations are correct if and only if:
```
∀ (jsonl, manifest, publicKey):
    impl1.verify(jsonl, manifest, publicKey).ok 
    == 
    impl2.verify(jsonl, manifest, publicKey).ok
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Implementation Notes

### Language-Specific Considerations

**UTF-8 Handling:**
- Ensure strings are UTF-8 encoded before hashing
- Do not use platform-specific encodings

**Number Precision:**
- Use IEEE 754 double precision
- Preserve precision during JSON parsing

**JSON Library:**
- Verify your JSON library preserves number precision
- Verify your JSON library handles Unicode correctly

**Ed25519 Library:**
- Use RFC 8032 compliant implementation
- libsodium, tweetnacl, or equivalent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conformance

An implementation is SYNAPSE-conformant if:

1. It follows this specification exactly
2. It passes all test vectors in `test-vectors.json`
3. It produces identical results to the reference implementation

Non-conformant implementations may produce incorrect results.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Verification Specification v1.0*
*Status: FROZEN*
