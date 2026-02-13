/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOCK ADAPTER (Phase 21B — Brain-Adapter Hardening)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implements LLMProvider for development/testing.
 * Returns deterministic responses based on input content.
 *
 * Extracted from gateway.ts mockProvider() to be a proper LLMProvider
 * implementation that can be swapped via the same interface.
 *
 * @module coreos/brain/providers/mock
 */

import {
    LLMProvider,
    LLMInput,
    LLMOutput,
    ToolCallNormalized,
    ProviderMeta,
    hashArguments,
} from './types';

export class MockAdapter implements LLMProvider {
    readonly providerId = 'mock' as const;
    readonly modelId = 'mock-v1' as const;

    async generate(input: LLMInput): Promise<LLMOutput> {
        const startMs = Date.now();

        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 100));

        const lastMessage = input.messages[input.messages.length - 1];
        const content = lastMessage?.content?.toLowerCase() ?? '';
        const appScope = input.metadata?.appScope ?? 'brain.assist';
        const tier = input.metadata?.trustTier ?? 'OBSERVER';

        let responseContent: string;
        const toolCalls: ToolCallNormalized[] = [];

        // Phase 19: DRAFTER/AGENT Mock — return proposal-style responses
        if (tier === 'DRAFTER' || tier === 'AGENT') {
            responseContent = this.drafterResponse(content, appScope);
        } else if (content.includes('verify document')) {
            // OBSERVER with tool call
            responseContent = 'I will verify this document for compliance.';
            const args = { documentId: 'doc-123', standard: 'ISO-27001' };
            toolCalls.push({
                callId: `call-${Date.now()}`,
                toolName: 'validate_document_compliance',
                arguments: args,
                argumentsHash: hashArguments(args),
            });
        } else {
            // OBSERVER fallback
            responseContent = `[Observer Mode] ${lastMessage?.content ?? ''} — ระบบอยู่ในโหมดสังเกตการณ์ ใช้ได้เฉพาะ read/explain`;
        }

        const latencyMs = Date.now() - startMs;

        const providerMeta: ProviderMeta = {
            providerId: this.providerId,
            modelId: this.modelId,
            latencyMs,
        };

        return {
            content: responseContent,
            toolCalls,
            usage: {
                promptTokens: 10,
                completionTokens: 10,
                totalTokens: 20,
            },
            providerMeta,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE: DRAFTER/AGENT response generation
    // ═══════════════════════════════════════════════════════════════

    private drafterResponse(content: string, appScope: string): string {
        // Notes proposals
        if (appScope === 'core.notes') {
            if (content.includes('สรุป') || content.includes('summarize') || content.includes('summary')) {
                return JSON.stringify({
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
                    },
                });
            }
            if (content.includes('เขียนใหม่') || content.includes('rewrite')) {
                return JSON.stringify({
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
                    },
                });
            }
        }

        // Files proposals
        if (appScope === 'core.files') {
            if (content.includes('จัด') || content.includes('organize') || content.includes('เรียง')) {
                return JSON.stringify({
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
                    },
                });
            }
        }

        // Settings proposals
        if (appScope === 'core.settings') {
            if (content.includes('แนะนำ') || content.includes('recommend') || content.includes('ตั้งค่า')) {
                return JSON.stringify({
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
                    },
                });
            }
        }

        // Generic DRAFTER response
        const examples = appScope === 'core.notes'
            ? '• "ช่วยสรุป note นี้"\n• "เขียนใหม่ให้ชัดเจน"\n• "จัดโครงสร้างให้หน่อย"'
            : appScope === 'core.files'
                ? '• "ช่วยจัดระเบียบไฟล์"\n• "เรียงไฟล์ให้หน่อย"'
                : appScope === 'core.settings'
                    ? '• "แนะนำการตั้งค่า"\n• "ช่วยปรับ settings"'
                    : '• "ช่วยดู..."';

        return `[DRAFTER Mode — ${appScope}] AI พร้อมเสนอแนะใน ${appScope} ลองถามเช่น:\n${examples}`;
    }
}
