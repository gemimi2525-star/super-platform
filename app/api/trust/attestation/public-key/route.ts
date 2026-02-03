/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRUST API — Public Key (Phase 6)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * GET /api/trust/attestation/public-key
 * 
 * Returns ONLY the public key for external verification.
 * This enables anyone to verify attestation signatures.
 * 
 * @module app/api/trust/attestation/public-key
 * @version 1.0.0 (Phase 6)
 */

import { NextResponse } from 'next/server';
import { getDefaultKeyProvider, SIGNATURE_ALGORITHM } from '@/coreos/attestation';

// ═══════════════════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        const keyProvider = getDefaultKeyProvider();
        const publicKeyBytes = keyProvider.getPublicKey();
        const publicKeyId = keyProvider.getPublicKeyId();

        return NextResponse.json({
            publicKey: Buffer.from(publicKeyBytes).toString('hex'),
            publicKeyId: publicKeyId,
            algorithm: SIGNATURE_ALGORITHM,
            encoding: 'hex',
            usage: 'Ed25519 signature verification',
            note: 'Use this key to verify attestation signatures from APICOREDATA governance.',
        }, {
            headers: {
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('[Trust Public Key] Error:', error);
        return NextResponse.json({
            error: 'Failed to retrieve public key',
        }, { status: 500 });
    }
}
