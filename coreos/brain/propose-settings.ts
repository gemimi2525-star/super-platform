/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 19: PROPOSE TOOLS — core.settings
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * App-Scoped propose tools สำหรับ Settings app
 * AI เสนอคำแนะนำการตั้งค่า (read-only — ไม่เปลี่ยนจริง)
 * 
 * Tools:
 * - propose_setting_recommend: เสนอคำแนะนำการตั้งค่า
 * 
 * @module coreos/brain/propose-settings
 */

import { BrainTool } from './types';

export const PROPOSE_SETTING_TOOLS: BrainTool[] = [
    {
        name: 'propose_setting_recommend',
        description: 'เสนอคำแนะนำการตั้งค่าระบบ (read-only — ไม่เปลี่ยนค่าจริง)',
        parameters: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['performance', 'security', 'appearance', 'accessibility'],
                    description: 'หมวดหมู่การตั้งค่า'
                },
                currentSettings: { type: 'object', description: 'การตั้งค่าปัจจุบัน (ถ้ามี)' },
            },
        },
        requiredCapabilities: ['core.settings' as any],
        handler: async (args, ctx) => {
            const category = args.category || 'performance';

            const recommendations: Record<string, any[]> = {
                performance: [
                    { setting: 'Animation', current: 'เปิด', recommended: 'ปิด', reason: 'ลดการใช้ CPU' },
                    { setting: 'Auto-save Interval', current: '60s', recommended: '30s', reason: 'ป้องกันข้อมูลหาย' },
                    { setting: 'Cache Size', current: '50MB', recommended: '100MB', reason: 'เพิ่มความเร็ว' },
                ],
                security: [
                    { setting: 'Session Timeout', current: '30 นาที', recommended: '15 นาที', reason: 'ลดความเสี่ยง' },
                    { setting: 'Two-Factor Auth', current: 'ปิด', recommended: 'เปิด', reason: 'เพิ่มความปลอดภัย' },
                ],
                appearance: [
                    { setting: 'Theme', current: 'Light', recommended: 'Dark', reason: 'ลดความเมื่อยล้าสายตา' },
                    { setting: 'Font Size', current: '13px', recommended: '14px', reason: 'อ่านง่ายขึ้น' },
                ],
                accessibility: [
                    { setting: 'High Contrast', current: 'ปิด', recommended: 'เปิด', reason: 'สำหรับสายตาไม่ดี' },
                    { setting: 'Reduce Motion', current: 'ปิด', recommended: 'เปิด', reason: 'ลด animation ที่รบกวน' },
                ],
            };

            const recs = recommendations[category] || recommendations.performance;

            return {
                type: 'proposal',
                proposal: {
                    id: `prop-setting-${Date.now()}`,
                    type: 'recommend',
                    appId: 'core.settings',
                    title: `⚙️ คำแนะนำ: ${category}`,
                    description: `AI เสนอ ${recs.length} คำแนะนำสำหรับหมวด "${category}" (read-only)`,
                    preview: recs.map(r =>
                        `• ${r.setting}: ${r.current} → ${r.recommended} (${r.reason})`
                    ).join('\n'),
                    confidence: 0.88,
                    requiresConfirm: true,
                    metadata: { recommendations: recs },
                },
            };
        },
    },
];
