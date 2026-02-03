/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRUST API — Verify Signature (Phase 6)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * POST /api/trust/verify
 * 
 * Verify a digest + signature against the public key.
 * This allows external parties to verify attestation independently.
 * 
 * Request body:
 * {
 *   "digest": "sha256 hex string",
 *   "signature": "base64 Ed25519 signature"
 * }
 * 
 * Response:
 * {
 *   "ok": true/false,
 *   "timestamp": epoch,
 *   "publicKeyId": "fingerprint used"
 * }
 * 
 * @module app/api/trust/verify
 * @version 1.0.0 (Phase 6)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDefaultKeyProvider, verifyDigestSignature } from '@/coreos/attestation';

// ═══════════════════════════════════════════════════════════════════════════
// POST HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { digest, signature } = body;

        // Validate input
        if (!digest || typeof digest !== 'string') {
            return NextResponse.json({
                ok: false,
                error: 'Missing or invalid "digest" field (expected SHA-256 hex string)',
            }, { status: 400 });
        }

        if (!signature || typeof signature !== 'string') {
            return NextResponse.json({
                ok: false,
                error: 'Missing or invalid "signature" field (expected base64 Ed25519 signature)',
            }, { status: 400 });
        }

        // Validate digest format (64 hex chars for SHA-256)
        if (!/^[a-f0-9]{64}$/i.test(digest)) {
            return NextResponse.json({
                ok: false,
                error: 'Invalid digest format (expected 64 hex characters for SHA-256)',
            }, { status: 400 });
        }

        // Get public key and verify
        const keyProvider = getDefaultKeyProvider();
        const publicKey = keyProvider.getPublicKey();
        const publicKeyId = keyProvider.getPublicKeyId();

        const isValid = verifyDigestSignature(digest, signature, publicKey);

        return NextResponse.json({
            ok: isValid,
            timestamp: Date.now(),
            publicKeyId: publicKeyId,
            algorithm: 'ed25519',
        });

    } catch (error) {
        console.error('[Trust Verify] Error:', error);

        // Check if it's a JSON parse error
        if (error instanceof SyntaxError) {
            return NextResponse.json({
                ok: false,
                error: 'Invalid JSON in request body',
            }, { status: 400 });
        }

        return NextResponse.json({
            ok: false,
            error: 'Verification failed due to internal error',
        }, { status: 500 });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// OTHER METHODS
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST with { digest, signature } body.',
        usage: {
            method: 'POST',
            body: {
                digest: 'SHA-256 hex string (64 characters)',
                signature: 'Base64 Ed25519 signature',
            },
            example: {
                digest: 'a'.repeat(64),
                signature: 'base64EncodedSignature...',
            }
        }
    }, { status: 405 });
}
