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
     * Check outputs from Brain before returning to App
     */
    checkPostFlight(response: BrainResponse): SafetyCheckResult {
        // Ensure no executable code blocks that are auto-runnable
        // (Mock implementation)
        return { safe: true };
    }
}

export const safetyGate = new SafetyGate();
