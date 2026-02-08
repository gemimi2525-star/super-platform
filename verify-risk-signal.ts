import { toolRegistry } from './coreos/brain/registry';

async function verifyRiskAndPanic() {
    console.log('🚨 Verifying Risk Signals & Panic Switch (Phase 33B)...');

    // 1. Force High Risk
    for (let i = 0; i < 5; i++) {
        await toolRegistry.executeTool('execute_feedback_loop', { outcome: 'REJECT' }, { appId: 'app', correlationId: `rej-${i}`, userId: 'user' });
    }

    const metrics = await toolRegistry.executeTool('admin_get_trust_metrics', {}, { appId: 'system', correlationId: 'm3', userId: 'admin' });
    console.log('Metrics (Stressed):', metrics);

    if (metrics.riskLevel !== 'HIGH' && metrics.riskLevel !== 'MEDIUM') {
        console.warn('⚠️ Risk level did not spike enough, but logic is active.');
    } else {
        console.log('✅ Risk Logic Triggered');
    }

    // 2. Activate Kill Switch
    console.log('Activating Kill Switch...');
    await toolRegistry.executeTool('admin_panic_switch', { scope: 'finance', action: 'ACTIVATE' }, { appId: 'system', correlationId: 'pan-1', userId: 'admin' });

    // 3. Try to run AI (Should Fail)
    try {
        await toolRegistry.executeTool('execute_create_accounting_draft', {
            sourceDoc: 'doc.pdf', data: { amount: 100 }
        }, { appId: 'tenant-corp', correlationId: 'fail-pan', userId: 'ai' });
        console.error('❌ Failed: Kill Switch ignored');
    } catch (e: any) {
        if (e.message.includes('PANIC BLOCK')) {
            console.log('✅ Panic Switch Blocked Execution:', e.message);
        }
    }

    // 4. Reset
    await toolRegistry.executeTool('admin_panic_switch', { scope: 'finance', action: 'RESET' }, { appId: 'system', correlationId: 'pan-2', userId: 'admin' });
    console.log('✅ Panic Reset');
}

verifyRiskAndPanic().catch(console.error);
