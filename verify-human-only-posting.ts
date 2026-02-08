import { toolRegistry } from './coreos/brain/registry';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifyHumanPosting() {
    console.log('👤 Verifying Human Posting (Phase 30A)...');

    // 1. AI Creates Draft
    const draftRes = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'invoice_valid.pdf',
        data: { amount: 100 }
    }, { appId: 'core.files', correlationId: 'draft-1', userId: 'ai' });

    console.log('AI Draft:', draftRes);
    const draftId = draftRes.draftId;

    // 2. Human Posts
    console.log('Human attempting to post...');
    const postRes = await toolRegistry.executeTool('execute_human_ledger_post', {
        draftId: draftId
    }, { appId: 'core.finance', correlationId: 'post-1', userId: 'human_user' });

    console.log('✅ Human Post Success:', postRes);

    const draft = accountingWorkflow.getDraft(draftId);
    if (draft?.status !== 'POSTED') throw new Error('Status not updated');
}

verifyHumanPosting().catch(console.error);
