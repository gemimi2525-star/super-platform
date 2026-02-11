/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN GATEWAY (Phase 25A → Phase 19 DRAFTER)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The central entry point for all AI interactions in Core OS.
 * - Routes requests to provider (Mock for now)
 * - Enforces Rate Limits
 * - Integrates Audit Logging
 * 
 * Phase 19: DRAFTER MODE — AI can propose within app scope
 *           shadow=true still enforced, execute_* still blocked
 * 
 * @module coreos/brain/gateway
 */

import { BrainRequest, BrainResponse, BrainStatus } from './types';
import { toolRegistry } from './registry';
import { safetyGate } from './shield';
import { trustEngine, TrustTier } from './trust';

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
     * 
     * Phase 19: DRAFTER MODE — AI can propose within app scope
     * shadow=true still enforced. Only propose_* and read_* tools allowed.
     */
    async processRequest(request: BrainRequest): Promise<BrainResponse> {
        console.log(`[Brain] Processing request from ${request.appId} (${request.correlationId})`);

        // ═══════════════════════════════════════════════════════════════
        // PHASE 18/19 GATE: Reject non-shadow requests
        // Defense-in-depth — route.ts also forces shadow=true
        // ═══════════════════════════════════════════════════════════════
        if (!request.shadow) {
            console.error(`[Brain] 🛑 Phase 19 BLOCK: shadow=false rejected for ${request.appId}`);
            this.auditLog(request.correlationId, 'brain.phase19_blocked', {
                appId: request.appId,
                reason: 'Phase 19: shadow mode is mandatory (DRAFTER cannot execute)'
            });
            throw new Error('Phase 19: AI Brain is in DRAFTER mode. shadow=true is required.');
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

        // 3. Phase 19: DRAFTER Mode System Prompt Injection
        const isDrafterMode = effectiveTier === TrustTier.DRAFTER || effectiveTier === TrustTier.AGENT;

        if (isDrafterMode && trustEngine.isAppDrafterAllowed(appScope)) {
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
            let response: BrainResponse;
            const provider = getProvider();

            if (provider) {
                console.log(`[Brain] Using OpenAI Provider`);
                let tools = toolRegistry.getAllTools();

                // Phase 19: Filter tools by trust tier and app scope
                if (effectiveTier === TrustTier.OBSERVER) {
                    // OBSERVER: only read_*, explain_*, search_* tools
                    tools = tools.filter(t =>
                        t.name.startsWith('read_') ||
                        t.name.startsWith('explain_') ||
                        t.name.startsWith('search_')
                    );
                } else if (effectiveTier === TrustTier.DRAFTER) {
                    // DRAFTER: read_* + explain_* + propose_* (scoped to app)
                    tools = tools.filter(t =>
                        t.name.startsWith('read_') ||
                        t.name.startsWith('explain_') ||
                        t.name.startsWith('search_') ||
                        t.name.startsWith('propose_') ||
                        t.name.startsWith('validate_') ||
                        t.name.startsWith('draft_')
                    );
                }

                response = await provider.processRequest(request, tools);
            } else {
                console.log(`[Brain] Using Mock Provider`);
                response = await this.mockProvider(request, appScope, effectiveTier);
            }

            // 4. Handle Tool Calls (if any)
            if (response.tool_calls && response.tool_calls.length > 0) {
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
                        this.auditLog(request.correlationId, 'brain.drafter_proposed', { tool: toolName, appScope });
                        trustEngine.reportOutcome(true, 'proposal');
                    } else {
                        this.auditLog(request.correlationId, 'brain.tool_called', { tool: toolName });
                    }

                    // Execute Tool via Registry
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

    /**
     * Phase 19: Smart Mock Provider with DRAFTER awareness
     */
    private async mockProvider(request: BrainRequest, appScope: string, tier: TrustTier): Promise<BrainResponse> {
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 500));

        const lastMessage = request.messages[request.messages.length - 1];
        const content = lastMessage.content.toLowerCase();

        // Phase 19: DRAFTER Mock — return proposal-style responses
        if (tier === TrustTier.DRAFTER || tier === TrustTier.AGENT) {
            // Notes proposals
            if (appScope === 'core.notes') {
                if (content.includes('สรุป') || content.includes('summarize') || content.includes('summary')) {
                    return {
                        id: `resp-${Date.now()}`,
                        content: JSON.stringify({
                            type: 'proposal',
                            proposal: {
                                id: `prop-${Date.now()}`,
                                type: 'summarize',
                                appId: 'core.notes',
                                title: '📝 สรุปเนื้อหา Note',
                                description: 'AI เสนอสรุปเนื้อหา Note ของคุณ ให้กระชับและอ่านง่ายขึ้น',
                                preview: 'ตัวอย่างสรุป: เนื้อหาหลักประกอบด้วย 3 หัวข้อ — (1) การตั้งค่าระบบ (2) การจัดการสิทธิ์ (3) การตรวจสอบ Audit Log',
                                confidence: 0.85,
                                requiresConfirm: true,
                            }
                        }),
                        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
                    };
                }
                if (content.includes('เขียนใหม่') || content.includes('rewrite')) {
                    return {
                        id: `resp-${Date.now()}`,
                        content: JSON.stringify({
                            type: 'proposal',
                            proposal: {
                                id: `prop-${Date.now()}`,
                                type: 'rewrite',
                                appId: 'core.notes',
                                title: '✏️ เขียนเนื้อหาใหม่',
                                description: 'AI เสนอเขียนเนื้อหาใหม่ให้ชัดเจนและเป็นระเบียบมากขึ้น',
                                preview: 'ตัวอย่าง: ปรับโครงสร้างเป็นหัวข้อย่อย พร้อม bullet points',
                                confidence: 0.78,
                                requiresConfirm: true,
                            }
                        }),
                        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
                    };
                }
            }

            // Files proposals
            if (appScope === 'core.files') {
                if (content.includes('จัด') || content.includes('organize') || content.includes('เรียง')) {
                    return {
                        id: `resp-${Date.now()}`,
                        content: JSON.stringify({
                            type: 'proposal',
                            proposal: {
                                id: `prop-${Date.now()}`,
                                type: 'organize',
                                appId: 'core.files',
                                title: '📁 แผนจัดระเบียบไฟล์',
                                description: 'AI เสนอแผนจัดไฟล์ให้เป็นระเบียบ (ยังไม่ย้ายจริง — ต้องกดยืนยัน)',
                                preview: 'แผน: ย้าย .pdf → Documents/PDFs, ย้าย .jpg → Photos/2026, ลบ .tmp จาก Downloads',
                                confidence: 0.82,
                                requiresConfirm: true,
                            }
                        }),
                        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
                    };
                }
            }

            // Settings proposals
            if (appScope === 'core.settings') {
                if (content.includes('แนะนำ') || content.includes('recommend') || content.includes('ตั้งค่า')) {
                    return {
                        id: `resp-${Date.now()}`,
                        content: JSON.stringify({
                            type: 'proposal',
                            proposal: {
                                id: `prop-${Date.now()}`,
                                type: 'recommend',
                                appId: 'core.settings',
                                title: '⚙️ คำแนะนำการตั้งค่า',
                                description: 'AI เสนอการตั้งค่าที่เหมาะสมกับการใช้งานของคุณ (read-only)',
                                preview: 'แนะนำ: เปิด Dark Mode, ตั้ง Auto-save ที่ 30 วินาที, ปิด Animation เพื่อประสิทธิภาพ',
                                confidence: 0.90,
                                requiresConfirm: true,
                            }
                        }),
                        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
                    };
                }
            }

            // Generic DRAFTER response
            return {
                id: `resp-${Date.now()}`,
                content: `[DRAFTER Mode — ${appScope}] AI พร้อมเสนอแนะใน ${appScope} ลองถามเช่น:\n` +
                    (appScope === 'core.notes' ? '• "ช่วยสรุป note นี้"\n• "เขียนใหม่ให้ชัดเจน"\n• "จัดโครงสร้างให้หน่อย"' :
                        appScope === 'core.files' ? '• "ช่วยจัดระเบียบไฟล์"\n• "เรียงไฟล์ให้หน่อย"' :
                            appScope === 'core.settings' ? '• "แนะนำการตั้งค่า"\n• "ช่วยปรับ settings"' :
                                '• "ช่วยดู..."'),
                usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
            };
        }

        // OBSERVER fallback
        if (content.includes("verify document")) {
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
            content: `[Observer Mode] ${lastMessage.content} — ระบบอยู่ในโหมดสังเกตการณ์ ใช้ได้เฉพาะ read/explain`,
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
        };
    }

    private auditLog(correlationId: string, event: string, metadata: any) {
        console.log(`[Audit] ${correlationId} | ${event} | ${JSON.stringify(metadata)}`);
        // In real system, push to SYNAPSE/AuditService
    }
}

export const brainGateway = new BrainGateway();
