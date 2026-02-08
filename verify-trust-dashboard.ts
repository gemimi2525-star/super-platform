import { toolRegistry } from './coreos/brain/registry';

async function verifyTrust() {
    console.log('📊 Verifying Trust Dashboard (Phase 33A)...');

    // 1. Simulate Success (Approve)
    await toolRegistry.executeTool('execute_feedback_loop', { outcome: 'APPROVE' }, { appId: 'app', correlationId: 'f1', userId: 'user' });

    let metrics = await toolRegistry.executeTool('admin_get_trust_metrics', {}, { appId: 'system', correlationId: 'm1', userId: 'admin' });
    console.log('Metrics after Approval:', metrics);

    if (metrics.trustScore < 90) throw new Error('Trust Score should be high');

    // 2. Simulate Failure (Reject)
    await toolRegistry.executeTool('execute_feedback_loop', { outcome: 'REJECT' }, { appId: 'app', correlationId: 'f2', userId: 'user' });
    await toolRegistry.executeTool('execute_feedback_loop', { outcome: 'REJECT' }, { appId: 'app', correlationId: 'f3', userId: 'user' });

    metrics = await toolRegistry.executeTool('admin_get_trust_metrics', {}, { appId: 'system', correlationId: 'm2', userId: 'admin' });
    console.log('Metrics after Rejections:', metrics);

    if (metrics.trustScore === 100) throw new Error('Trust Score should have dropped');
    console.log('✅ Trust Score responds to feedback');
}

verifyTrust().catch(console.error);
