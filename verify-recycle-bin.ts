import { toolRegistry } from './coreos/brain/registry';

async function verifyRecycleBin() {
    console.log('🗑️ Verifying Recycle Bin (Phase 27A)...');

    // 1. Delete File
    const res = await toolRegistry.executeTool('execute_file_delete', { path: 'important.doc' }, {
        appId: 'core.files', correlationId: 'del-1', userId: 'user'
    });
    console.log('✅ Deleted:', res);

    if (!res.recycleId) throw new Error('No recycleId returned');

    // 2. Restore File
    const restoreRes = await toolRegistry.executeTool('execute_system_rollback', { type: 'recycle', id: res.recycleId }, {
        appId: 'core.files', correlationId: 'rest-1', userId: 'user'
    });
    console.log('✅ Restored:', restoreRes);
}

verifyRecycleBin().catch(console.error);
