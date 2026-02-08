/**
 * Core OS Brain Trust Engine (Phase 29)
 * Manages AI Trust Score and Capability Escalation.
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
