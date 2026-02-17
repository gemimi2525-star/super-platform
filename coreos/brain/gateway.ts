/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN GATEWAY (Phase 25A → Phase 21B ADAPTER)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The central entry point for all AI interactions in Core OS.
 * - Routes requests to LLMProvider (vendor-neutral)
 * - Enforces Rate Limits
 * - Integrates Audit Logging
 *
 * Phase 19: DRAFTER MODE — AI can propose within app scope
 * Phase 20: AGENT MODE — AI can execute approved actions (core.notes only)
 * Phase 21B: ADAPTER LAYER — provider-agnostic via LLMProvider interface
 *
 * @module coreos/brain/gateway
 */

import { BrainRequest, BrainResponse, BrainStatus } from './types';
import { toolRegistry } from './registry';
import { safetyGate } from './shield';
import { trustEngine, TrustTier } from './trust';
import { SYSTEM_PROMPT } from './prompts';

import { LLMProvider, LLMInput, LLMMessage, LLMToolDef, hashArguments } from './providers/types';
import { OpenAIAdapter } from './providers/openai';
import { MockAdapter } from './providers/mock';

// Phase 35C: Runtime Isolation Level 2
import { evaluateExecutionPolicy } from './policy/policyEngine';
import { toolFirewall } from './policy/toolFirewall';
import { workerGuard } from './policy/workerGuard';
import { classifyTool } from './policy/policyMatrix';
import type { PolicyInput } from './policy/policyTypes';
import { randomUUID } from 'crypto';

// Phase 35D: Autonomous Governance Enforcement
import { governanceReactionEngine } from './policy/governanceReactionEngine';

/**
 * Phase 21B: Provider resolution — returns LLMProvider interface.
 * Orchestrator NEVER touches vendor SDK directly.
 */
function resolveProvider(): LLMProvider {
    const apiKey = process.env.OPENAI_API_KEY;
    const providerConfig = process.env.BRAIN_PROVIDER || 'mock';

    if (apiKey && providerConfig === 'openai') {
        console.log('[Brain] Factory: Instantiating OpenAIAdapter');
        return new OpenAIAdapter(apiKey);
    }

    console.log('[Brain] Factory: Fallback to MockAdapter');
    return new MockAdapter();
}

class BrainGateway {
    private status: BrainStatus = 'idle';

