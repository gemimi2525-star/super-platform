import { toolRegistry } from './coreos/brain/registry';

async function verifyControlPlane() {
    console.log('🏢 Verifying Enterprise Control Plane (Phase 31A)...');

    // 1. Admin Disables Finance AI
    await toolRegistry.executeTool('admin_configure_dept', {
        deptId: 'finance', aiEnabled: false
    }, { appId: 'system', correlationId: 'adm-1', userId: 'admin' });
    console.log('Admin disabled Finance AI.');

    // 2. Attempt to use Accounting AI (Should Fail)
    try {
        await toolRegistry.executeTool('execute_create_accounting_draft', {
            sourceDoc: 'doc.pdf', data: {}
        }, { appId: 'core.files', correlationId: 'fail-cp', userId: 'ai' });
        console.error('❌ Failed: Should have been blocked by Control Plane');
    } catch (e: any) {
        if (e.message.includes('POLICY BLOCK')) {
            console.log('✅ Control Plane Blocked Execution:', e.message);
        }
    }

    // 3. Re-enable
    await toolRegistry.executeTool('admin_configure_dept', {
        deptId: 'finance', aiEnabled: true
    }, { appId: 'system', correlationId: 'adm-2', userId: 'admin' });
    console.log('Admin re-enabled Finance AI.');
}

verifyControlPlane().catch(console.error);
