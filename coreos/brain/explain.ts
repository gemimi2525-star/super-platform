/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPLAIN ENGINE (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides human-readable explanations for OS events and decisions.
 * 
 * Capabilities:
 * - Explain DENY decisions from audit logs
 * - Explain policy rules
 * - Summarize current system state
 * - Diagnose errors
 * 
 * All explanations are READ-only — no side effects.
 * 
 * @module coreos/brain/explain
 * @version 1.0.0 (Phase 18)
 */

import { getBrainObserver, type ObservedEvent, type SystemSummary } from './observer';
import { classifyPath, describeVisibility } from './data-visibility';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExplainResult {
    summary: string;
    details: string[];
    recommendations: string[];
    relatedEvents?: ObservedEvent[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DENY EXPLANATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common DENY reason patterns and their explanations
 */
const DENY_PATTERNS: Array<{
    pattern: RegExp;
    explain: (match: RegExpMatchArray, context?: any) => ExplainResult;
}> = [
        {
            pattern: /permission.*matrix/i,
            explain: (_match, ctx) => ({
                summary: 'Permission Matrix ไม่อนุญาตการเข้าถึงนี้',
                details: [
                    'App ที่ร้องขอไม่มีสิทธิ์ใน Permission Matrix',
                    `Path: ${ctx?.path || 'ไม่ทราบ'}`,
                    `App: ${ctx?.appId || 'ไม่ทราบ'}`,
                    'Permission Matrix ถูกกำหนดสำหรับแต่ละ app+scheme',
                ],
                recommendations: [
                    'ตรวจสอบว่า app มี permission สำหรับ scheme นี้หรือไม่',
                    'ดู Permission Matrix ใน Ops Center',
                    'ติดต่อ admin เพื่อขอ permission เพิ่มเติม',
                ],
            }),
        },
        {
            pattern: /governance.*block/i,
            explain: () => ({
                summary: 'Governance Block — VFS Feature Flag ปิดอยู่',
                details: [
                    'NEXT_PUBLIC_FEATURE_VFS = false',
                    'VFS ถูกปิดที่ระดับ governance (build-time)',
                    'ทุก VFS operations จะถูก block',
                ],
                recommendations: [
                    'ตรวจสอบ Environment Variables ใน Vercel/Production',
                    'ตั้งค่า NEXT_PUBLIC_FEATURE_VFS=true แล้ว redeploy',
                ],
            }),
        },
        {
            pattern: /system:\/\//,
            explain: () => ({
                summary: 'Path system:// เป็น Secret Zone — ห้ามเข้าถึง',
                details: [
                    'Scheme system:// สงวนไว้สำหรับ OS internal เท่านั้น',
                    'ไม่มี app ใดมีสิทธิ์เข้าถึง system://',
                    'นี่คือ Security feature ที่ออกแบบโดยตั้งใจ',
                ],
                recommendations: [
                    'ใช้ user:// สำหรับข้อมูลผู้ใช้',
                    'ใช้ shared:// สำหรับข้อมูลร่วม',
                    'ดูการจำแนกข้อมูลใน Data Visibility Classification',
                ],
            }),
        },
        {
            pattern: /step.*up.*auth/i,
            explain: () => ({
                summary: 'ต้อง Step-Up Authentication — ยืนยันตัวตนเพิ่มเติม',
                details: [
                    'Operation นี้ต้องการ elevated privileges',
                    'Session การยืนยันตัวตนหมดอายุ (15 นาทีหลัง step-up ล่าสุด)',
                    'เทียบได้กับ sudo ใน macOS',
                ],
                recommendations: [
                    'ทำ step-up authentication ใหม่',
                    'ระบุ password เพื่อยืนยันตัวตน',
                ],
            }),
        },
        {
            pattern: /capability.*not.*found|unknown.*app/i,
            explain: (_match, ctx) => ({
                summary: 'App ไม่ได้ลงทะเบียนใน Capability Graph',
                details: [
                    `Capability ID: ${ctx?.capabilityId || 'ไม่ทราบ'}`,
                    'App นี้ไม่มี Manifest ใน Registry',
                    'ระบบตรวจสอบ Capability Graph ก่อนอนุญาตทุกครั้ง',
                ],
                recommendations: [
                    'ตรวจสอบว่า capability ID สะกดถูกต้อง',
                    'ดูรายการ apps ใน Dock หรือ Capability Graph',
                ],
            }),
        },
    ];

// ═══════════════════════════════════════════════════════════════════════════
// EXPLAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Explain a DENY decision
 */
export function explainDeny(reason: string, context?: Record<string, any>): ExplainResult {
    for (const pattern of DENY_PATTERNS) {
        const match = reason.match(pattern.pattern);
        if (match) {
            return pattern.explain(match, context);
        }
    }

    // Generic explanation for unmatched patterns
    return {
        summary: `การเข้าถึงถูก DENY: ${reason}`,
        details: [
            `เหตุผล: ${reason}`,
            'ระบบ SYNAPSE ตัดสินใจ DENY ตาม policy ที่กำหนด',
        ],
        recommendations: [
            'ตรวจสอบ Audit Log สำหรับรายละเอียดเพิ่มเติม',
            'ติดต่อ admin ถ้าเชื่อว่าควรได้รับอนุญาต',
        ],
    };
}

/**
 * Explain a VFS path's visibility classification
 */
export function explainPathAccess(path: string): ExplainResult {
    const visibility = classifyPath(path);
    const visDesc = describeVisibility(path);

    return {
        summary: visDesc,
        details: [
            `Classification: ${visibility.classification}`,
            `Read Metadata: ${visibility.canReadMetadata ? '✅ ได้' : '❌ ไม่ได้'}`,
            `Read Content: ${visibility.canReadContent ? '✅ ได้' : '❌ ไม่ได้'}`,
            `เหตุผล: ${visibility.reason}`,
        ],
        recommendations:
            visibility.classification === 'SECRET'
                ? ['Path นี้ถูกจำกัดการเข้าถึง — ใช้ user:// สำหรับข้อมูลทั่วไป']
                : visibility.classification === 'SENSITIVE'
                    ? ['เข้าถึง metadata ได้ แต่เนื้อหาถูกปกป้อง']
                    : ['✅ เข้าถึงได้ตามปกติ'],
    };
}

/**
 * Summarize current system state for AI context
 */
export function summarizeSystemState(): string {
    const observer = getBrainObserver();
    const summary = observer.getSystemSummary();
    const anomalies = observer.getAnomalies();

    const lines: string[] = [
        '📊 สรุปสถานะระบบ Core OS',
        '─'.repeat(40),
        '',
        `🪟 Windows: ${summary.windows.total} เปิดอยู่`,
        `   Focused: ${summary.windows.focused || 'ไม่มี'}`,
        `   Minimized: ${summary.windows.minimized}`,
        '',
        `🌐 Connectivity: ${summary.connectivity}`,
        '',
        `📝 Events (recent buffer):`,
        `   Total: ${summary.recentEvents.total}`,
        `   Errors: ${summary.recentEvents.errors}`,
        `   DENYs: ${summary.recentEvents.denies}`,
        '',
        `⏱️ Uptime: ${formatUptime(summary.uptime)}`,
    ];

    if (anomalies.length > 0) {
        lines.push('');
        lines.push('⚠️ Anomalies ที่ตรวจพบ:');
        for (const anomaly of anomalies) {
            lines.push(`   [${anomaly.severity.toUpperCase()}] ${anomaly.description}`);
        }
    } else {
        lines.push('');
        lines.push('✅ ไม่พบ anomaly — ระบบปกติ');
    }

    return lines.join('\n');
}

/**
 * Diagnose an error for user-friendly explanation
 */
export function diagnoseError(error: string): ExplainResult {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('vfs') || lowerError.includes('filesystem')) {
        return {
            summary: 'ข้อผิดพลาดเกี่ยวกับ Virtual Filesystem (VFS)',
            details: [
                `Error: ${error}`,
                'อาจเกิดจาก: permission ไม่พอ, path ไม่ถูกต้อง, หรือ VFS ถูกปิด',
            ],
            recommendations: [
                'ตรวจสอบ VFS Feature Flag (NEXT_PUBLIC_FEATURE_VFS)',
                'ตรวจสอบ Permission Matrix สำหรับ app ที่ใช้',
                'ดู Audit Log สำหรับ DENY events',
            ],
        };
    }

    if (lowerError.includes('auth') || lowerError.includes('permission') || lowerError.includes('denied')) {
        return {
            summary: 'ข้อผิดพลาดเกี่ยวกับสิทธิ์การเข้าถึง',
            details: [
                `Error: ${error}`,
                'อาจเกิดจาก: session หมดอายุ, permission ไม่พอ, หรือ step-up auth จำเป็น',
            ],
            recommendations: [
                'ลอง refresh page',
                'ตรวจสอบว่ายังล็อกอินอยู่',
                'ทำ step-up authentication ถ้าจำเป็น',
            ],
        };
    }

    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
        return {
            summary: 'ข้อผิดพลาดเกี่ยวกับเครือข่าย',
            details: [
                `Error: ${error}`,
                'อาจเกิดจาก: ขาดการเชื่อมต่อ internet, server ไม่ตอบสนอง',
            ],
            recommendations: [
                'ตรวจสอบการเชื่อมต่อ internet',
                'ดูสถานะ Connectivity Monitor ใน OS',
                'ลองอีกครั้งหลังจากสักครู่',
            ],
        };
    }

    // Generic diagnosis
    return {
        summary: `ข้อผิดพลาดของระบบ: ${error}`,
        details: [`Error: ${error}`],
        recommendations: [
            'ตรวจสอบ Audit Log และ System Log สำหรับรายละเอียด',
            'ติดต่อ admin ถ้าปัญหายังคงอยู่',
        ],
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours} ชั่วโมง ${minutes % 60} นาที`;
    if (minutes > 0) return `${minutes} นาที`;
    return `${seconds} วินาที`;
}
