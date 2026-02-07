export type CapabilityTier = 'SAFE' | 'STANDARD' | 'DANGEROUS' | 'CRITICAL';

export interface PermissionGrant {
    appId: string;
    userId: string; // "current_user" for single-user MVP
    capability: string;
    granted: boolean;
    timestamp: number;
    traceId: string;
    opId: string;
}

export interface PermissionRequest {
    appId: string;
    capability: string;
    tier: CapabilityTier;
}
