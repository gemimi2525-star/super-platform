import { toolRegistry } from './coreos/brain/registry';
import { complianceEngine } from './coreos/brain/compliance';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifyAuditLang() {
    console.log('📜 Verifying Audit Language (Phase 32.0B)...');

    // Set to SG (English)
    await toolRegistry.executeTool('admin_set_country', { code: 'SG' }, { appId: 'system', correlationId: 'i18n-aud-sg', userId: 'admin' });

    const res = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'audit_sg.pdf', data: { amount: 500 }
    }, { appId: 'tenant-corp', correlationId: 'aud-sg-1', userId: 'ai' });

    const draft = accountingWorkflow.getDraft(res.draftId);
    // Audit logs are technically backend system logs, usually kept in English or System Default.
    // However, the "Evidence Pack" might need to be localized.
    // Core OS Policy: Internal System Logs = English (Standard). 
    // User Facing History = Localized.

    console.log('Internal Log:', draft?.auditLog[0]);

    // Check if log contains Standard English timestamp/action
    if (!draft?.auditLog[0].includes('Created by ai')) {
        throw new Error('Internal Audit format invalid');
    }

    // Check localized export capability (Mock)
    const exportLocale = complianceEngine.getLocale();
    console.log(`Export Target Locale: ${exportLocale}`);

    if (exportLocale !== 'en-SG') throw new Error('Export locale mismatch');

    console.log('✅ Audit System Language Governance Verified');
}

verifyAuditLang().catch(console.error);
