"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Segment Digest (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical digest computation for JSONL segments.
 * Uses SHA-256 on raw bytes with LF newlines.
 *
 * @module coreos/attestation/digest
 * @version 1.0.0 (Phase T)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIGEST_ALGORITHM = exports.LINE_TERMINATOR = void 0;
exports.computeSegmentDigest = computeSegmentDigest;
exports.computeDigestFromBytes = computeDigestFromBytes;
exports.normalizeLineEndings = normalizeLineEndings;
exports.extractSegmentMetadata = extractSegmentMetadata;
const crypto_1 = require("crypto");
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
/** Line terminator for JSONL (LF only, no CRLF) */
exports.LINE_TERMINATOR = '\n';
/** Hash algorithm for digest */
exports.DIGEST_ALGORITHM = 'sha256';
// ═══════════════════════════════════════════════════════════════════════════
// DIGEST COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Compute SHA-256 digest of JSONL content (canonical bytes)
 *
 * Rules:
 * - Lines terminated by LF (\n) only
 * - No trailing newline after last record
 * - UTF-8 encoding
 */
function computeSegmentDigest(jsonlContent) {
    // Normalize line endings to LF
    const normalized = normalizeLineEndings(jsonlContent);
    // Compute SHA-256
    return (0, crypto_1.createHash)(exports.DIGEST_ALGORITHM)
        .update(normalized, 'utf8')
        .digest('hex');
}
/**
 * Compute digest from raw bytes
 */
function computeDigestFromBytes(bytes) {
    return (0, crypto_1.createHash)(exports.DIGEST_ALGORITHM)
        .update(bytes)
        .digest('hex');
}
/**
 * Normalize line endings to LF only
 */
function normalizeLineEndings(content) {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
// ═══════════════════════════════════════════════════════════════════════════
// SEGMENT METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Extract metadata from JSONL content
 */
function extractSegmentMetadata(jsonlContent, segmentName) {
    const lines = jsonlContent
        .split(exports.LINE_TERMINATOR)
        .filter(line => line.trim());
    if (lines.length === 0) {
        throw new Error('Empty segment');
    }
    const records = lines.map(line => JSON.parse(line));
    const first = records[0];
    const last = records[records.length - 1];
    return {
        chainId: first.chainId,
        segmentName,
        seqStart: first.seq,
        seqEnd: last.seq,
        recordCount: records.length,
        headHash: last.recordHash,
        segmentDigest: computeSegmentDigest(jsonlContent),
    };
}
//# sourceMappingURL=digest.js.map