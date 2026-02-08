import { toolRegistry } from './coreos/brain/registry';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifyAuditExport() {
    console.log('📦 Verifying Audit Export (Phase 31C)...');

    // Create a transaction to have logs
    const draftRes = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'audit_final.pdf', data: {}
    }, { appId: 'core.files', correlationId: 'aud-ex-1', userId: 'ai' });

    // Mock export function (In real OS this would be a tool)
    const draft = accountingWorkflow.getDraft(draftRes.draftId);

    const evidencePack = {
        transactionId: draftRes.draftId,
        chainOfCustody: draft?.auditLog,
        soDVerification: {
            preparer: draft?.createdBy,
            poster: 'PENDING'
        }
    };

    console.log('Generated Evidence Pack:', JSON.stringify(evidencePack, null, 2));

    if (evidencePack.chainOfCustody && evidencePack.chainOfCustody.length > 0) {
        console.log('✅ Evidence Pack valid.');
    } else {
        throw new Error('Empty evidence pack');
    }
}

verifyAuditExport().catch(console.error);
