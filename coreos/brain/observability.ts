/**
 * Core OS Trust Observatory (Phase 33)
 * Monitors AI Performance, Human Interventions, and generates Risk Signals.
 */

export interface TrustMetrics {
    totalProposals: number;
    approved: number;
    rejected: number;
    overridden: number;
    trustScore: number; // 0 - 100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class TrustObservatory {
    private metrics: TrustMetrics = {
        totalProposals: 0,
        approved: 0,
        rejected: 0,
        overridden: 0,
        trustScore: 100,
        riskLevel: 'LOW'
    };

    /**
     * Record outcome of an AI interaction
     */
    recordInteraction(outcome: 'APPROVE' | 'REJECT' | 'OVERRIDE') {
        this.metrics.totalProposals++;

        if (outcome === 'APPROVE') this.metrics.approved++;
        if (outcome === 'REJECT') this.metrics.rejected++;
        if (outcome === 'OVERRIDE') this.metrics.overridden++;

        this.recalculateTrust();
    }

    private recalculateTrust() {
        if (this.metrics.totalProposals === 0) return;

        // Simple algorithm: Approval Rate heavily weights Trust
        const approvalRate = this.metrics.approved / this.metrics.totalProposals;
        this.metrics.trustScore = Math.floor(approvalRate * 100);

        if (this.metrics.trustScore < 50) this.metrics.riskLevel = 'HIGH';
        else if (this.metrics.trustScore < 80) this.metrics.riskLevel = 'MEDIUM';
        else this.metrics.riskLevel = 'LOW';

        console.log(`[Observatory] Trust Updated: ${this.metrics.trustScore} (Risk: ${this.metrics.riskLevel})`);

        if (this.metrics.riskLevel === 'HIGH') {
            console.warn('[Observatory] 🚨 RISK SIGNAL: TRUST CRITICAL 🚨');
        }
    }

    getMetrics(): TrustMetrics {
        return { ...this.metrics };
    }

    /**
     * Generate Evidence Pack for a transaction chain
     */
    generateEvidencePack(traceId: string, history: string[]): any {
        return {
            traceId,
            timestamp: new Date().toISOString(),
            metricsSnapshot: this.getMetrics(),
            chainOfEvents: history,
            finalVerdict: 'GENERATED_BY_TRUST_OBSERVATORY'
        };
    }
}

export const trustObservatory = new TrustObservatory();
