# Permission Model v1

## Overview
This document defines the permission model for Phase 17.2, enforcing OS-grade security for sandboxed applications. It establishes a tiered capability system, a launch-time prompt, and server-side enforcement with audit trails.

## Capability Tiers

Capabilities are categorized into four tiers based on risk:

| Tier | Description | User Action | Examples |
| :--- | :--- | :--- | :--- |
| **SAFE** | Minimal risk, essential for app function. | Auto-granted (no prompt). | `ui.window` |
| **STANDARD** | Moderate risk, access to specific resources. | Prompt (checked by default). | `fs.temp`, `ui.notify` |
| **DANGEROUS** | High risk, access to persistent data/network. | Prompt (unchecked by default + warning). | `net.fetch`, `fs.read` |
| **CRITICAL** | System-level risk. | Admin only (disabled in prompt). | `audit.read`, `process.spawn`, `fs.write` |

## Decision Flow

1.  **Launch Request**: App requested capabilities in `manifest.json`.
2.  **Tier Resolution**: System maps capabilities to tiers.
3.  **Grant Check**:
    *   If valid grant exists (ALLOW/DENY) -> Use decision.
    *   If no grant exists -> Show **Launch-time Prompt**.
4.  **Prompt**: User reviews and confirms.
    *   Safe: Locked (Allow).
    *   Standard: Toggleable.
    *   Dangerous: Toggleable (Default Off).
    *   Critical: Locked (Deny) unless Admin.
5.  **Persistence**: Decision saved to server (`POST /api/platform/permissions`) with `traceId`.
6.  **Enforcement**: Server enforcement hook checks grants before processing intents.

## Restart Semantics

*   **Granting** a capability takes effect immediately (or on next usage check).
*   **Revoking** a capability requires an **Application Restart** to ensure the runtime state is consistent and no lingering handles exist.
    *   The UI must block usage or warn the user.
    *   The API returns `restartRequired: true`.

## Data Model

```typescript
type CapabilityTier = 'SAFE' | 'STANDARD' | 'DANGEROUS' | 'CRITICAL';

interface PermissionGrant {
  appId: string;
  userId: string;
  capability: string;
  granted: boolean;
  timestamp: number;
  traceId: string;
}
```

## Security & Audit

*   **Source of Truth**: Server-side database (or mocked store for MVP) is the only source of truth. Client-side checks are for UI convenience only.
*   **Audit**: Every grant/revoke action must generate an audit log entry with `opId` and `traceId`.
*   **Frozen Core**: This model sits *on top* of the Phase 16 Runtime, acting as a gatekeeper without modifying the core runtime logic.
