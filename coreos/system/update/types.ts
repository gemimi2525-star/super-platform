/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYSTEM UPDATE TYPES (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the contract for Over-The-Air (OTA) updates.
 * Supporting Manifests, Channels, and Component definition.
 * 
 * @module coreos/system/update/types
 */

export type UpdateChannel = 'stable' | 'beta' | 'dev';

export type UpdateStatus =
    | 'chk' // Checking
    | 'avl' // Available
    | 'dwn' // Downloading
    | 'rdy' // Ready to Install
    | 'ins' // Installing
    | 'err' // Error
    | 'upt'; // Up to Date

export interface UpdateManifest {
    releaseId: string;
    version: string;
    channel: UpdateChannel;
    releaseDate: number;
    notes: string;
    critical: boolean;
    components: UpdateComponent[];
    checksum: string; // SHA-256 of the entire manifest content (excluding checksum field)
    signature?: string; // Ed25519 signature
}

export interface UpdateComponent {
    id: string; // e.g., 'core.os', 'app.calculator'
    version: string;
    url: string; // Download URL for the artifact
    checksum: string; // SHA-256 of the artifact
    required: boolean;
}

export interface UpdateState {
    status: UpdateStatus;
    currentVersion: string;
    availableUpdate?: UpdateManifest;
    progress?: number;
    error?: string;
    channel: UpdateChannel;
}
