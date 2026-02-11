/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SAFETY SHIELD (Phase 25A → Phase 19 DRAFTER)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pre-flight and Post-flight checks for AI interactions.
 * Ensures no dangerous intents bypass validation.
 * 
 * Phase 19: เพิ่ม App-Scoped tool filtering สำหรับ DRAFTER mode
 * 
 * @module coreos/brain/shield
 */

import { BrainRequest, BrainResponse } from './types';

interface SafetyCheckResult {
    safe: boolean;
    reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 19: Tool → App Scope Mapping
// propose_note_* → core.notes เท่านั้น
// propose_file_* → core.files เท่านั้น
// propose_setting_* → core.settings เท่านั้น
// ═══════════════════════════════════════════════════════════════════════════
const PROPOSE_TOOL_APP_MAP: Record<string, string> = {
    'propose_note_': 'core.notes',
    'propose_file_': 'core.files',
    'propose_setting_': 'core.settings',
};

class SafetyGate {

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 18 → 19: Allowed tool prefixes (READ + PROPOSE)
    // Everything else is BLOCKED
    // ═══════════════════════════════════════════════════════════════════
    private static readonly PHASE18_ALLOWED_PREFIXES = [
        'read_',
        'explain_',
        'search_',
        'propose_',
        'validate_',    // Existing compliance validator (read-only)
        'draft_',       // Draft intent (propose, not execute)
    ];

    private static readonly PHASE18_BLOCKED_PREFIXES = [
        'execute_',
        'delete_',
        'install_',
        'update_',
        'write_',
        'admin_',
    ];

    /**
     * Check inputs before sending to Brain
     */
    checkPreFlight(request: BrainRequest): SafetyCheckResult {
        // 1. Check for PII or Forbidden Patterns (Basic Regex)
        const content = request.messages.map(m => m.content).join(' ');

        if (content.includes('DROP TABLE') || content.includes('DELETE FROM')) {
            return { safe: false, reason: 'SQL Injection Pattern Detected' };
        }

        if (content.includes('sudo ') || content.includes('rm -rf')) {
            return { safe: false, reason: 'System Command Injection Detected' };
        }

        // 2. Check Context Validity
        if (!request.appId) {
            return { safe: false, reason: 'Missing App Context' };
        }

        return { safe: true };
    }

    /**
     * Phase 18: Check if a tool is allowed in Observer mode
     * Only READ-only tools are permitted
     */
    checkToolAllowed(toolName: string): SafetyCheckResult {
        // Check blocked prefixes first (explicit deny)
        for (const prefix of SafetyGate.PHASE18_BLOCKED_PREFIXES) {
            if (toolName.startsWith(prefix)) {
                console.warn(`[Shield] 🛑 Phase 18 BLOCKED tool: ${toolName}`);
                return {
                    safe: false,
                    reason: `Phase 18: Tool '${toolName}' is blocked in Observer mode. Only READ/EXPLAIN/SEARCH tools are allowed.`
                };
            }
        }

        // Check allowed prefixes (explicit allow)
        const isAllowed = SafetyGate.PHASE18_ALLOWED_PREFIXES.some(
            prefix => toolName.startsWith(prefix)
        );

        if (!isAllowed) {
            console.warn(`[Shield] ⚠️ Phase 18 UNKNOWN tool prefix: ${toolName} — blocking by default`);
            return {
                safe: false,
                reason: `Phase 18: Tool '${toolName}' not in allowed prefix list. Contact system administrator.`
            };
        }

        return { safe: true };
    }

    /**
     * Phase 19: Check if a propose tool is allowed for the given app scope
     * Enforces that propose_note_* tools can only be used with core.notes, etc.
     */
    checkDrafterAccess(toolName: string, appScope?: string): SafetyCheckResult {
        // Non-propose tools: ไม่จำเป็นต้องตรวจ app scope
        if (!toolName.startsWith('propose_')) {
            return { safe: true };
        }

        // ถ้าไม่มี app scope → block propose tools (ต้องระบุ context)
        if (!appScope) {
            console.warn(`[Shield] 🛑 Phase 19: propose tool '${toolName}' requires app scope`);
            return {
                safe: false,
                reason: `Phase 19: Tool '${toolName}' ต้องระบุ app scope ก่อนใช้งาน`
            };
        }

        // ตรวจว่า tool ตรงกับ app scope หรือไม่
        for (const [prefix, allowedApp] of Object.entries(PROPOSE_TOOL_APP_MAP)) {
            if (toolName.startsWith(prefix)) {
                if (appScope !== allowedApp) {
                    console.warn(`[Shield] 🛑 Phase 19: ${toolName} requires ${allowedApp} but got ${appScope}`);
                    return {
                        safe: false,
                        reason: `Phase 19: Tool '${toolName}' ใช้ได้เฉพาะ ${allowedApp} เท่านั้น (ส่งมา: ${appScope})`
                    };
                }
                return { safe: true };
            }
        }

        // propose tool ที่ไม่มีใน map → อนุญาต (generic propose)
        return { safe: true };
    }

    /**
     * Check outputs from Brain before returning to App
     */
    checkPostFlight(response: BrainResponse): SafetyCheckResult {
        // Ensure no executable code blocks that are auto-runnable
        // (Mock implementation)
        return { safe: true };
    }
}

export const safetyGate = new SafetyGate();
