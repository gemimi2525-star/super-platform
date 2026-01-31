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

import { createHash } from 'crypto';
import type { AuditRecord } from '../audit/types';
import type { SegmentMetadata } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Line terminator for JSONL (LF only, no CRLF) */
export const LINE_TERMINATOR = '\n';

/** Hash algorithm for digest */
export const DIGEST_ALGORITHM = 'sha256';

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
export function computeSegmentDigest(jsonlContent: string): string {
    // Normalize line endings to LF
    const normalized = normalizeLineEndings(jsonlContent);

    // Compute SHA-256
    return createHash(DIGEST_ALGORITHM)
        .update(normalized, 'utf8')
        .digest('hex');
}

/**
 * Compute digest from raw bytes
 */
export function computeDigestFromBytes(bytes: Buffer): string {
    return createHash(DIGEST_ALGORITHM)
        .update(bytes)
        .digest('hex');
}

/**
 * Normalize line endings to LF only
 */
export function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENT METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract metadata from JSONL content
 */
export function extractSegmentMetadata(
    jsonlContent: string,
    segmentName: string
): SegmentMetadata {
    const lines = jsonlContent
        .split(LINE_TERMINATOR)
        .filter(line => line.trim());

    if (lines.length === 0) {
        throw new Error('Empty segment');
    }

    const records: AuditRecord[] = lines.map(line => JSON.parse(line));

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
