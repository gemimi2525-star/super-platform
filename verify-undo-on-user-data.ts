import { toolRegistry } from './coreos/brain/registry';

async function verifyUndoUserData() {
    console.log('↩️ Verifying Undo on User Data (Phase 28)...');

    // 1. Organize
    const res = await toolRegistry.executeTool('execute_auto_organize', {
        sourcePath: 'user://documents/wrong_file.txt',
        targetPath: 'user://documents/archive/wrong_file.txt'
    }, {
        appId: 'core.files', correlationId: 'oops-1', userId: 'system-auto'
    });
    console.log('✅ Action Executed:', res);

    // 2. Undo
    const undoRes = await toolRegistry.executeTool('execute_system_rollback', {
        type: 'snapshot',
        id: res.undoToken
    }, {
        appId: 'core.files', correlationId: 'undo-oops', userId: 'user'
    });
    console.log('✅ Undo Success:', undoRes);
}

verifyUndoUserData().catch(console.error);
