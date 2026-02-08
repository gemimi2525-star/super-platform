import { toolRegistry } from './coreos/brain/registry';

async function verifyBusinessAnalysis() {
    console.log('📄 Verifying Business Doc Read-Only (Phase 29B)...');

    // Ensure Trust is High
    await toolRegistry.executeTool('admin_set_trust', { score: 80 }, { appId: 'system', correlationId: 't3', userId: 'admin' });

    // Analyze Invoice
    const res = await toolRegistry.executeTool('execute_business_analyze', {
        path: 'docs/invoice_2026.pdf',
        content: 'INVOICE TOTAL: 5000 USD'
    }, {
        appId: 'core.files', correlationId: 'biz-1', userId: 'ai'
    });

    console.log('Analysis Result:', res);

    if (res.type === 'INVOICE' && res.isDraft === true) {
        console.log('✅ Correctly identified INVOICE and marked as DRAFT');
        console.log('✅ Extracted Data:', res.extractedData);
    } else {
        console.error('❌ Identification failed');
    }
}

verifyBusinessAnalysis().catch(console.error);
