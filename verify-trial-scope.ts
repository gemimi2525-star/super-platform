import { toolRegistry } from './coreos/brain/registry';

async function verifySubscription() {
    console.log('💳 Verifying Go-To-Market Tiers (Phase 32B)...');

    // 1. Free Tenant -> Try AI Draft (Should Fail)
    try {
        await toolRegistry.executeTool('execute_create_accounting_draft', {
            sourceDoc: 'doc.pdf', data: { amount: 100 }
        }, { appId: 'tenant-free', correlationId: 'sub-1', userId: 'user' });
        console.error('❌ Failed: Free tenant should be blocked');
    } catch (e: any) {
        if (e.message.includes('SUBSCRIPTION BLOCK')) {
            console.log('✅ Free Tenant Blocked:', e.message);
        }
    }

    // 2. Pro Tenant -> Try AI Draft (Should Pass)
    try {
        await toolRegistry.executeTool('execute_create_accounting_draft', {
            sourceDoc: 'doc.pdf', data: { amount: 100 }
        }, { appId: 'tenant-sme', correlationId: 'sub-2', userId: 'user' });
        console.log('✅ Pro Tenant Allowed');
    } catch (e: any) {
        console.error('❌ Pro Tenant Failed:', e.message);
    }
}

verifySubscription().catch(console.error);
