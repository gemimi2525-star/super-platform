import { toolRegistry } from './coreos/brain/registry';

async function verifyQuota() {
    console.log('🛑 Verifying Quota Enforcement (Phase 28)...');

    // Reset first
    await toolRegistry.executeTool('admin_reset_quota', {}, { appId: 'system', correlationId: 'reset', userId: 'admin' });

    // Spam requests to exceed quota (Limit is 50)
    console.log('Generating load...');
    let blocked = false;
    for (let i = 0; i < 60; i++) {
        try {
            await toolRegistry.executeTool('execute_auto_organize', {
                sourcePath: `user://documents/file_${i}.txt`,
                targetPath: `user://documents/archive/file_${i}.txt`
            }, {
                appId: 'core.files', correlationId: `load-${i}`, userId: 'system-auto'
            });
        } catch (e: any) {
            if (e.message.includes('QUOTA EXCEEDED')) {
                console.log(`✅ Quota Limit Hit at request #${i + 1}:`, e.message);
                blocked = true;
                break;
            }
        }
    }

    if (!blocked) console.error('❌ Failed: Quota did not trigger!');
}

verifyQuota().catch(console.error);
