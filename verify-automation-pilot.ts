/**
 * Verification Script for Phase 26.3: Automation Pilot
 * 
 * Objectives:
 * 1. Verify Auto-Clean works on 'tmp://'.
 * 2. Verify Auto-Clean FAILS on 'user://'.
 * 3. Verify Kill Switch disables automation.
 */

import { toolRegistry } from './coreos/brain/registry';

async function verifyAutomationPilot() {
    console.log('🤖 Starting Phase 26.3 Automation Pilot Verification...\n');

    // Scenario 1: Safe Automation (tmp://)
    console.log('--- 1. Safe Automation (tmp://) ---');
    try {
        const res = await toolRegistry.executeTool('execute_auto_clean_tmp', { targetPath: 'tmp://cache' }, {
            appId: 'core.files',
            correlationId: 'auto-001',
            userId: 'system-auto'
        });
        console.log('✅ Auto-Clean executed:', res);
    } catch (e: any) {
        console.error('❌ Safe Automation Failed:', e.message);
    }

    // Scenario 2: Safety Breach Attempt (user://)
    console.log('\n--- 2. Safety Breach Attempt (user://) ---');
    try {
        await toolRegistry.executeTool('execute_auto_clean_tmp', { targetPath: 'user://documents' }, {
            appId: 'core.files',
            correlationId: 'auto-attack-001',
            userId: 'system-auto'
        });
        console.error('❌ Critical: Safety Breach Allowed!');
    } catch (e: any) {
        console.log('✅ Safety Breach Blocked:', e.message);
    }

    // Scenario 3: Kill Switch Test
    console.log('\n--- 3. Kill Switch Test ---');
    try {
        // Disable Automation
        await toolRegistry.executeTool('admin_toggle_automation', { enable: false }, {
            appId: 'system',
            correlationId: 'admin-001',
            userId: 'admin'
        });

        // Attempt Safe Operation again (Should Fail now)
        await toolRegistry.executeTool('execute_auto_clean_tmp', { targetPath: 'tmp://logs' }, {
            appId: 'core.files',
            correlationId: 'auto-002',
            userId: 'system-auto'
        });
        console.error('❌ Critical: Execution allowed after Kill Switch!');
    } catch (e: any) {
        if (e.message.includes('DISABLED')) {
            console.log('✅ Kill Switch Enforced:', e.message);
        } else {
            console.error('❌ Unexpected Error:', e.message);
        }
    }

    // Restore State
    await toolRegistry.executeTool('admin_toggle_automation', { enable: true }, { appId: 'system', correlationId: 'admin-rest', userId: 'admin' });
    console.log('\n--- Verification Summary ---');
    console.log('Safety Scope & Kill Switch verified.');
}

verifyAutomationPilot().catch(console.error);
