/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 19: PROPOSE TOOLS — core.notes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * App-Scoped propose tools สำหรับ Notes app
 * AI เสนอแนะได้ แต่ผู้ใช้ต้องยืนยันก่อนดำเนินการ
 * 
 * Tools:
 * - propose_note_rewrite: เสนอเขียนใหม่
 * - propose_note_summarize: เสนอสรุปเนื้อหา
 * - propose_note_structure: เสนอจัดโครงสร้าง
 * 
 * @module coreos/brain/propose-notes
 */

import { BrainTool } from './types';

export const PROPOSE_NOTE_TOOLS: BrainTool[] = [
    {
        name: 'propose_note_rewrite',
        description: 'เสนอเขียน Note ใหม่ให้ชัดเจนขึ้น ผู้ใช้ต้องกดยืนยันก่อนบันทึก',
        parameters: {
            type: 'object',
            properties: {
                noteContent: { type: 'string', description: 'เนื้อหา Note ปัจจุบัน' },
                style: {
                    type: 'string',
                    enum: ['concise', 'detailed', 'bullet-points', 'formal'],
                    description: 'สไตล์ที่ต้องการ'
                },
            },
            required: ['noteContent'],
        },
        requiredCapabilities: ['core.notes' as any],
        handler: async (args, ctx) => {
            const rewritten = `[AI Draft] ปรับปรุงจากเนื้อหาเดิม (${args.noteContent.length} ตัวอักษร)\n\n` +
                `สไตล์: ${args.style || 'concise'}\n` +
                `---\n` +
                `ตัวอย่าง: เนื้อหาที่ปรับปรุงแล้วจะปรากฏที่นี่\n` +
                `(ต้องกด ✅ ยืนยัน เพื่อแทนที่เนื้อหาเดิม)`;

            return {
                type: 'proposal',
                proposal: {
                    id: `prop-rewrite-${Date.now()}`,
                    type: 'rewrite',
                    appId: 'core.notes',
                    title: '✏️ เขียน Note ใหม่',
                    description: `AI เสนอเขียนเนื้อหาใหม่ในสไตล์ "${args.style || 'concise'}"`,
                    preview: rewritten,
                    confidence: 0.78,
                    requiresConfirm: true,
                },
            };
        },
    },

    {
        name: 'propose_note_summarize',
        description: 'เสนอสรุปเนื้อหา Note ให้กระชับ ผู้ใช้ต้องกดยืนยันก่อนบันทึก',
        parameters: {
            type: 'object',
            properties: {
                noteContent: { type: 'string', description: 'เนื้อหา Note ที่ต้องการสรุป' },
                maxLength: { type: 'number', description: 'ความยาวสูงสุด (ตัวอักษร)' },
            },
            required: ['noteContent'],
        },
        requiredCapabilities: ['core.notes' as any],
        handler: async (args, ctx) => {
            const originalLen = args.noteContent.length;
            const targetLen = args.maxLength || Math.floor(originalLen * 0.3);

            return {
                type: 'proposal',
                proposal: {
                    id: `prop-summarize-${Date.now()}`,
                    type: 'summarize',
                    appId: 'core.notes',
                    title: '📝 สรุปเนื้อหา Note',
                    description: `AI เสนอสรุปจาก ${originalLen} → ~${targetLen} ตัวอักษร`,
                    preview: `[ตัวอย่างสรุป] เนื้อหาหลักประกอบด้วย ${Math.ceil(originalLen / 200)} หัวข้อสำคัญ...`,
                    confidence: 0.85,
                    requiresConfirm: true,
                },
            };
        },
    },

    {
        name: 'propose_note_structure',
        description: 'เสนอจัดโครงสร้าง Note ให้เป็นระเบียบ (หัวข้อ, bullet points, sections)',
        parameters: {
            type: 'object',
            properties: {
                noteContent: { type: 'string', description: 'เนื้อหา Note ที่ต้องการจัดโครงสร้าง' },
                format: {
                    type: 'string',
                    enum: ['outline', 'sections', 'checklist'],
                    description: 'รูปแบบโครงสร้างที่ต้องการ'
                },
            },
            required: ['noteContent'],
        },
        requiredCapabilities: ['core.notes' as any],
        handler: async (args, ctx) => {
            return {
                type: 'proposal',
                proposal: {
                    id: `prop-structure-${Date.now()}`,
                    type: 'structure',
                    appId: 'core.notes',
                    title: '📋 จัดโครงสร้าง Note',
                    description: `AI เสนอจัดเนื้อหาเป็นรูปแบบ "${args.format || 'outline'}"`,
                    preview: `[ตัวอย่างโครงสร้าง]\n1. หัวข้อหลัก\n   1.1 รายละเอียด A\n   1.2 รายละเอียด B\n2. หัวข้อรอง\n   2.1 ข้อมูลเพิ่มเติม`,
                    confidence: 0.80,
                    requiresConfirm: true,
                },
            };
        },
    },
];
