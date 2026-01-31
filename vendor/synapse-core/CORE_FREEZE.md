# SYNAPSE CORE FREEZE DECLARATION

**Version:** 1.0
**Date:** 2026-01-30
**Status:** FROZEN — DO NOT MODIFY

---

## Declaration

By this document, SYNAPSE Core v1.0 is declared **FROZEN**.

---

## What This Means

### ❌ DO NOT

- Add new features
- Modify existing logic
- Change schemas
- Change algorithms
- Add product-specific code
- Add UI components
- Add runtime integrations

### ✅ ALLOWED

- Bug fixes (if spec violation found)
- Documentation clarifications
- Test additions (non-breaking)

---

## Frozen Components

| Component | Status |
|-----------|--------|
| DecisionExplanation schema | FROZEN |
| AuditRecord schema | FROZEN |
| AttestationManifest schema | FROZEN |
| SHA-256 algorithm | FROZEN |
| Ed25519 algorithm | FROZEN |
| Canonical JSON rules | FROZEN |
| Verification rules | FROZEN |

---

## Change Policy

Any change to SYNAPSE Core requires:
1. New major version (v2.0, v3.0)
2. Separate branch/repository
3. Full re-verification

---

## Enforcement

This freeze is self-enforcing:
- Tests verify behavior
- Hash chains verify content
- Signatures verify integrity

---

*SYNAPSE Core v1.0 — FROZEN*
