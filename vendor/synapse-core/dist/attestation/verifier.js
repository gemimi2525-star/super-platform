"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — External Verifier (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Standalone verification pipeline for audit segments.
 * Does NOT require kernel — can verify independently.
 *
 * @module coreos/attestation/verifier
 * @version 1.0.0 (Phase T)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySegment = verifySegment;
exports.verifySegmentContinuity = verifySegmentContinuity;
const integrity_1 = require("../audit/integrity");
const digest_1 = require("./digest");
const signer_1 = require("./signer");
// ═══════════════════════════════════════════════════════════════════════════
// EXTERNAL VERIFIER
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Verify a segment independently (no kernel required)
 *
 * Checks:
 * 1. JSONL parses correctly
 * 2. Hash chain is valid
 * 3. Segment digest matches manifest
 * 4. Signature verifies against public key
 * 5. Manifest fields are consistent with data
 */
function verifySegment(params) {
    const { jsonl, manifest, publicKey } = params;
    const failures = [];
    // Default stats (will be filled in)
    let stats = {
        seqStart: 0,
        seqEnd: 0,
        recordCount: 0,
        chainId: '',
    };
    // Step 1: Parse JSONL
    let records;
    try {
        const lines = jsonl.split(digest_1.LINE_TERMINATOR).filter(line => line.trim());
        records = lines.map(line => JSON.parse(line));
        if (records.length === 0) {
            failures.push('JSONL contains no records');
            return { ok: false, failures, stats };
        }
        stats = {
            seqStart: records[0].seq,
            seqEnd: records[records.length - 1].seq,
            recordCount: records.length,
            chainId: records[0].chainId,
        };
    }
    catch (error) {
        failures.push(`JSONL parse error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return { ok: false, failures, stats };
    }
    // Step 2: Validate hash chain
    const chainValidation = (0, integrity_1.validateChain)(records);
    if (!chainValidation.valid) {
        failures.push(`Hash chain invalid: ${chainValidation.error}`);
    }
    // Step 3: Verify segment digest
    const computedDigest = (0, digest_1.computeSegmentDigest)(jsonl);
    if (computedDigest !== manifest.segmentDigest) {
        failures.push(`Segment digest mismatch: expected ${manifest.segmentDigest}, got ${computedDigest}`);
    }
    // Step 4: Verify signature
    const signatureValid = (0, signer_1.verifyDigestSignature)(manifest.segmentDigest, manifest.signature, publicKey);
    if (!signatureValid) {
        failures.push('Signature verification failed');
    }
    // Step 5: Verify manifest consistency
    if (manifest.seqStart !== stats.seqStart) {
        failures.push(`seqStart mismatch: manifest says ${manifest.seqStart}, data has ${stats.seqStart}`);
    }
    if (manifest.seqEnd !== stats.seqEnd) {
        failures.push(`seqEnd mismatch: manifest says ${manifest.seqEnd}, data has ${stats.seqEnd}`);
    }
    if (manifest.recordCount !== stats.recordCount) {
        failures.push(`recordCount mismatch: manifest says ${manifest.recordCount}, data has ${stats.recordCount}`);
    }
    if (manifest.chainId !== stats.chainId) {
        failures.push(`chainId mismatch: manifest says ${manifest.chainId}, data has ${stats.chainId}`);
    }
    if (manifest.headHash !== records[records.length - 1].recordHash) {
        failures.push(`headHash mismatch: manifest says ${manifest.headHash}, last record has ${records[records.length - 1].recordHash}`);
    }
    return {
        ok: failures.length === 0,
        failures,
        stats,
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// MULTI-SEGMENT CONTINUITY
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Verify continuity across multiple segments
 * Checks that seqEnd of segment N = seqStart of segment N+1 - 1
 */
function verifySegmentContinuity(manifests) {
    if (manifests.length <= 1) {
        return { ok: true, failures: [] };
    }
    const failures = [];
    const sorted = [...manifests].sort((a, b) => a.seqStart - b.seqStart);
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (prev.seqEnd + 1 !== curr.seqStart) {
            failures.push(`Gap between segments: ${prev.segmentName} ends at seq ${prev.seqEnd}, ` +
                `${curr.segmentName} starts at seq ${curr.seqStart}`);
        }
        if (prev.chainId !== curr.chainId) {
            failures.push(`Chain ID mismatch: ${prev.segmentName} has ${prev.chainId}, ` +
                `${curr.segmentName} has ${curr.chainId}`);
        }
    }
    return {
        ok: failures.length === 0,
        failures,
    };
}
//# sourceMappingURL=verifier.js.map