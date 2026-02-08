import { toolRegistry } from './coreos/brain/registry';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifyAIBlock() {
    console.log('🤖 Verifying AI Block on Posting (Phase 30B)...');

    // 1. AI Creates Draft
    const draftRes = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'invoice_hack.pdf',
        data: { amount: 9999 }
    }, { appId: 'core.files', correlationId: 'draft-2', userId: 'ai' });

    const draftId = draftRes.draftId;

    // 2. AI Attempts to Post (Should Fail)
    try {
        await toolRegistry.executeTool('execute_human_ledger_post', {
            draftId: draftId
        }, { appId: 'core.finance', correlationId: 'attack-2', userId: 'ai' }); // Impersonating capability but ID is AI
        console.error('❌ Failed: AI was able to post!');
    } catch (e: any) {
        if (e.message.includes('SECURITY BLOCK')) {
            console.log('✅ AI Blocked:', e.message);
        } else {
            console.error('❌ Unexpected Error:', e.message);
        }
    }
}

verifyAIBlock().catch(console.error);
