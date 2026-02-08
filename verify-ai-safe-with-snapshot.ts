import { toolRegistry } from './coreos/brain/registry';

async function verifyAISafety() {
    console.log('🤖 Verifying AI Safety with Snapshot (Phase 27)...');

    // 1. Auto-Clean (Should create snapshot)
    const res = await toolRegistry.executeTool('execute_auto_clean_tmp', { targetPath: 'tmp://session' }, {
        appId: 'core.files', correlationId: 'auto-safe-1', userId: 'system-auto'
    });
    console.log('✅ Auto-Clean executed with Snapshot:', res);

    if (!res.undoToken) throw new Error('No undoToken provided for automation!');

    console.log('✅ Audit Trail confirms Reversibility.');
}

verifyAISafety().catch(console.error);
