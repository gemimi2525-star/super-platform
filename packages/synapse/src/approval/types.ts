/**
 * SYNAPSE APPROVAL SYSTEM types
 * 
 * Defines the structure for Human-in-the-loop Governance.
 */

// Information needed to request approval
export interface ApprovalRequest {
    readonly id: string;           // apr-...
    readonly decisionId: string;   // The original decision that triggered ESCALATE
    readonly intentHash: string;   // SHA-256 of intent (integrity binding)
    readonly policyId: string;     // Policy triggering the escalation
    readonly description: string;  // Human readable reason
    readonly requestedBy: string;  // Actor ID
    readonly status: 'pending' | 'approved' | 'rejected' | 'expired';
    readonly createdAt: number;
}

// The signed token granting permission
export interface ApprovalToken {
    readonly tokenId: string;      // tok-...
    readonly requestId: string;    // Links back to request
    readonly decisionId: string;   // Links back to original decision
    readonly approverId: string;   // Who approved it
    readonly issuedAt: number;
    readonly expiresAt: number;    // TTL (e.g. 5 mins)
    readonly signature: string;    // Cryptographic proof (Mocked for v1)
}
