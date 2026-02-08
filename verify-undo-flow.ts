import { toolRegistry } from './coreos/brain/registry';

async function verifyUndoFlow() {
    console.log('📸 Verifying Snapshot & Undo (Phase 27B)...');

    // 1. Move File (Should create snapshot)
    const res = await toolRegistry.executeTool('execute_file_move', { source: 'data.txt', destination: 'backup/data.txt' }, {
        appId: 'core.files', correlationId: 'mov-1', userId: 'user'
    });
    console.log('✅ Moved with Snapshot:', res);

    if (!res.undoToken) throw new Error('No undoToken returned');

    // 2. Undo (Rollback)
    const undoRes = await toolRegistry.executeTool('execute_system_rollback', { type: 'snapshot', id: res.undoToken }, {
        appId: 'core.files', correlationId: 'undo-1', userId: 'user'
    });
    console.log('✅ Rolled Back:', undoRes);
}

verifyUndoFlow().catch(console.error);
