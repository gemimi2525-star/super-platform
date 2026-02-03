# APICOREDATA Public Attestation — Verification Guide

> **Version:** 1.0.0  
> **Algorithm:** Ed25519 (LOCKED)  
> **Hash:** SHA-256

---

## Quick Start

### 1. Get Public Key

```bash
curl https://www.apicoredata.com/api/trust/attestation/public-key
```

Response:
```json
{
  "publicKey": "9d23d9c379c4f3a4...",
  "publicKeyId": "f20fae414f071a61",
  "algorithm": "ed25519"
}
```

### 2. Get Attestation Bundle

```bash
curl https://www.apicoredata.com/api/trust/attestation/bundle
```

Response includes:
- `data.manifest.signature` — Ed25519 signature (base64)
- `data.manifest.segmentDigest` — SHA-256 digest (hex)
- `data.publicKey` — Public key for verification

### 3. Verify a Signature

```bash
curl -X POST https://www.apicoredata.com/api/trust/verify \
  -H "Content-Type: application/json" \
  -d '{
    "digest": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "signature": "nQ7sdJoc+LF2GfarL8VLYMU1hhClm4CKaqoZkJnCZdahIQfeyQtoeZ8+7d9cOsYQAKZwAgf7yRx9l/OZybUcAQ=="
  }'
```

---

## Static Files (CDN-Cacheable)

| File | Purpose |
|------|---------|
| `/attestation/bundle.json` | Bundle metadata |
| `/attestation/public-key.json` | Public key reference |

---

## External Verification (Node.js)

```javascript
import { webcrypto } from 'crypto';

async function verifyAttestation() {
  // 1. Fetch public key
  const keyRes = await fetch('https://www.apicoredata.com/api/trust/attestation/public-key');
  const keyData = await keyRes.json();
  const publicKeyHex = keyData.publicKey;
  
  // 2. Fetch bundle
  const bundleRes = await fetch('https://www.apicoredata.com/api/trust/attestation/bundle');
  const bundleData = await bundleRes.json();
  const { signature, segmentDigest } = bundleData.data.manifest;
  
  // 3. Import public key
  const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
  const publicKey = await webcrypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  
  // 4. Verify signature
  const signatureBytes = Buffer.from(signature, 'base64');
  const digestBytes = Buffer.from(segmentDigest, 'utf8');
  
  const isValid = await webcrypto.subtle.verify(
    'Ed25519',
    publicKey,
    signatureBytes,
    digestBytes
  );
  
  console.log(isValid ? '✅ PASS' : '❌ FAIL');
}

verifyAttestation();
```

---

## External Verification (Python)

```python
import requests
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignature
import base64

def verify_attestation():
    # 1. Fetch public key
    key_res = requests.get('https://www.apicoredata.com/api/trust/attestation/public-key')
    public_key_hex = key_res.json()['publicKey']
    
    # 2. Fetch bundle
    bundle_res = requests.get('https://www.apicoredata.com/api/trust/attestation/bundle')
    manifest = bundle_res.json()['data']['manifest']
    signature = manifest['signature']
    segment_digest = manifest['segmentDigest']
    
    # 3. Verify signature
    public_key = VerifyKey(bytes.fromhex(public_key_hex))
    signature_bytes = base64.b64decode(signature)
    
    try:
        public_key.verify(segment_digest.encode(), signature_bytes)
        print('✅ PASS')
    except BadSignature:
        print('❌ FAIL')

verify_attestation()
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trust/attestation/bundle` | GET | Attestation manifest + signature |
| `/api/trust/attestation/public-key` | GET | Public key for verification |
| `/api/trust/verify` | POST | Server-side verification |

---

## Security Notes

- ✅ Private key is NEVER exposed
- ✅ Algorithm locked to Ed25519
- ✅ Deterministic responses
- ✅ CDN cache-friendly
