# 🚧 Legacy /v2 Quarantine Notice — SYNAPSE v1.0

**Status:** GOVERNANCE GUARD — NOT SYNAPSE CORE
**Authority:** SYNAPSE Canonical Pack v1.0 + Appendix Pack v1.0 (Section B)
**Effective:** 2026-01-30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary

The `/v2/*` routes in this repository are **LEGACY** and exist
**OUTSIDE** the SYNAPSE Core OS architecture.

## Classification

| Path Pattern | Status | Notes |
|--------------|--------|-------|
| `/v2/*` | 🚧 QUARANTINED (Legacy) | Not part of SYNAPSE core |
| `/core-os-demo/*` | ✅ SYNAPSE | Official SYNAPSE entry point |
| `/desktop/*` | ✅ SYNAPSE (future) | Planned canonical entry |

## Rules

### ❌ DO NOT:
- Use `/v2/*` patterns as reference for SYNAPSE development
- Copy UI patterns from `/v2/*` to SYNAPSE components
- Assume `/v2/*` behavior represents SYNAPSE design

### ✅ DO:
- Treat `/v2/*` as isolated legacy surface
- Reference SYNAPSE Whitepaper for architectural guidance
- Use `coreos/*` for kernel and UI development

## Governance Trigger

Any work that touches `/v2/*` routes **MUST** go through:
- Appendix B — Governance Trigger Matrix
- Check: "Does this affect SYNAPSE core?" → If YES → Architecture Review

## Future Action (Deferred)

The following actions are **DEFERRED** pending architectural decision:
1. Deprecation notice on /v2 routes
2. Migration plan to SYNAPSE entries
3. Eventual removal of legacy routes

**No runtime changes are made by this document.**
This is a governance/documentation guard only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Legacy V2 Quarantine Notice v1.0*
*Governance Document*
