/**
 * Verification Script for Phase 26.1.x: Shadow Expansion
 * 
 * Objectives:
 * 1. Verify App Store "Explain" functionality.
 * 2. Verify File Explorer file listing and "Explain" capability.
 */

import { brainGateway } from './coreos/brain/gateway';
import { BrainRequest } from './coreos/brain/types';

process.env.BRAIN_PROVIDER = 'openai';

export async function verifyShadowExpansion() {
    console.log('🌑 Starting Shadow Expansion Verification...\n');

    // Scenario 1: App Store Explain
    console.log('\n--- 1. App Store Explain ---');
    const appExplainReq: BrainRequest = {
        appId: 'core.store',
        correlationId: 'req-store-explain-001',
        messages: [{ role: 'user', content: 'Explain permissions for App X' }],
        userId: 'user',
        shadow: true, // Shadow Mode
        context: { app: 'App X', trust: 2 }
    };

    try {
        const res = await brainGateway.processRequest(appExplainReq);
        console.log(`✅ App Store Response: ${res.content}`);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }

    // Scenario 2: File Explorer Explain
    console.log('\n--- 2. File Explorer Explain ---');
    const fileExplainReq: BrainRequest = {
        appId: 'core.files',
        correlationId: 'req-file-explain-001',
        messages: [{ role: 'user', content: 'Summarize budget.xlsx' }],
        userId: 'user',
        shadow: true, // Shadow Mode
        context: { file: 'budget.xlsx' }
    };

    try {
        const res = await brainGateway.processRequest(fileExplainReq);
        console.log(`✅ File Explorer Response: ${res.content}`);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

verifyShadowExpansion().catch(console.error);
