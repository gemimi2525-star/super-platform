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
import type { SegmentMetadata } from './types';
/** Line terminator for JSONL (LF only, no CRLF) */
export declare const LINE_TERMINATOR = "\n";
/** Hash algorithm for digest */
export declare const DIGEST_ALGORITHM = "sha256";
/**
 * Compute SHA-256 digest of JSONL content (canonical bytes)
 *
 * Rules:
 * - Lines terminated by LF (\n) only
 * - No trailing newline after last record
 * - UTF-8 encoding
 */
export declare function computeSegmentDigest(jsonlContent: string): string;
/**
 * Compute digest from raw bytes
 */
export declare function computeDigestFromBytes(bytes: Buffer): string;
/**
 * Normalize line endings to LF only
 */
export declare function normalizeLineEndings(content: string): string;
/**
 * Extract metadata from JSONL content
 */
export declare function extractSegmentMetadata(jsonlContent: string, segmentName: string): SegmentMetadata;
//# sourceMappingURL=digest.d.ts.map