/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Manifest Builder (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Builds signed attestation manifests for audit segments.
 *
 * @module coreos/attestation/manifest
 * @version 1.0.0 (Phase T)
 */
import type { AttestationManifest, KeyProvider, SegmentMetadata } from './types';
/**
 * Build a signed attestation manifest from segment metadata
 */
export declare function buildManifest(metadata: SegmentMetadata, keyProvider?: KeyProvider, createdAt?: number): AttestationManifest;
/**
 * Serialize manifest to JSON (canonical format)
 */
export declare function serializeManifest(manifest: AttestationManifest): string;
/**
 * Parse manifest from JSON
 */
export declare function parseManifest(json: string): AttestationManifest;
//# sourceMappingURL=manifest.d.ts.map