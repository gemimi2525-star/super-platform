"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Attestation Module Types (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Trust & Attestation Layer for signed audit segments.
 * Algorithm: Ed25519 (LOCKED)
 *
 * @module coreos/attestation/types
 * @version 1.0.0 (Phase T)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_VERSION = exports.SIGNATURE_ALGORITHM = exports.ATTESTATION_VERSION = void 0;
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
/** Attestation schema version */
exports.ATTESTATION_VERSION = '1.0';
/** Signature algorithm (LOCKED) */
exports.SIGNATURE_ALGORITHM = 'ed25519';
/** Tool version for manifest */
exports.TOOL_VERSION = 'coreos-attestation-1.0.0';
//# sourceMappingURL=types.js.map