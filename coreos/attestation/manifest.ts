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
import { ATTESTATION_VERSION, SIGNATURE_ALGORITHM, TOOL_VERSION } from './types';
import { signDigest } from './signer';
import { getDefaultKeyProvider } from './keys';

// ═══════════════════════════════════════════════════════════════════════════
// MANIFEST BUILDER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a signed attestation manifest from segment metadata
 */
export function buildManifest(
    metadata: SegmentMetadata,
    keyProvider?: KeyProvider,
    createdAt?: number
): AttestationManifest {
    const provider = keyProvider ?? getDefaultKeyProvider();

    // Sign the segment digest
    const signature = signDigest(metadata.segmentDigest, provider);

    return {
        version: ATTESTATION_VERSION,
        toolVersion: TOOL_VERSION,
        chainId: metadata.chainId,
        segmentName: metadata.segmentName,
        seqStart: metadata.seqStart,
        seqEnd: metadata.seqEnd,
        recordCount: metadata.recordCount,
        headHash: metadata.headHash,
        segmentDigest: metadata.segmentDigest,
        signature,
        algorithm: SIGNATURE_ALGORITHM,
        publicKeyId: provider.getPublicKeyId(),
        createdAt: createdAt ?? Date.now(),
    };
}

/**
 * Serialize manifest to JSON (canonical format)
 */
export function serializeManifest(manifest: AttestationManifest): string {
    // Sort keys for canonical output
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(manifest).sort();

    for (const key of keys) {
        sorted[key] = (manifest as unknown as Record<string, unknown>)[key];
    }

    return JSON.stringify(sorted, null, 2);
}

/**
 * Parse manifest from JSON
 */
export function parseManifest(json: string): AttestationManifest {
    return JSON.parse(json) as AttestationManifest;
}
