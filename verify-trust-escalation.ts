import { toolRegistry } from './coreos/brain/registry';

async function verifyTrustEscalation() {
    console.log('🛡️ Verifying Trust Escalation (Phase 29A)...');

    // 1. Set Trust to Low (Observer)
    await toolRegistry.executeTool('admin_set_trust', { score: 30 }, { appId: 'system', correlationId: 't1', userId: 'admin' });
    console.log('Set Trust: 30 (Observer)');

    // Attempt Analysis (Should Fail)
    try {
        await toolRegistry.executeTool('execute_business_analyze', { path: 'invoice.pdf', content: 'INVOICE #123' }, {
            appId: 'core.files', correlationId: 'fail-1', userId: 'ai'
        });
        console.error('❌ Failed: Should have been denied');
    } catch (e: any) {
        if (e.message.includes('TRUST DENIED')) {
            console.log('✅ Blocked Low Trust Analysis:', e.message);
        }
    }

    // 2. Set Trust to High (Drafter)
    await toolRegistry.executeTool('admin_set_trust', { score: 80 }, { appId: 'system', correlationId: 't2', userId: 'admin' });
    console.log('Set Trust: 80 (Drafter)');

    // Attempt Analysis (Should Pass)
    try {
        const res = await toolRegistry.executeTool('execute_business_analyze', { path: 'invoice.pdf', content: 'INVOICE #123' }, {
            appId: 'core.files', correlationId: 'pass-1', userId: 'ai'
        });
        console.log('✅ Allowed High Trust Analysis:', res);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

verifyTrustEscalation().catch(console.error);
