"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildManifest = buildManifest;
exports.serializeManifest = serializeManifest;
exports.parseManifest = parseManifest;
const types_1 = require("./types");
const signer_1 = require("./signer");
const keys_1 = require("./keys");
// ═══════════════════════════════════════════════════════════════════════════
// MANIFEST BUILDER
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Build a signed attestation manifest from segment metadata
 */
function buildManifest(metadata, keyProvider, createdAt) {
    const provider = keyProvider ?? (0, keys_1.getDefaultKeyProvider)();
    // Sign the segment digest
    const signature = (0, signer_1.signDigest)(metadata.segmentDigest, provider);
    return {
        version: types_1.ATTESTATION_VERSION,
        toolVersion: types_1.TOOL_VERSION,
        chainId: metadata.chainId,
        segmentName: metadata.segmentName,
        seqStart: metadata.seqStart,
        seqEnd: metadata.seqEnd,
        recordCount: metadata.recordCount,
        headHash: metadata.headHash,
        segmentDigest: metadata.segmentDigest,
        signature,
        algorithm: types_1.SIGNATURE_ALGORITHM,
        publicKeyId: provider.getPublicKeyId(),
        createdAt: createdAt ?? Date.now(),
    };
}
/**
 * Serialize manifest to JSON (canonical format)
 */
function serializeManifest(manifest) {
    // Sort keys for canonical output
    const sorted = {};
    const keys = Object.keys(manifest).sort();
    for (const key of keys) {
        sorted[key] = manifest[key];
    }
    return JSON.stringify(sorted, null, 2);
}
/**
 * Parse manifest from JSON
 */
function parseManifest(json) {
    return JSON.parse(json);
}
//# sourceMappingURL=manifest.js.map