/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN GATEWAY (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The central entry point for all AI interactions in Core OS.
 * - Routes requests to provider (Mock for now)
 * - Enforces Rate Limits
 * - Integrates Audit Logging
 * 
 * @module coreos/brain/gateway
 */

import { BrainRequest, BrainResponse, BrainStatus } from './types';
import { toolRegistry } from './registry';
import { safetyGate } from './shield';

import { OpenAIProvider } from './providers/openai';

// Factory for Providers
const getProvider = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    // Auto-detect OpenAI if key is present, OR if explicitly set to openai
    // This allows "just works" behavior when key is added to Vercel
    if (apiKey && (!process.env.BRAIN_PROVIDER || process.env.BRAIN_PROVIDER === 'openai')) {
        console.log('[Brain] Factory: Instantiating OpenAIProvider');
        return new OpenAIProvider(apiKey);
    }

    console.log('[Brain] Factory: Fallback to MockProvider (Missing Key or Provider mismatch)');
    return null; // Fallback to Mock
};

class BrainGateway {
    private status: BrainStatus = 'idle';

    /**
     * Process a request from an App Integration
     */
    async processRequest(request: BrainRequest): Promise<BrainResponse> {
        console.log(`[Brain] Processing request from ${request.appId} (${request.correlationId})`);

        // 1. Audit Log (Request)
        this.auditLog(request.correlationId, 'brain.requested', { appId: request.appId, input_length: request.messages.length });

        // 2. Pre-flight Safety Check
        const safetyCheck = safetyGate.checkPreFlight(request);
        if (!safetyCheck.safe) {
            this.auditLog(request.correlationId, 'brain.blocked', { reason: safetyCheck.reason });
            throw new Error(`Safety Block: ${safetyCheck.reason}`);
        }

        // 3. Shadow / Assist Mode Enforcement
        // Phase 26.2A: "Assist Mode" is when we want AI to propose but NOT execute.
        // We detect this via explicit flag or context. For now, we reuse 'shadow' as 'read-only/propose-only'.
        const isSafeMode = request.shadow;

        if (isSafeMode) {
            console.log(`[Brain] 🛡️ SAFE MODE (Shadow/Assist): ${request.appId}`);
            this.auditLog(request.correlationId, 'brain.safe_mode_invoked', { appId: request.appId });

            // Inject System Prompt Override
            request.messages.unshift({
                role: 'system',
                content: `[SAFE MODE] You are an assistant that PROPOSES actions but DOES NOT execute them.
                1. USE 'propose_*' tools to suggest actions.
                2. DO NOT USE 'execute_*' or 'delete_*' tools directly.
                3. PROVIDE clear reasoning for your proposals.`
            });
        }

        this.status = 'processing';

        try {
            let response: BrainResponse;
            const provider = getProvider();

            if (provider) {
                console.log(`[Brain] Using OpenAI Provider`);
                let tools = toolRegistry.getAllTools();

                // In Safe Mode, we technically allow the LLM to SEE the tools, 
                // but we will BLOCK the execution middleware if it tries to use them.
                // However, to guide the LLM, we might want to filter the visible tools too.
                // For Phase 26.2A, we allow seeing 'propose_*' and 'execute_*' (so it knows what it *could* do),
                // but we strictly enforce the block at execution time.

                response = await provider.processRequest(request, tools);
            } else {
                console.log(`[Brain] Using Mock Provider`);
                response = await this.mockProvider(request);
            }

            // 4. Handle Tool Calls (if any)
            if (response.tool_calls && response.tool_calls.length > 0) {
                for (const toolCall of response.tool_calls) {
                    const toolName = toolCall.function.name;

                    // 🛑 SAFETY GATE: Block Destructive Tools in Safe Mode
                    // Allowed: explain_*, search_*, propose_*
                    // Blocked: execute_*, delete_*, install_*, update_*
                    const isDestructive = toolName.startsWith('execute_') ||
                        toolName.startsWith('delete_') ||
                        toolName.startsWith('install_') ||
                        toolName.startsWith('update_');

                    if (isSafeMode && isDestructive) {
                        console.warn(`[Brain] 🛑 Safe Mode Blocked Tool Call: ${toolName}`);
                        this.auditLog(request.correlationId, 'brain.assist_blocked', { tool: toolName });
                        response.content = (response.content || '') + `\n[System]: Tool call '${toolName}' blocked in Safe Mode. Please use 'propose_*' tools instead.`;
                        continue;
                    }

                    // ... (rest of tool execution logic)
                    let toolArgs = {};
                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments);
                    } catch (e) {
                        console.error(`[Brain] Failed to parse tool args: ${toolCall.function.arguments}`);
                        continue;
                    }

                    console.log(`[Brain] Tool Call: ${toolName}`);

                    // Audit Tool Call
                    if (toolName.startsWith('propose_')) {
                        this.auditLog(request.correlationId, 'brain.assist_proposed', { tool: toolName });
                    } else {
                        this.auditLog(request.correlationId, 'brain.tool_called', { tool: toolName });
                    }

                    // Execute Tool via Registry
                    const result = await toolRegistry.executeTool(toolName, toolArgs, {
                        appId: request.appId,
                        userId: request.userId || 'system',
                        correlationId: request.correlationId
                    });

                    // In a real loop, we'd feed this result back to LLM.
                    // For scaffold/v1, we just append result to content/context
                    response.content = (response.content || '') + `\n\n[Tool Result (${toolName})]:\n${JSON.stringify(result, null, 2)}`;
                }
            }

            // 5. Audit Log (Response)
            this.auditLog(request.correlationId, 'brain.completed', { output_length: response.content?.length });
            this.status = 'idle';
            return response;

        } catch (error: any) {
            this.status = 'error';
            this.auditLog(request.correlationId, 'brain.error', { error: error.message });
            throw error;
        }
    }

    private async mockProvider(request: BrainRequest): Promise<BrainResponse> {
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 500));

        const lastMessage = request.messages[request.messages.length - 1];

        // Simple Intent Recognition for Testing
        if (lastMessage.content.includes("verify document")) {
            return {
                id: `resp-${Date.now()}`,
                content: "I will verify this document for compliance.",
                tool_calls: [
                    {
                        id: `call-${Date.now()}`,
                        type: 'function',
                        function: {
                            name: 'validate_document_compliance',
                            arguments: JSON.stringify({ documentId: 'doc-123', standard: 'ISO-27001' })
                        }
                    }
                ],
                usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 }
            };
        }

        return {
            id: `resp-${Date.now()}`,
            content: `[Brain Scaffold] Received: "${lastMessage.content}". System is ready for LLM integration.`,
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
        };
    }

    private auditLog(correlationId: string, event: string, metadata: any) {
        console.log(`[Audit] ${correlationId} | ${event} | ${JSON.stringify(metadata)}`);
        // In real system, push to SYNAPSE/AuditService
    }
}

export const brainGateway = new BrainGateway();