    /**
     * Process a request from an App Integration
     * 
     * Phase 19: DRAFTER MODE — AI can propose within app scope
     * Phase 20: AGENT MODE — AI can execute approved actions (core.notes)
     *           shadow=true still enforced for non-approved paths
     */
    async processRequest(request: BrainRequest): Promise<BrainResponse> {
        console.log(`[Brain] Processing request from ${request.appId} (${request.correlationId})`);

        // ═══════════════════════════════════════════════════════════════
        // PHASE 18/19 GATE: Reject non-shadow requests
        // Defense-in-depth — route.ts also forces shadow=true
        // ═══════════════════════════════════════════════════════════════
        if (!request.shadow) {
            console.error(`[Brain] 🛑 Phase 20 BLOCK: shadow=false rejected for ${request.appId}`);
            this.auditLog(request.correlationId, 'brain.phase20_blocked', {
                appId: request.appId,
                reason: 'Phase 20: shadow mode is mandatory (non-approved paths)'
            });
            throw new Error('Phase 20: AI Brain is in shadow mode. shadow=true is required.');
        }

        // ═══════════════════════════════════════════════════════════════
        // PHASE 19: Trust Tier Check
        // ═══════════════════════════════════════════════════════════════
        const appScope = request.appScope || request.appId;
        const effectiveTier = trustEngine.getTierForApp(appScope);
        const trustScore = trustEngine.getScore();

        console.log(`[Brain] Trust: score=${trustScore} tier=${effectiveTier} app=${appScope}`);
        this.auditLog(request.correlationId, 'brain.trust_check', {
            appId: request.appId,
            appScope,
            effectiveTier,
            trustScore,
        });

        // 1. Audit Log (Request)
        this.auditLog(request.correlationId, 'brain.requested', { appId: request.appId, input_length: request.messages.length });

        // 2. Pre-flight Safety Check
        const safetyCheck = safetyGate.checkPreFlight(request);
        if (!safetyCheck.safe) {
            this.auditLog(request.correlationId, 'brain.blocked', { reason: safetyCheck.reason });
            throw new Error(`Safety Block: ${safetyCheck.reason}`);
        }

        // 3. Phase 19/20: Mode-based System Prompt Injection
        const isAgentMode = effectiveTier === TrustTier.AGENT && trustEngine.isAppExecuteAllowed(appScope);
        const isDrafterMode = !isAgentMode && (effectiveTier === TrustTier.DRAFTER || effectiveTier === TrustTier.AGENT);

        if (isAgentMode) {
            // Phase 20: AGENT MODE — can execute approved actions
            console.log(`[Brain] 🤖 AGENT MODE: ${appScope}`);
            this.auditLog(request.correlationId, 'brain.agent_mode', { appScope });

            request.messages.unshift({
                role: 'system',
                content: `[AGENT MODE — Phase 20] คุณเป็น AI ที่สามารถ "ดำเนินการ" ได้ ภายใต้การอนุมัติจากผู้ใช้
App Context: ${appScope}
Trust Score: ${trustScore} | Tier: ${effectiveTier}

กฎ Phase 20:
1. ใช้ 'propose_*' เพื่อเสนอแนะ
2. ใช้ 'apply_*' เพื่อดำเนินการ (ต้องมี Signed Approval)
3. ทุกการ execute ต้องผ่าน 4 ขั้นตอน: Approval → Snapshot → Execute → Audit
4. ผู้ใช้ต้องยืนยันก่อนดำเนินการทุกครั้ง
5. ทำงานเฉพาะภายใน ${appScope} เท่านั้น
6. ห้ามข้ามขอบเขต app เด็ดขาด`
            });
        } else if (isDrafterMode && trustEngine.isAppDrafterAllowed(appScope)) {
            console.log(`[Brain] 📝 DRAFTER MODE: ${appScope}`);
            this.auditLog(request.correlationId, 'brain.drafter_mode', { appScope });

            request.messages.unshift({
                role: 'system',
                content: `[DRAFTER MODE — Phase 19] คุณเป็น AI ที่ "เสนอแนะ" ได้ แต่ "ลงมือทำ" ไม่ได้
App Context: ${appScope}
Trust Score: ${trustScore} | Tier: ${effectiveTier}

กฎ:
1. ใช้เฉพาะ 'propose_*' และ 'read_*' tools
2. ห้ามใช้ 'execute_*', 'delete_*', 'write_*' เด็ดขาด
3. ทุก proposal ต้องมีคำอธิบายและ preview
4. ผู้ใช้ต้องกดยืนยันก่อนดำเนินการทุกครั้ง
5. ทำงานเฉพาะภายในขอบเขตของ ${appScope} เท่านั้น`
            });
        } else {
            // OBSERVER mode (fallback)
            console.log(`[Brain] 🔍 OBSERVER MODE: ${appScope}`);
            request.messages.unshift({
                role: 'system',
                content: `[OBSERVER MODE] You are an assistant that can READ and EXPLAIN only.
1. USE 'read_*' and 'explain_*' tools.
2. DO NOT USE 'execute_*', 'delete_*', or 'propose_*' tools.
3. PROVIDE clear explanations of system state.`
            });
        }

        this.status = 'processing';

        try {
            // ═══════════════════════════════════════════════════════════
            // Phase 21B: Provider-Agnostic LLM Call
            // ═══════════════════════════════════════════════════════════
            const provider: LLMProvider = resolveProvider();
            console.log(`[Brain] Using provider: ${provider.providerId} (${provider.modelId})`);

            // Phase 19: Filter tools by trust tier and app scope
            let tools = toolRegistry.getAllTools();
            if (effectiveTier === TrustTier.OBSERVER) {
                tools = tools.filter(t =>
                    t.name.startsWith('read_') ||
                    t.name.startsWith('explain_') ||
                    t.name.startsWith('search_')
                );
            } else if (effectiveTier === TrustTier.DRAFTER) {
                tools = tools.filter(t =>
                    t.name.startsWith('read_') ||
                    t.name.startsWith('explain_') ||
                    t.name.startsWith('search_') ||
                    t.name.startsWith('propose_') ||
                    t.name.startsWith('validate_') ||
                    t.name.startsWith('draft_')
                );
            } else if (effectiveTier === TrustTier.AGENT && trustEngine.isAppExecuteAllowed(appScope)) {
                tools = tools.filter(t =>
                    t.name.startsWith('read_') ||
                    t.name.startsWith('explain_') ||
                    t.name.startsWith('search_') ||
                    t.name.startsWith('propose_') ||
                    t.name.startsWith('validate_') ||
                    t.name.startsWith('draft_') ||
                    t.name.startsWith('apply_')
                );
            }

            // Build LLMInput (vendor-neutral)
            const llmInput: LLMInput = {
                messages: request.messages.map(m => ({
                    role: m.role as LLMMessage['role'],
                    content: m.content,
                    name: m.name,
                    toolCallId: m.tool_call_id,
                })),
                tools: tools.map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                })),
                temperature: 0.2,
                metadata: {
                    correlationId: request.correlationId,
                    appScope,
                    trustTier: effectiveTier,
                },
            };

            // Prepend system prompt for live providers (mock handles its own)
            if (provider.providerId !== 'mock') {
                llmInput.messages.unshift({
                    role: 'system',
                    content: SYSTEM_PROMPT,
                });
                if (request.context) {
                    llmInput.messages.push({
                        role: 'system',
                        content: `Current Context: ${JSON.stringify(request.context)}`,
                    });
                }
            }

            // Call provider via LLMProvider interface
            const llmOutput = await provider.generate(llmInput);

            // Map LLMOutput → BrainResponse
            const response: BrainResponse = {
                id: llmOutput.providerMeta.requestId || `resp-${Date.now()}`,
                content: llmOutput.content,
                tool_calls: llmOutput.toolCalls.map(tc => ({
                    id: tc.callId,
                    type: 'function' as const,
                    function: {
                        name: tc.toolName,
                        arguments: JSON.stringify(tc.arguments),
                    },
                })),
                usage: {
                    prompt_tokens: llmOutput.usage.promptTokens,
                    completion_tokens: llmOutput.usage.completionTokens,
                    total_tokens: llmOutput.usage.totalTokens,
                },
            };

            // Phase 21B: Audit provider metadata
            this.auditLog(request.correlationId, 'brain.provider_response', {
                provider: llmOutput.providerMeta.providerId,
                model: llmOutput.providerMeta.modelId,
                latencyMs: llmOutput.providerMeta.latencyMs,
                toolCallCount: llmOutput.toolCalls.length,
                toolCallHashes: llmOutput.toolCalls.map(tc => ({
                    toolName: tc.toolName,
                    argumentsHash: tc.argumentsHash,
                })),
                usage: llmOutput.usage,
            });

            // 4. Handle Tool Calls (if any)
            if (response.tool_calls && response.tool_calls.length > 0) {
                // ═══════════════════════════════════════════════════════
                // PHASE 35D: PRE-FLIGHT GOVERNANCE CHECK
                // ═══════════════════════════════════════════════════════
                const govCheck = governanceReactionEngine.isExecutionAllowed();
                if (!govCheck.allowed) {
                    console.warn(`[Brain] 🧊 Phase 35D Governance Block: ${govCheck.reason}`);
                    this.auditLog(request.correlationId, 'brain.phase35d_governance_block', {
                        reason: govCheck.reason,
                        mode: governanceReactionEngine.getState().mode,
                    });
                    response.content = (response.content || '') +
                        `\n[System]: All tool execution suspended — Governance enforcement: ${govCheck.reason}`;
                    // Skip ALL tool calls
                    response.tool_calls = [];
                }

                for (const toolCall of response.tool_calls) {
                    const toolName = toolCall.function.name;

                    // 🛑 PHASE 18 SAFETY GATE: Block via Shield prefix check
                    const toolCheck = safetyGate.checkToolAllowed(toolName);
                    if (!toolCheck.safe) {
                        console.warn(`[Brain] 🛑 Phase 18 Shield Blocked: ${toolName} — ${toolCheck.reason}`);
                        this.auditLog(request.correlationId, 'brain.phase18_tool_blocked', { tool: toolName, reason: toolCheck.reason });
                        response.content = (response.content || '') + `\n[System]: Tool '${toolName}' blocked by Phase 18 Observer Mode.`;
                        continue;
                    }

                    // 🛑 PHASE 19: DRAFTER App-Scope Check
                    const drafterCheck = safetyGate.checkDrafterAccess(toolName, appScope);
                    if (!drafterCheck.safe) {
                        console.warn(`[Brain] 🛑 Phase 19 Drafter Blocked: ${toolName} — ${drafterCheck.reason}`);
                        this.auditLog(request.correlationId, 'brain.phase19_drafter_blocked', { tool: toolName, reason: drafterCheck.reason });
                        response.content = (response.content || '') + `\n[System]: Tool '${toolName}' blocked — ${drafterCheck.reason}`;
                        continue;
                    }

                    // 🛑 PHASE 20: EXECUTE Access Check (apply_* tools)
                    const executeCheck = safetyGate.checkExecuteAccess(toolName, appScope);
                    if (!executeCheck.safe) {
                        console.warn(`[Brain] 🛑 Phase 20 Execute Blocked: ${toolName} — ${executeCheck.reason}`);
                        this.auditLog(request.correlationId, 'brain.phase20_execute_blocked', { tool: toolName, reason: executeCheck.reason });
                        response.content = (response.content || '') + `\n[System]: Tool '${toolName}' blocked — ${executeCheck.reason}`;
                        continue;
                    }

                    // 🛑 SAFE MODE GATE: Block Destructive Tools (legacy check)
                    const isDestructive = toolName.startsWith('execute_') ||
                        toolName.startsWith('delete_') ||
                        toolName.startsWith('install_') ||
                        toolName.startsWith('update_');

                    if (isDestructive) {
                        console.warn(`[Brain] 🛑 Safe Mode Blocked Tool Call: ${toolName}`);
                        this.auditLog(request.correlationId, 'brain.assist_blocked', { tool: toolName });
                        response.content = (response.content || '') + `\n[System]: Tool call '${toolName}' blocked in Safe Mode. Please use 'propose_*' tools instead.`;
                        continue;
                    }

                    let toolArgs: Record<string, any> = {};
                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments);
                    } catch (e) {
                        console.error(`[Brain] Failed to parse tool args: ${toolCall.function.arguments}`);
                        continue;
                    }

                    // ═══════════════════════════════════════════════════════
                    // PHASE 35C: RUNTIME POLICY ENGINE (Layer 1 — Gateway)
                    // ═══════════════════════════════════════════════════════

                    // 35C-1: Tool Firewall (normalize + hash + allowlist)
                    const firewallResult = toolFirewall.check(toolName, toolArgs, appScope);
                    if (!firewallResult.allowed) {
                        console.warn(`[Brain] 🔥 Phase 35C Firewall Blocked: ${toolName} — ${firewallResult.blockReason}`);
                        this.auditLog(request.correlationId, 'brain.phase35c_firewall_blocked', {
                            tool: toolName, reason: firewallResult.blockReason, checks: firewallResult.checks,
                        });
                        response.content = (response.content || '') + `\n[System]: Tool '${toolName}' blocked by Runtime Firewall — ${firewallResult.blockReason}`;
                        continue;
                    }

                    // 35C-2: Policy Engine (9-rule chain)
                    const nonce = randomUUID();
                    const { actionType } = classifyTool(toolName);
                    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

                    const policyInput: PolicyInput = {
                        toolName: firewallResult.normalizedToolName,
                        actionType,
                        appScope,
                        actorRole: (request as any).actorRole || 'owner',
                        environment: isProduction ? 'production' : 'preview',
                        requestSource: 'browser',
                        nonce,
                        argsHash: firewallResult.computedArgsHash,
                        approvalArgsHash: (request as any).approvalArgsHash,
                        correlationId: request.correlationId,
                        timestamp: Date.now(),
                    };

                    const policyDecision = evaluateExecutionPolicy(policyInput);

                    this.auditLog(request.correlationId, 'brain.phase35c_policy_eval', {
                        tool: toolName,
                        decision: policyDecision.decision,
                        riskLevel: policyDecision.riskLevel,
                        reasons: policyDecision.reasons.filter(r => r.blocking),
                        nonce: nonce.substring(0, 8),
                    });

                    if (policyDecision.decision !== 'ALLOW') {
                        console.warn(`[Brain] 🛑 Phase 35C Policy: ${toolName} → ${policyDecision.decision}`);

                        // Phase 35D: Feed violation into governance reaction engine
                        governanceReactionEngine.recordPolicyDeny();

                        response.content = (response.content || '') +
                            `\n[System]: Tool '${toolName}' ${policyDecision.decision} by Runtime Policy Engine` +
                            ` (${policyDecision.reasons.filter(r => r.blocking).map(r => r.message).join('; ')})`;
                        continue;
                    }

                    // 35C-3: Worker Guard (Layer 2 — defense-in-depth)
                    const guardResult = workerGuard.verify({
                        toolName: firewallResult.normalizedToolName,
                        nonce,
                        scopeToken: appScope,
                        argsHash: firewallResult.computedArgsHash,
                        approvalArgsHash: (request as any).approvalArgsHash,
                        policyDecision: policyDecision.decision,
                        correlationId: request.correlationId,
                    });

                    if (!guardResult.permitted) {
                        console.warn(`[Brain] 🛡️ Phase 35C Guard Blocked: ${toolName} — ${guardResult.blockReason}`);
                        this.auditLog(request.correlationId, 'brain.phase35c_guard_blocked', {
                            tool: toolName, reason: guardResult.blockReason, checks: guardResult.checks,
                        });
                        response.content = (response.content || '') + `\n[System]: Tool '${toolName}' blocked by Worker Guard — ${guardResult.blockReason}`;
                        continue;
                    }

                    console.log(`[Brain] ✅ Phase 35C ALLOW: ${toolName} (nonce=${nonce.substring(0, 8)})`);

                    // Audit Tool Call
                    if (toolName.startsWith('propose_')) {
                        this.auditLog(request.correlationId, 'brain.drafter_proposed', { tool: toolName, appScope });
                        trustEngine.reportOutcome(true, 'proposal');
                    } else {
                        this.auditLog(request.correlationId, 'brain.tool_called', { tool: toolName });
                    }

                    // Execute Tool via Registry (with policy context)
                    const result = await toolRegistry.executeTool(toolName, toolArgs, {
                        appId: request.appId,
                        userId: request.userId || 'system',
                        correlationId: request.correlationId,
                        appScope,
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

    private auditLog(correlationId: string, event: string, metadata: any) {
        console.log(`[Audit] ${correlationId} | ${event} | ${JSON.stringify(metadata)}`);
        // In real system, push to SYNAPSE/AuditService
    }
}

export const brainGateway = new BrainGateway();
