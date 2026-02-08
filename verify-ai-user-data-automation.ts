import { toolRegistry } from './coreos/brain/registry';

async function verifyUserDataAutomation() {
    console.log('📂 Verifying AI User Data Automation (Phase 28)...');

    // 1. Success Case
    try {
        const res = await toolRegistry.executeTool('execute_auto_organize', {
            sourcePath: 'user://downloads/report.pdf',
            targetPath: 'user://documents/Work/report.pdf'
        }, {
            appId: 'core.files', correlationId: 'auto-org-1', userId: 'system-auto'
        });
        console.log('✅ Auto-Organize Success:', res);

        if (!res.undoToken) throw new Error('Undo Token Missing');
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }

    // 2. Policy Block (Invalid Path)
    try {
        await toolRegistry.executeTool('execute_auto_organize', {
            sourcePath: 'system://core/kernel.js', // FORBIDDEN
            targetPath: 'user://documents/kernel.js'
        }, {
            appId: 'core.files', correlationId: 'attack-1', userId: 'system-auto'
        });
        console.error('❌ Failed: Should have blocked system path');
    } catch (e: any) {
        if (e.message.includes('POLICY DENIED')) {
            console.log('✅ Policy Blocked System Path:', e.message);
        } else {
            console.error('❌ Unexpected Error:', e.message);
        }
    }
}

verifyUserDataAutomation().catch(console.error);
