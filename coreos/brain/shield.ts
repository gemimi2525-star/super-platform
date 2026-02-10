/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SAFETY SHIELD (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pre-flight and Post-flight checks for AI interactions.
 * Ensures no dangerous intents bypass validation.
 * 
 * @module coreos/brain/shield
 */

import { BrainRequest, BrainResponse } from './types';

interface SafetyCheckResult {
    safe: boolean;
    reason?: string;
}

class SafetyGate {

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 18: Allowed tool prefixes (READ-only)
    // Everything else is BLOCKED in Observer mode
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
     * Check outputs from Brain before returning to App
     */
    checkPostFlight(response: BrainResponse): SafetyCheckResult {
        // Ensure no executable code blocks that are auto-runnable
        // (Mock implementation)
        return { safe: true };
    }
}

export const safetyGate = new SafetyGate();
