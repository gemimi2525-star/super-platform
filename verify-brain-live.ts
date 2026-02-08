/**
 * Verification Script for Phase 26: OpenAI Brain Live
 * 
 * Simulates:
 * 1. Live Chat (check if OpenAI or Mock)
 * 2. Tool Execution via Live Provider
 */

import { brainGateway } from './coreos/brain/gateway';
import { BrainRequest } from './coreos/brain/types';

// Set Env for Testing (Simulated)
process.env.BRAIN_PROVIDER = 'openai';
// process.env.OPENAI_API_KEY = 'sk-...'; // In real usage, this must be set

export async function verifyBrainLive() {
    console.log('🧠 Starting Brain Live Verification...\n');
    console.log(`   Provider Config: ${process.env.BRAIN_PROVIDER}`);
    console.log(`   Has Key: ${!!process.env.OPENAI_API_KEY}`);

    // Scenario 1: Basic Chat
    console.log('\n--- 1. Basic Chat ---');
    const chatReq: BrainRequest = {
        appId: 'com.test.live',
        correlationId: 'req-live-001',
        messages: [{ role: 'user', content: 'What is your purpose?' }],
        userId: 'admin'
    };

    try {
        const res = await brainGateway.processRequest(chatReq);
        console.log(`✅ Response: ${res.content}`);
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }

    // Scenario 2: Tool Calling (Live)
    // We expect the LLM to call 'draft_intent_from_text'
    console.log('\n--- 2. Tool Calling (Intent) ---');
    const toolReq: BrainRequest = {
        appId: 'com.test.live',
        correlationId: 'req-live-002',
        messages: [
            { role: 'user', content: 'Please draft an invoice for $500 USD to Client A.' }
        ],
        userId: 'admin'
    };

    try {
        const res = await brainGateway.processRequest(toolReq);
        console.log(`✅ Final Output: ${res.content}`);

        // If it was mock/scaffold, it has specific text. If OpenAI, it will be variable.
        if (res.content?.includes("Tool Result")) {
            console.log('   ✅ Tool executed and result info present.');
        }
    } catch (e: any) {
        console.error('❌ Failed:', e.message);
    }
}

// Execute
verifyBrainLive().catch(console.error);
