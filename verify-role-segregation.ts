import { toolRegistry } from './coreos/brain/registry';
import { accountingWorkflow } from './coreos/brain/accounting-workflow';

async function verifySoD() {
    console.log('👮 Verifying Segregation of Duties (Phase 31B)...');

    // 1. Create Draft (Anyone)
    const draftRes = await toolRegistry.executeTool('execute_create_accounting_draft', {
        sourceDoc: 'invoice.pdf', data: {}
    }, { appId: 'core.files', correlationId: 'sod-1', userId: 'junior_acc' }); // Junior can prepare

    console.log('Draft Created by Junior:', draftRes);
    const draftId = draftRes.draftId;

    // 2. Junior Attempts to Post (Should Fail)
    try {
        await toolRegistry.executeTool('execute_human_ledger_post', {
            draftId
        }, { appId: 'core.finance', correlationId: 'sod-2', userId: 'junior_acc' });
        console.error('❌ Failed: Junior should NOT be able to post');
    } catch (e: any) {
        if (e.message.includes('RBAC DENIED')) {
            console.log('✅ Junior Blocked:', e.message);
        }
    }

    // 3. Manager Posts (Should Pass)
    const postRes = await toolRegistry.executeTool('execute_human_ledger_post', {
        draftId
    }, { appId: 'core.finance', correlationId: 'sod-3', userId: 'manager_acc' });
    console.log('✅ Manager Posted:', postRes);
}

verifySoD().catch(console.error);
