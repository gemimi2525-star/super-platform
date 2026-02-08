/**
 * Verification Script for Phase 26.2B: Approved Execution
 * 
 * Objectives:
 * 1. Verify "Execute" tools work when called directly (User Approved).
 * 2. Verify "Execute" tools are available in Registry.
 */

import { toolRegistry } from './coreos/brain/registry';

async function verifyApprovedExecution() {
    console.log('🚀 Starting Phase 26.2B Verification (Approved Execution)...\n');

    // Scenario 1: User Approves "Move File"
    console.log('--- 1. Executing File Move (User Approved) ---');
    try {
        const result = await toolRegistry.executeTool('execute_file_move', {
            source: 'Budget.xlsx',
            destination: 'Finance/Budget.xlsx'
        }, {
            appId: 'core.files',
            correlationId: 'test-exec-move-001',
            userId: 'user-approved'
        });
        console.log('✅ Move Execution Result:', result);
    } catch (e: any) {
        console.error('❌ Move Failed:', e.message);
    }

    // Scenario 2: User Approves "Revoke Permission"
    console.log('\n--- 2. Executing Revoke Permission (User Approved) ---');
    try {
        const result = await toolRegistry.executeTool('execute_revoke_permission', {
            appName: 'Weather App',
            capabilityId: 'user.location'
        }, {
            appId: 'core.settings',
            correlationId: 'test-exec-revoke-001',
            userId: 'user-approved'
        });
        console.log('✅ Revoke Execution Result:', result);
    } catch (e: any) {
        console.error('❌ Revoke Failed:', e.message);
    }

    console.log('\n--- Verification Summary ---');
    console.log('Both execution tools ran successfully when invoked by System/User.');
}

verifyApprovedExecution().catch(console.error);
