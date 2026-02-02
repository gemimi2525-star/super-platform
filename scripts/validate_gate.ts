/**
 * SYNAPSE GOVERNANCE VALIDATION SCRIPT
 * Executes Scenarios A-E to verify Gate integrity and Ledger Audit.
 * 
 * Usage: npx ts-node scripts/validate_gate.ts
 */

import { SynapseAuthority } from '../packages/synapse/src/authority';
import { GovernanceGate } from '../packages/synapse/src/gate/governance-gate';
import { AuditLedger } from '../packages/synapse/src/audit-ledger/ledger';
import { DecisionRecord, DecisionPackage, ReasonCore, SCHEMA_VERSION } from '../packages/synapse/src/reason-core/schema';

// Mock Services
const authority = SynapseAuthority.getInstance();
const gate = GovernanceGate.getInstance();
const ledger = AuditLedger.getInstance();

const context = { actorId: 'tester', userRole: 'admin' };

async function runTests() {
    console.log('════════════════════════════════════════════════════════════');
    console.log(' SYNAPSE GOVERNANCE GATE VALIDATION');
    console.log('════════════════════════════════════════════════════════════');

    // ─────────────────────────────────────────────────────────────────────────
    // CASE A: No Decision ID / Invalid Record (Manual Forge)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[CASE A] No Decision ID / Manual Forge');
    const forgedRecord: any = {
        package: { decisionId: '' }, // Empty ID
        audit: { signature: 'fake' }
    };
    const resultA = await gate.enforce(forgedRecord, { action: 'TEST', target: 'system' });
    console.log(`Verdict: ${resultA} (Expected: DENY)`);

    // ─────────────────────────────────────────────────────────────────────────
    // CASE D: Valid Allow (Happy Path)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[CASE D] Valid Allow (Happy Path)');
    const decisionD = await authority.requestDecision(
        { action: 'OPEN_CAPABILITY', target: 'core.finder', params: {} },
        context
    );
    const resultD = await gate.enforce(decisionD, { action: 'OPEN_CAPABILITY', target: 'core.finder' });
    console.log(`Verdict: ${resultD} (Expected: ALLOW)`);

    // ─────────────────────────────────────────────────────────────────────────
    // CASE B: Invalid Signature (Tampered Payload)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[CASE B] Tampered Payload (Invalid Signature)');
    const decisionB = await authority.requestDecision(
        { action: 'SENSITIVE_OP', target: 'system', params: {} },
        context
    );

    // Tamper with the package AFTER signing
    const tamperedRecord = JSON.parse(JSON.stringify(decisionB)); // Deep copy
    tamperedRecord.package.intent.action = 'NUKE_SYSTEM'; // Malicious change

    const resultB = await gate.enforce(tamperedRecord, { action: 'NUKE_SYSTEM', target: 'system' });
    console.log(`Verdict: ${resultB} (Expected: DENY)`);

    // ─────────────────────────────────────────────────────────────────────────
    // CASE C: Scope Mismatch (Valid Signature, Wrong Proposed Action)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[CASE C] Scope Mismatch');
    const decisionC = await authority.requestDecision(
        { action: 'READ_DATA', target: 'db', params: {} },
        context
    );
    // Authority authorized READ, but Gate is asked to enforce WRITE
    const resultC = await gate.enforce(decisionC, { action: 'WRITE_DATA', target: 'db' });
    console.log(`Verdict: ${resultC} (Expected: DENY)`);

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATE LEDGER
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n[LEDGER VERIFICATION]');
    const report = ledger.verifyChain();
    console.log('Chain Valid:', report.isValid);
    console.log('Total Entries:', report.totalEntries);

    // Print last few entries to show Audit Trail
    // ledger.getChain().slice(-5).forEach(e => {
    //     console.log(`[${e.index}] ${e.event} -> ${e.hash.substr(0,8)}`);
    // });
}

runTests().catch(e => console.error(e));
