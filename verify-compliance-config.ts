import { toolRegistry } from './coreos/brain/registry';

async function verifyCompliance() {
    console.log('🌏 Verifying Compliance Engine (Phase 32A)...');

    // 1. Set to TH
    await toolRegistry.executeTool('admin_set_country', { code: 'TH' }, { appId: 'system', correlationId: 'cmp-1', userId: 'admin' });

    const resTH = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'inv.pdf', data: { amount: 100 }
    }, { appId: 'tenant-corp', correlationId: 'th-1', userId: 'ai' }); // Enterprise Tenant

    console.log('TH Result:', resTH.localizedInfo);
    if (resTH.localizedInfo.taxName !== 'VAT' || resTH.localizedInfo.taxAmount !== 7) {
        throw new Error('TH Tax incorrect');
    }

    // 2. Set to SG
    await toolRegistry.executeTool('admin_set_country', { code: 'SG' }, { appId: 'system', correlationId: 'cmp-2', userId: 'admin' });

    const resSG = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'inv.pdf', data: { amount: 100 }
    }, { appId: 'tenant-corp', correlationId: 'sg-1', userId: 'ai' });

    console.log('SG Result:', resSG.localizedInfo);
    if (resSG.localizedInfo.taxName !== 'GST' || resSG.localizedInfo.taxAmount !== 9) {
        throw new Error('SG Tax incorrect');
    }

    console.log('✅ Compliance Dynamic Switching Verified');
}

verifyCompliance().catch(console.error);
