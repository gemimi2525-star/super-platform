"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Attestation Module (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Trust & Attestation Layer for signed audit export.
 * Algorithm: Ed25519 (LOCKED)
 *
 * @module coreos/attestation
 * @version 1.0.0 (Phase T)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySegmentContinuity = exports.verifySegment = exports.parseManifest = exports.serializeManifest = exports.buildManifest = exports.verifyDigestSignature = exports.verifySignature = exports.signDigest = exports.signData = exports.resetKeyProvider = exports.setDefaultKeyProvider = exports.getDefaultKeyProvider = exports.EnvironmentKeyProvider = exports.TestKeyProvider = exports.computePublicKeyId = exports.getTestKeyPair = exports.extractSegmentMetadata = exports.normalizeLineEndings = exports.computeDigestFromBytes = exports.computeSegmentDigest = exports.DIGEST_ALGORITHM = exports.LINE_TERMINATOR = exports.TOOL_VERSION = exports.SIGNATURE_ALGORITHM = exports.ATTESTATION_VERSION = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "ATTESTATION_VERSION", { enumerable: true, get: function () { return types_1.ATTESTATION_VERSION; } });
Object.defineProperty(exports, "SIGNATURE_ALGORITHM", { enumerable: true, get: function () { return types_1.SIGNATURE_ALGORITHM; } });
Object.defineProperty(exports, "TOOL_VERSION", { enumerable: true, get: function () { return types_1.TOOL_VERSION; } });
// Digest
var digest_1 = require("./digest");
Object.defineProperty(exports, "LINE_TERMINATOR", { enumerable: true, get: function () { return digest_1.LINE_TERMINATOR; } });
Object.defineProperty(exports, "DIGEST_ALGORITHM", { enumerable: true, get: function () { return digest_1.DIGEST_ALGORITHM; } });
Object.defineProperty(exports, "computeSegmentDigest", { enumerable: true, get: function () { return digest_1.computeSegmentDigest; } });
Object.defineProperty(exports, "computeDigestFromBytes", { enumerable: true, get: function () { return digest_1.computeDigestFromBytes; } });
Object.defineProperty(exports, "normalizeLineEndings", { enumerable: true, get: function () { return digest_1.normalizeLineEndings; } });
Object.defineProperty(exports, "extractSegmentMetadata", { enumerable: true, get: function () { return digest_1.extractSegmentMetadata; } });
// Keys
var keys_1 = require("./keys");
Object.defineProperty(exports, "getTestKeyPair", { enumerable: true, get: function () { return keys_1.getTestKeyPair; } });
Object.defineProperty(exports, "computePublicKeyId", { enumerable: true, get: function () { return keys_1.computePublicKeyId; } });
Object.defineProperty(exports, "TestKeyProvider", { enumerable: true, get: function () { return keys_1.TestKeyProvider; } });
Object.defineProperty(exports, "EnvironmentKeyProvider", { enumerable: true, get: function () { return keys_1.EnvironmentKeyProvider; } });
Object.defineProperty(exports, "getDefaultKeyProvider", { enumerable: true, get: function () { return keys_1.getDefaultKeyProvider; } });
Object.defineProperty(exports, "setDefaultKeyProvider", { enumerable: true, get: function () { return keys_1.setDefaultKeyProvider; } });
Object.defineProperty(exports, "resetKeyProvider", { enumerable: true, get: function () { return keys_1.resetKeyProvider; } });
// Signer
var signer_1 = require("./signer");
Object.defineProperty(exports, "signData", { enumerable: true, get: function () { return signer_1.signData; } });
Object.defineProperty(exports, "signDigest", { enumerable: true, get: function () { return signer_1.signDigest; } });
Object.defineProperty(exports, "verifySignature", { enumerable: true, get: function () { return signer_1.verifySignature; } });
Object.defineProperty(exports, "verifyDigestSignature", { enumerable: true, get: function () { return signer_1.verifyDigestSignature; } });
// Manifest
var manifest_1 = require("./manifest");
Object.defineProperty(exports, "buildManifest", { enumerable: true, get: function () { return manifest_1.buildManifest; } });
Object.defineProperty(exports, "serializeManifest", { enumerable: true, get: function () { return manifest_1.serializeManifest; } });
Object.defineProperty(exports, "parseManifest", { enumerable: true, get: function () { return manifest_1.parseManifest; } });
// Verifier
var verifier_1 = require("./verifier");
Object.defineProperty(exports, "verifySegment", { enumerable: true, get: function () { return verifier_1.verifySegment; } });
Object.defineProperty(exports, "verifySegmentContinuity", { enumerable: true, get: function () { return verifier_1.verifySegmentContinuity; } });
//# sourceMappingURL=index.js.map