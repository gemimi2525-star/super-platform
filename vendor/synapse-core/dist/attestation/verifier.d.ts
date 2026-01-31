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
import type { AttestationManifest, VerificationResult } from './types';
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
export declare function verifySegment(params: {
    jsonl: string;
    manifest: AttestationManifest;
    publicKey: Uint8Array;
}): VerificationResult;
/**
 * Verify continuity across multiple segments
 * Checks that seqEnd of segment N = seqStart of segment N+1 - 1
 */
export declare function verifySegmentContinuity(manifests: readonly AttestationManifest[]): {
    ok: boolean;
    failures: string[];
};
//# sourceMappingURL=verifier.d.ts.map