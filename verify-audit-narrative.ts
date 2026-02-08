import { toolRegistry } from './coreos/brain/registry';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifyAudit() {
    console.log('📜 Verifying Audit Narrative (Phase 30C)...');

    // Workflow Simulation
    const draftRes = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'audit_test.pdf', data: {}
    }, { appId: 'core.files', correlationId: 'audit-1', userId: 'ai-copilot' });

    const draftId = draftRes.draftId;

    await accountingWorkflow.reviewDraft(draftId, 'human_manager', { note: 'Verified ok' });

    await toolRegistry.executeTool('execute_human_ledger_post', {
        draftId: draftId
    }, { appId: 'core.finance', correlationId: 'audit-2', userId: 'human_manager' });

    // Check Log
    const draft = accountingWorkflow.getDraft(draftId);
    console.log('Full Audit Log:');
    draft?.auditLog.forEach(entry => console.log(`  ${entry}`));

    if (draft?.auditLog.some(l => l.includes('Created by ai-copilot')) &&
        draft?.auditLog.some(l => l.includes('POSTED TO LEDGER by human_manager'))) {
        console.log('✅ Audit Trail confirms AI-Human Handshake.');
    } else {
        throw new Error('Audit trail incomplete');
    }
}

verifyAudit().catch(console.error);
