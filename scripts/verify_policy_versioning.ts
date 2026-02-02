
import { SynapseAuthority } from '../packages/synapse/src/authority';
import { SynapsePolicyEngine } from '../packages/synapse/src/policy-engine/engine';
import { PolicyRegistry } from '../packages/synapse/src/policy-engine/registry';

async function main() {
    console.log('════════════════════════════════════════════════════');
    console.log('  POLICY VERSIONING VERIFICATION');
    console.log('════════════════════════════════════════════════════');

    const authority = SynapseAuthority.getInstance();
    const registry = PolicyRegistry.getInstance();

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Standard Policy (OPEN_CAPABILITY) -> Version Binding
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 1] Verifying Standard Policy Binding (core.finder)...');

    const context = {
        actorId: 'user-verifier',
        userRole: 'user'
    };

    const record = await authority.requestDecision({
        action: 'OPEN_CAPABILITY',
        target: 'core.finder',
        params: {}
    }, context);

    console.log(`[DECISION] ID: ${record.package.decisionId}`);
    console.log(`[DECISION] Policy ID: ${record.package.policyId}`);
    console.log(`[DECISION] Policy Ver: ${record.package.policyVersion}`);

    if (record.package.policyId === 'core.finder' && record.package.policyVersion === '1.0.0') {
        console.log('✅ TEST 1 PASSED: Correct Policy Identity bound.');
    } else {
        console.error('❌ TEST 1 FAILED: Incorrect Policy Identity.');
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Active Version Management
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 2] Verifying Registry Update (v2.0.0)...');

    // Register a new version of 'plugin.analytics' with specific requirement
    registry.register('plugin.analytics', '2.0.0', {
        id: 'plugin.analytics',
        title: 'Analytics v2',
        icon: '📊',
        hasUI: true,
        windowMode: 'multi',
        requiredPolicies: ['admin.access'], // CHANGED: Now requires admin
        requiresStepUp: false,
        dependencies: [],
        contextsSupported: ['global'],
        showInDock: true,
        certificationTier: 'experimental'
    });

    // Request decision as 'user' (should fail or rely on new policy logic if implemented)
    // Note: Our engine logic for OPEN_CAPABILITY checks requiredPolicies from the graph/registry.
    // Ideally, the graph should be updated too, but for this test we check if the Engine picks up the new version identity.

    // Force active version in registry (Logic in registry.ts currently auto-activates on register)

    const record2 = await authority.requestDecision({
        action: 'OPEN_CAPABILITY',
        target: 'plugin.analytics',
        params: {}
    }, context);

    console.log(`[DECISION] Policy Ver: ${record2.package.policyVersion}`);

    if (record2.package.policyVersion === '2.0.0') {
        console.log('✅ TEST 2 PASSED: Engine picked up v2.0.0.');
    } else {
        console.error(`❌ TEST 2 FAILED: Expected v2.0.0, got ${record2.package.policyVersion}`);
        process.exit(1);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Unknown Policy (Legacy Fallback)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n[TEST 3] Verifying Unknown Policy (Legacy Fallback)...');

    const record3 = await authority.requestDecision({
        action: 'OPEN_CAPABILITY',
        target: 'legacy.widget',
        params: {}
    }, context);

    console.log(`[DECISION] Policy ID: ${record3.package.policyId}`);
    console.log(`[DECISION] Policy Ver: ${record3.package.policyVersion}`);

    if (record3.package.policyId === 'unknown' && record3.package.policyVersion === 'legacy') {
        console.log('✅ TEST 3 PASSED: Legacy Fallback applied.');
    } else {
        console.error('❌ TEST 3 FAILED: Legacy Fallback not applied.');
        process.exit(1);
    }

    console.log('\n════════════════════════════════════════════════════');
    console.log('  ALL TESTS PASSED');
    console.log('════════════════════════════════════════════════════');
}

main().catch(console.error);
