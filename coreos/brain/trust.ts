/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Core OS Brain Trust Engine (Phase 29 → Phase 20 AGENT)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages AI Trust Score and Capability Escalation.
 * 
 * Phase 19: เพิ่ม App-Scoped Trust — ตรวจสอบว่า app ใดอนุญาต DRAFTER
 * Phase 20: เพิ่ม Execute Access — core.notes only (AGENT tier)
 * 
 * @module coreos/brain/trust
 */

export enum TrustTier {
    OBSERVER = 'OBSERVER',   // Level 1: Read Only, Explain
    DRAFTER = 'DRAFTER',     // Level 2: Propose, Draft, Categorize
    AGENT = 'AGENT'          // Level 3: Execute Approved, Limited Auto
}

export interface TrustState {
    score: number;       // 0 - 100
    tier: TrustTier;
    successfulActions: number;
    failedActions: number;
    userRejections: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 19: App-Scoped DRAFTER Allow-List
// เฉพาะ apps เหล่านี้เท่านั้นที่ AI จะ propose ได้
// ═══════════════════════════════════════════════════════════════════════════
const PHASE19_DRAFTER_APPS: ReadonlySet<string> = new Set([
    'core.notes',
    'core.files',
    'core.settings',
]);

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 20: App-Scoped EXECUTE Allow-List
// เฉพาะ core.notes เท่านั้นใน Phase 20 (Minimal Scope)
// ═══════════════════════════════════════════════════════════════════════════
const PHASE20_EXECUTE_APPS: ReadonlySet<string> = new Set([
    'core.notes',
]);

const DEFAULT_TRUST: TrustState = {
    score: 70, // Start High based on Pilot success
    tier: TrustTier.DRAFTER,
    successfulActions: 0,
    failedActions: 0,
    userRejections: 0
};

class TrustEngine {
    private state: TrustState = { ...DEFAULT_TRUST };

    getTier(): TrustTier {
        return this.state.tier;
    }

    getScore(): number {
        return this.state.score;
    }

    getState(): Readonly<TrustState> {
        return { ...this.state };
    }

    /**
     * Check if current tier allows specific capability level
     */
    canPerform(requiredTier: TrustTier): boolean {
        const tiers = [TrustTier.OBSERVER, TrustTier.DRAFTER, TrustTier.AGENT];
        const currentIdx = tiers.indexOf(this.state.tier);
        const requiredIdx = tiers.indexOf(requiredTier);
        return currentIdx >= requiredIdx;
    }

    /**
     * Phase 19: ตรวจสอบว่า app นี้อนุญาต DRAFTER tier หรือไม่
     * คืนค่า effective tier สำหรับ app ที่ระบุ
     */
    getTierForApp(appId: string): TrustTier {
        // ถ้า trust score ต่ำกว่า 50 → บังคับ OBSERVER ไม่ว่า app ใด
        if (this.state.score < 50) {
            return TrustTier.OBSERVER;
        }

        // ถ้า app อยู่ใน allow-list → ใช้ tier จริง
        if (PHASE19_DRAFTER_APPS.has(appId)) {
            return this.state.tier;
        }

        // app อื่น ๆ → ล็อกที่ OBSERVER
        return TrustTier.OBSERVER;
    }

    /**
     * Phase 19: ตรวจว่า app นี้ได้รับอนุญาตให้ใช้ DRAFTER
     */
    isAppDrafterAllowed(appId: string): boolean {
        return PHASE19_DRAFTER_APPS.has(appId);
    }

    /**
     * Phase 20: ตรวจว่า app นี้ได้รับอนุญาตให้ execute
     * จำกัดเฉพาะ core.notes ใน Phase 20
     */
    isAppExecuteAllowed(appId: string): boolean {
        return PHASE20_EXECUTE_APPS.has(appId);
    }

    /**
     * Update trust based on action outcome
     */
    reportOutcome(success: boolean, type: 'execution' | 'proposal') {
        if (success) {
            this.state.successfulActions++;
            this.state.score = Math.min(100, this.state.score + (type === 'execution' ? 1 : 0.2));
        } else {
            this.state.failedActions++;
            this.state.score = Math.max(0, this.state.score - 5); // Penalty
        }
        this.updateTier();
        console.log(`[Trust] Score: ${this.state.score.toFixed(1)} | Tier: ${this.state.tier}`);
    }

    reportRejection() {
        this.state.userRejections++;
        this.state.score = Math.max(0, this.state.score - 2);
        this.updateTier();
        console.log(`[Trust] User Rejected. Score: ${this.state.score.toFixed(1)}`);
    }

    private updateTier() {
        if (this.state.score < 50) this.state.tier = TrustTier.OBSERVER;
        else if (this.state.score < 85) this.state.tier = TrustTier.DRAFTER;
        else this.state.tier = TrustTier.AGENT;
    }

    // Admin/Test method
    setScore(score: number) {
        this.state.score = score;
        this.updateTier();
    }
}

export const trustEngine = new TrustEngine();
