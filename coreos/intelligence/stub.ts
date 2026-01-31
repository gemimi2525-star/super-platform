/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Stub Intelligence Layer (NO AI MODEL)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Stub implementation that satisfies the interface without real AI.
 * This proves the architecture works and can be swapped with real AI later.
 * 
 * SYSTEM BEHAVIOR:
 * - With this stub: System works normally
 * - Without this stub: System works normally
 * - With real AI: System works normally + has insights
 * 
 * @module coreos/intelligence/stub
 * @version 1.0.0
 */

import type { SystemState, SystemEvent, PolicyDecision, CapabilityId } from '../types';
import type {
    IntelligenceLayer,
    ContextInsight,
    PolicyWarning,
    CapabilitySuggestion,
    ExplanationText,
} from './types';
import { getIntelligenceBridge } from './observer';

/**
 * Stub Intelligence Layer
 * 
 * Provides placeholder implementations that:
 * - Return sensible defaults
 * - Don't affect system behavior
 * - Can be replaced with real AI
 */
export class StubIntelligenceLayer implements IntelligenceLayer {
    private initialized: boolean = false;

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    async initialize(): Promise<boolean> {
        const bridge = getIntelligenceBridge();
        bridge.connect();
        bridge.registerObserver(this);
        this.initialized = true;
        console.log('[Intelligence] Stub layer initialized (no AI model)');
        return true;
    }

    isAvailable(): boolean {
        return this.initialized;
    }

    shutdown(): void {
        this.initialized = false;
        console.log('[Intelligence] Stub layer shutdown');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // OBSERVER (READ-ONLY) — Does nothing in stub
    // ═══════════════════════════════════════════════════════════════════════

    onEvent(_event: Readonly<SystemEvent>): void {
        // Stub: observe but don't act
        // Real AI could analyze event patterns here
    }

    onStateChange(_state: Readonly<SystemState>): void {
        // Stub: observe but don't act
        // Real AI could track context changes here
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONTEXT INSIGHT (Returns generic insight)
    // ═══════════════════════════════════════════════════════════════════════

    async analyzeContext(state: Readonly<SystemState>): Promise<ContextInsight> {
        const activeCount = Object.values(state.windows).filter(w => w.state === 'active').length;

        let summary: string;
        if (state.cognitiveMode === 'calm') {
            summary = 'ระบบอยู่ในสถานะพร้อมใช้งาน';
        } else if (state.cognitiveMode === 'focused') {
            summary = 'กำลังทำงานกับหน้าต่างเดียว';
        } else if (state.cognitiveMode === 'multitask') {
            summary = `กำลังทำงานหลายอย่างพร้อมกัน (${activeCount} หน้าต่าง)`;
        } else {
            summary = 'ระบบกำลังทำงาน';
        }

        return {
            type: 'context_insight',
            summary,
            cognitiveMode: state.cognitiveMode,
            activeCapabilities: [...state.activeCapabilities],
            confidence: 0.5, // Low confidence for stub
            timestamp: Date.now(),
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POLICY INSIGHT (Returns generic explanations)
    // ═══════════════════════════════════════════════════════════════════════

    async explainDecision(
        decision: PolicyDecision,
        capabilityId: CapabilityId
    ): Promise<PolicyWarning> {
        let explanation: string;
        let suggestedAction: string | null = null;

        switch (decision.type) {
            case 'allow':
                explanation = `คุณมีสิทธิ์เข้าถึง ${capabilityId}`;
                break;
            case 'deny':
                explanation = `ไม่สามารถเข้าถึง ${capabilityId} ได้: ${decision.reason}`;
                suggestedAction = 'ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เพิ่มเติม';
                break;
            case 'require_stepup':
                explanation = `${capabilityId} ต้องการการยืนยันตัวตนเพิ่มเติมเพื่อความปลอดภัย`;
                suggestedAction = 'กรุณายืนยันตัวตนด้วยรหัสผ่าน';
                break;
            case 'degrade':
                explanation = `ระบบจะเปิด ${decision.fallback} แทน ${capabilityId}`;
                break;
        }

        return {
            type: 'policy_warning',
            capabilityId,
            decision,
            explanation,
            suggestedAction,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPLANATION PROVIDER (Returns generic text)
    // ═══════════════════════════════════════════════════════════════════════

    async explain(topic: string, _context?: Record<string, unknown>): Promise<ExplanationText> {
        return {
            type: 'explanation_text',
            topic,
            content: `นี่คือข้อมูลเกี่ยวกับ "${topic}"`,
            format: 'plain',
        };
    }

    async explainStepUp(capabilityId: CapabilityId): Promise<ExplanationText> {
        return {
            type: 'explanation_text',
            topic: 'step_up_required',
            content: `"${capabilityId}" เป็นฟีเจอร์ที่มีความละเอียดอ่อน ระบบต้องการยืนยันว่าคุณเป็นเจ้าของบัญชีจริง กรุณายืนยันตัวตนด้วยรหัสผ่านเพื่อดำเนินการต่อ`,
            format: 'plain',
        };
    }

    async explainDeny(capabilityId: CapabilityId, reason: string): Promise<ExplanationText> {
        return {
            type: 'explanation_text',
            topic: 'access_denied',
            content: `คุณไม่สามารถเข้าถึง "${capabilityId}" ได้\n\nสาเหตุ: ${reason}\n\nหากคุณเชื่อว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ`,
            format: 'plain',
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUGGESTION PROVIDER (Returns empty — no suggestions in stub)
    // ═══════════════════════════════════════════════════════════════════════

    async getSuggestions(_state: Readonly<SystemState>): Promise<readonly CapabilitySuggestion[]> {
        // Stub returns no suggestions
        // Real AI could analyze context and suggest relevant capabilities
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════

let layerInstance: IntelligenceLayer | null = null;

/**
 * Get the Intelligence Layer (stub by default)
 * Can be replaced with real AI implementation
 */
export function getIntelligenceLayer(): IntelligenceLayer {
    if (!layerInstance) {
        layerInstance = new StubIntelligenceLayer();
    }
    return layerInstance;
}

/**
 * Set a custom Intelligence Layer implementation
 * Use this to swap stub with real AI
 */
export function setIntelligenceLayer(layer: IntelligenceLayer): void {
    if (layerInstance) {
        layerInstance.shutdown();
    }
    layerInstance = layer;
}

/**
 * Reset Intelligence Layer (for testing)
 */
export function resetIntelligenceLayer(): void {
    if (layerInstance) {
        layerInstance.shutdown();
    }
    layerInstance = null;
}
