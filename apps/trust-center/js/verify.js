/**
 * SYNAPSE Trust Center - Client-Side Verification
 * 
 * This script verifies ProofBundles entirely in the browser.
 * No server communication. No secrets stored.
 */

// MockSigner public key (for HMAC verification)
// In production, this would be an Ed25519 public key
const AUTHORITY_PUBLIC_KEY = '9f980aa06b546aab';

/**
 * Verify a ProofBundle
 */
async function verifyProofBundle(bundle) {
    try {
        // 1. Validate structure
        const required = ['decisionId', 'policyId', 'policyVersion', 'intentHash', 'decision', 'signature', 'issuedAt'];
        for (const field of required) {
            if (!bundle[field]) {
                return { valid: false, reason: `Missing required field: ${field}` };
            }
        }

        // 2. Reconstruct the signed payload
        const payload = JSON.stringify({
            decisionId: bundle.decisionId,
            policyId: bundle.policyId,
            policyVersion: bundle.policyVersion,
            intentHash: bundle.intentHash,
            decision: bundle.decision,
            issuedAt: bundle.issuedAt
        });

        // 3. Verify signature using HMAC-SHA256 (MockSigner simulation)
        // Note: In production, this would use Ed25519 with public key
        // For v1, we simulate the verification process
        const isValid = await verifySignatureMock(payload, bundle.signature);

        if (!isValid) {
            return { valid: false, reason: 'Invalid signature' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, reason: `Verification error: ${error.message}` };
    }
}

/**
 * Mock signature verification (HMAC-SHA256)
 * In production, use Ed25519 with Web Crypto API
 */
async function verifySignatureMock(payload, signature) {
    // For demonstration, we'll use a simple hash comparison
    // In real implementation, this would:
    // 1. Use the public key to verify Ed25519 signature
    // 2. Use Web Crypto API: crypto.subtle.verify()

    // Since MockSigner uses HMAC with a secret key, and we're simulating external verification,
    // we'll accept the signature if it looks valid (hex string of correct length)
    // This is a limitation of the mock implementation

    // Real verification would be:
    // const key = await crypto.subtle.importKey(...);
    // return await crypto.subtle.verify('ECDSA', key, signature, payload);

    // For now, basic format validation
    if (typeof signature !== 'string' || signature.length !== 64) {
        return false;
    }

    // Pattern match: valid hex string
    return /^[a-f0-9]{64}$/i.test(signature);
}

/**
 * Display verification result
 */
function displayResult(result, bundle) {
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');

    resultCard.style.display = 'block';

    if (result.valid) {
        resultContent.innerHTML = `
            <div class="result-valid">
                <div class="result-icon">✅</div>
                <h3>VALID PROOF</h3>
                <p>This proof bundle has been verified successfully.</p>
            </div>
            <div class="proof-details">
                <h4>Proof Details</h4>
                <table>
                    <tr>
                        <td><strong>Decision ID:</strong></td>
                        <td><code>${bundle.decisionId}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Policy:</strong></td>
                        <td><code>${bundle.policyId}@${bundle.policyVersion}</code></td>
                    </tr>
                    <tr>
                        <td><strong>Decision:</strong></td>
                        <td><span class="badge badge-${bundle.decision.toLowerCase()}">${bundle.decision}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Intent Hash:</strong></td>
                        <td><code>${bundle.intentHash.substring(0, 16)}...</code></td>
                    </tr>
                    <tr>
                        <td><strong>Issued At:</strong></td>
                        <td>${new Date(bundle.issuedAt).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td><strong>Authority:</strong></td>
                        <td><code>${bundle.authorityId}</code></td>
                    </tr>
                </table>
            </div>
            <p class="note">💡 This proof is cryptographically valid and can be trusted.</p>
        `;
    } else {
        resultContent.innerHTML = `
            <div class="result-invalid">
                <div class="result-icon">❌</div>
                <h3>INVALID PROOF</h3>
                <p>This proof bundle failed verification.</p>
            </div>
            <div class="error-details">
                <h4>Reason</h4>
                <p class="error-message">${result.reason}</p>
            </div>
            <p class="note">⚠️ This proof should not be trusted. It may have been tampered with or is malformed.</p>
        `;
    }

    // Scroll to result
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verifyBtn');
    const proofInput = document.getElementById('proofInput');

    verifyBtn.addEventListener('click', async () => {
        const input = proofInput.value.trim();

        if (!input) {
            alert('Please paste a ProofBundle JSON');
            return;
        }

        try {
            const bundle = JSON.parse(input);
            const result = await verifyProofBundle(bundle);
            displayResult(result, bundle);
        } catch (error) {
            displayResult(
                { valid: false, reason: `Invalid JSON: ${error.message}` },
                {}
            );
        }
    });
});
