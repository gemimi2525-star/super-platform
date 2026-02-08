import { toolRegistry } from './coreos/brain/registry';

async function verifyAccountingSafety() {
    console.log('🚫 Verifying Accounting Safety (Phase 29B)...');

    try {
        await toolRegistry.executeTool('execute_accounting_post', {}, {
            appId: 'core.finance', correlationId: 'attack-acc', userId: 'ai'
        });
        console.error('❌ Critical: AI posted to ledger!');
    } catch (e: any) {
        if (e.message.includes('SAFETY BLOCK')) {
            console.log('✅ Safety Block Triggered:', e.message);
        } else {
            console.error('❌ Unexpected Error:', e.message);
        }
    }
}

verifyAccountingSafety().catch(console.error);
