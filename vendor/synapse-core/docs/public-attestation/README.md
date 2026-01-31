# SYNAPSE Public Attestation Package — v1.0

> *"Verify Without Trust"*

**Package Type:** Public Evidence Bundle
**Version:** 1.0
**Status:** EXAMPLE (Sanitized Data)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This package contains everything needed to verify a SYNAPSE audit segment **without running the SYNAPSE system**.

Anyone can:
1. Download this package
2. Use any Ed25519/SHA-256 implementation
3. Verify the audit integrity
4. Get deterministic results

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Package Contents

```
public-attestation/
├── README.md                    ← This file
├── example-segment.jsonl        ← Example audit segment
├── example-manifest.json        ← Attestation manifest
├── public-key.txt               ← Public key (hex)
├── verification-transcript.txt  ← Expected verification output
└── test-vectors.json            ← Test vectors for implementations
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## How to Verify

### Step 1: Parse the JSONL

Read `example-segment.jsonl` line by line.
Each line is a valid JSON object representing an AuditRecord.

### Step 2: Validate Hash Chain

For each record:
1. Verify `seq` is sequential (1, 2, 3, ...)
2. Verify `prevHash` matches previous record's `recordHash`
3. Verify `recordHash` = SHA-256(canonical JSON of record without recordHash)

### Step 3: Compute Segment Digest

```
digest = SHA-256(file_bytes)
```

Compare with `segmentDigest` in the manifest.

### Step 4: Verify Signature

```
Ed25519.verify(publicKey, digest, signature)
```

Use the public key from `public-key.txt`.
Use the signature from `example-manifest.json`.

### Step 5: Check Manifest Consistency

Verify:
- `seqStart` matches first record's `seq`
- `seqEnd` matches last record's `seq`
- `recordCount` matches number of records
- `headHash` matches last record's `recordHash`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Expected Result

If verification passes:
```
{
  "ok": true,
  "failures": [],
  "stats": {
    "seqStart": 1,
    "seqEnd": 3,
    "recordCount": 3,
    "chainId": "example-chain"
  }
}
```

If any check fails, `ok` will be `false` and `failures` will contain the reason.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Important Notes

⚠️ **This package does NOT contain the private key.**
⚠️ **This is example/test data, not production audit.**
⚠️ **The public key is for verification only.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Algorithms Used

| Purpose | Algorithm |
|---------|-----------|
| Hash | SHA-256 |
| Signature | Ed25519 |
| Encoding | UTF-8 |
| JSON | Canonical (sorted keys) |
| Line terminator | LF (\\n) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Public Attestation Package v1.0*
