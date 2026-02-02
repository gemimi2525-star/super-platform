# SYNAPSE Trust Center

Public verification interface for SYNAPSE governance decisions.

## Overview

The Trust Center is a **read-only web interface** that enables external verification of SYNAPSE decisions without requiring system access or authentication.

**Principle**: "Trust but Verify"

## Structure

```
apps/trust-center/
├── index.html          # Governance overview
├── verify.html         # Proof verification
├── audit.html          # Decision timeline (demo)
├── css/
│   └── styles.css      # Modern design system
└── js/
    └── verify.js       # Client-side verification
```

## Pages

### 1. Landing Page (`index.html`)
**Purpose**: Explain SYNAPSE governance model

**Content**:
- Governance principles (Zero Trust, Immutable Policy, Human-in-the-loop, Verifiable Audit)
- Decision flow diagram
- Sample ProofBundle
- Security model explanation

### 2. Verification Page (`verify.html`)
**Purpose**: Allow external parties to verify ProofBundles

**Features**:
- Paste ProofBundle JSON
- Client-side signature verification
- Visual feedback (✅ VALID / ❌ INVALID)
- Detailed breakdown of proof contents

**Security**: 
- All verification runs in browser
- No server communication
- No sensitive data required

### 3. Audit Demo (`audit.html`)
**Purpose**: Demonstrate decision audit trail structure

**Content**:
- Timeline view of decision lifecycle
- Sample decision with all stages
- Export ProofBundle example
- Access control explanation

## Usage

### For External Verifiers

1. Obtain a ProofBundle from a SYNAPSE decision
2. Open `verify.html`
3. Paste the JSON
4. Click "Verify Proof"
5. Review verification result

### Opening the Trust Center

```bash
# From project root
open apps/trust-center/index.html
```

Or use a simple HTTP server:
```bash
cd apps/trust-center
python3 -m http.server 8080
# Open http://localhost:8080
```

## Public Data Boundaries

### ✅ Safe to Share (Included in ProofBundle)
- `decisionId`
- `policyId` / `policyVersion`
- `decision` (ALLOW/DENY/ESCALATE)
- `intentHash` (SHA-256)
- `signature`
- `ledgerHash`
- `issuedAt`
- `authorityId`

### ❌ Never Exposed
- Raw intent parameters
- User secrets/credentials
- Internal context
- System state
- Private keys

## Limitations (v1)

1. **Mock Signature Verification**: Uses HMAC-SHA256 instead of Ed25519 (KMS placeholder)
2. **Client-Side Only**: No server API, purely static
3. **No Authentication**: All pages are public (by design)
4. **Demo Data**: Audit timeline shows mock data only

## Future Enhancements

- Server-side API for real audit access
- Ed25519 signature verification with Web Crypto API
- Token-based authentication for private audit trails
- Real-time ledger chain verification
- KMS/HSM integration for production signing

## Security Notes

- Trust Center is **read-only** - it cannot make decisions or modify data
- Verification is cryptographic - results are mathematically provable
- No secrets are required to verify proofs
- All code runs client-side for transparency

## Design

- **Modern, clean aesthetic** optimized for trust
- **Responsive layout** works on mobile and desktop
- **Accessible** with semantic HTML and clear typography
- **Professional** color scheme (blue primary, green/red for results)
