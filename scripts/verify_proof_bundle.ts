/**
 * EXTERNAL PROOF VERIFICATION SCRIPT
 * 
 * Simulates a third-party verifier checking a ProofBundle.
 * This script intentionally uses minimal imports to demonstrate
 * that verification can be done without full system access.
 */

import { ProofBundle, verifyProofBundle } from '../packages/synapse/src/audit-ledger/proof';
import { MockSigner } from '../packages/synapse/src/audit-ledger/signer';
import { SynapseAuthority } from '../packages/synapse/src/authority';
import { AuditLedger } from '../packages/synapse/src/audit-ledger/ledger';
import { createProofBundle } from '../packages/synapse/src/audit-ledger/proof';
import * as crypto from 'node:crypto';

async function main() {
    console.log('════════════════════════════════════════════════════');
    console.log('  PROOF BUNDLE VERIFICATION (External)');
    console.log('════════════════════════════════════════════════════');

    const authority = SynapseAuthority.getInstance();
    const ledger = AuditLedger.getInstance();
    const signer = ledger.getSigner();

    // ─────────────────────────────────────────────────────────────────
    // SETUP: Create a Decision and ProofBundle
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[SETUP] Creating a decision and extracting ProofBundle...');

    const intent = {
        action: 'OPEN_CAPABILITY',
        target: 'core.finder',
        params: { foo: 'bar' }
    };

    const context = {
        actorId: 'user-external-test',
        userRole: 'user'
    };

    const record = await authority.requestDecision(intent, context);

    // Create ProofBundle
    const proof = createProofBundle(
        record.package.decisionId,
        record.package.policyId,
        record.package.policyVersion,
        intent,
        record.package.decision,
        record.audit.ledger_ref,
        ledger.getAuthorityId(),
        signer
    );

    console.log(`[PROOF] Created for Decision: ${proof.decisionId}`);
    console.log(`[PROOF] Policy: ${proof.policyId}@${proof.policyVersion}`);
    console.log(`[PROOF] Intent Hash: ${proof.intentHash.substring(0, 16)}...`);
    console.log(`[PROOF] Decision: ${proof.decision}`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Verify Valid Proof
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 1] Verifying Valid Proof...');

    const result1 = verifyProofBundle(proof, signer);
    console.log(`[VERIFY] Valid: ${result1.valid}`);

    if (result1.valid) {
        console.log('✅ TEST 1 PASSED: Valid proof verified successfully.');
    } else {
        console.error(`❌ TEST 1 FAILED: ${result1.reason}`);
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Tampered Intent Hash
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Testing Tampered Intent Hash...');

    const tamperedProof = {
        ...proof,
        intentHash: 'fake-hash-12345678'
    };

    const result2 = verifyProofBundle(tamperedProof, signer);
    console.log(`[VERIFY] Valid: ${result2.valid}`);

    if (!result2.valid && result2.reason === 'Invalid signature') {
        console.log('✅ TEST 2 PASSED: Tampered intent hash rejected.');
    } else {
        console.error('❌ TEST 2 FAILED: Tampered proof was accepted.');
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Tampered Signature
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Testing Tampered Signature...');

    const tamperedSigProof = {
        ...proof,
        signature: 'fake-signature-abcdef'
    };

    const result3 = verifyProofBundle(tamperedSigProof, signer);
    console.log(`[VERIFY] Valid: ${result3.valid}`);

    if (!result3.valid && result3.reason === 'Invalid signature') {
        console.log('✅ TEST 3 PASSED: Tampered signature rejected.');
    } else {
        console.error('❌ TEST 3 FAILED: Tampered signature was accepted.');
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Ledger Chain Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 4] Verifying Ledger Chain Integrity...');

    const chainReport = ledger.verifyChain();
    console.log(`[LEDGER] Valid: ${chainReport.isValid}`);
    console.log(`[LEDGER] Total Entries: ${chainReport.totalEntries}`);

    if (chainReport.isValid) {
        console.log('✅ TEST 4 PASSED: Ledger chain integrity verified.');
    } else {
        console.error(`❌ TEST 4 FAILED: Chain broken at index ${chainReport.brokenIndex}`);
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Export Snapshot (Public Proof)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 5] Exporting Public Ledger Snapshot...');

    const snapshot = ledger.exportSnapshot();
    console.log(`[SNAPSHOT] Authority: ${snapshot.authorityId}`);
    console.log(`[SNAPSHOT] Public Key: ${snapshot.publicKey}`);
    console.log(`[SNAPSHOT] Total Entries: ${snapshot.totalEntries}`);
    console.log(`[SNAPSHOT] Chain Valid: ${snapshot.chainValid}`);

    if (snapshot.chainValid && snapshot.totalEntries > 0) {
        console.log('✅ TEST 5 PASSED: Public snapshot exported successfully.');
    } else {
        console.error('❌ TEST 5 FAILED: Snapshot invalid.');
        process.exit(1);
    }

    console.log('\n════════════════════════════════════════════════════');
    console.log('  ALL TESTS PASSED');
    console.log('════════════════════════════════════════════════════');
    console.log('\n📦 Sample Proof Bundle (Shareable):');
    console.log(JSON.stringify(proof, null, 2));
}

main().catch(console.error);
