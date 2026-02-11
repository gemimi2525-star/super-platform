/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 19: PROPOSE TOOLS — core.files
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * App-Scoped propose tools สำหรับ Files app
 * AI เสนอแผนจัดไฟล์ แต่ยังไม่ย้ายจริง
 * 
 * Tools:
 * - propose_file_organize: เสนอแผนจัดระเบียบไฟล์
 * 
 * @module coreos/brain/propose-files
 */

import { BrainTool } from './types';

export const PROPOSE_FILE_TOOLS: BrainTool[] = [
    {
        name: 'propose_file_organize',
        description: 'เสนอแผนจัดระเบียบไฟล์ (ยังไม่ย้ายจริง — ผู้ใช้ต้องกดยืนยัน)',
        parameters: {
            type: 'object',
            properties: {
                sourcePath: { type: 'string', description: 'โฟลเดอร์ต้นทาง (เช่น user://Downloads)' },
                criteria: {
                    type: 'string',
                    enum: ['type', 'date', 'size', 'name'],
                    description: 'เกณฑ์การจัดเรียง'
                },
            },
            required: ['sourcePath'],
        },
        requiredCapabilities: ['core.files' as any],
        handler: async (args, ctx) => {
            const criteria = args.criteria || 'type';

            // Mock file analysis
            const mockPlan = {
                type: criteria === 'type' ? [
                    { action: 'move', from: '*.pdf', to: 'Documents/PDFs/' },
                    { action: 'move', from: '*.jpg, *.png', to: 'Photos/' },
                    { action: 'move', from: '*.doc, *.xlsx', to: 'Documents/Office/' },
                    { action: 'clean', target: '*.tmp, *.cache', note: 'ลบไฟล์ชั่วคราว' },
                ] : [
                    { action: 'move', from: 'ไฟล์เก่ากว่า 30 วัน', to: 'Archive/2025/' },
                    { action: 'keep', target: 'ไฟล์ล่าสุด', note: 'คงไว้ที่เดิม' },
                ],
                totalFiles: 24,
                affectedFiles: 18,
            };

            return {
                type: 'proposal',
                proposal: {
                    id: `prop-organize-${Date.now()}`,
                    type: 'organize',
                    appId: 'core.files',
                    title: '📁 แผนจัดระเบียบไฟล์',
                    description: `AI เสนอจัดไฟล์ใน ${args.sourcePath} ตามเกณฑ์ "${criteria}" ` +
                        `(${mockPlan.affectedFiles}/${mockPlan.totalFiles} ไฟล์)`,
                    preview: mockPlan.type.map(step =>
                        step.action === 'move' ? `📦 ย้าย ${step.from} → ${step.to}` :
                            step.action === 'clean' ? `🗑️ ลบ ${step.target} (${step.note})` :
                                `✅ ${step.note}`
                    ).join('\n'),
                    confidence: 0.82,
                    requiresConfirm: true,
                    metadata: { plan: mockPlan },
                },
            };
        },
    },
];
