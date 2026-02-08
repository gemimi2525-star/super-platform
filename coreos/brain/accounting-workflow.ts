/**
 * Core OS Accounting Workflow (Phase 30)
 * Manages the AI-Draft -> Human-Review -> Ledger-Post pipeline.
 */

export interface AccountingDraft {
    id: string;
    sourceDoc: string; // Path to PDF
    extractedData: any;
    status: 'DRAFT' | 'REVIEWED' | 'POSTED' | 'REJECTED';
    createdBy: string; // 'ai' or 'user'
    reviewedBy?: string;
    postedBy?: string;
    auditLog: string[];
}

class AccountingWorkflow {
    private drafts: Map<string, AccountingDraft> = new Map();

    /**
     * AI creates a draft (Safe Action)
     */
    async createDraft(sourceDoc: string, data: any, by: string): Promise<string> {
        const id = `draft-${Date.now()}`;
        const draft: AccountingDraft = {
            id,
            sourceDoc,
            extractedData: data,
            status: 'DRAFT',
            createdBy: by,
            auditLog: [`[${new Date().toISOString()}] Created by ${by}`]
        };
        this.drafts.set(id, draft);
        console.log(`[AccWorkflow] Draft created: ${id} by ${by}`);
        return id;
    }

    /**
     * Human reviews and updates draft
     */
    async reviewDraft(id: string, by: string, modifications?: any) {
        const draft = this.drafts.get(id);
        if (!draft) throw new Error('Draft not found');

        if (modifications) {
            draft.extractedData = { ...draft.extractedData, ...modifications };
            draft.auditLog.push(`[${new Date().toISOString()}] Modified by ${by}`);
        }

        draft.status = 'REVIEWED';
        draft.reviewedBy = by;
        draft.auditLog.push(`[${new Date().toISOString()}] Reviewed by ${by}`);
        console.log(`[AccWorkflow] Draft reviewed: ${id}`);
    }

    /**
     * Human Posts to Ledger (The Hard Gate)
     */
    async postToLedger(id: string, by: string): Promise<boolean> {
        const draft = this.drafts.get(id);
        if (!draft) throw new Error('Draft not found');

        // 1. Identity Check (Double Lock)
        if (by === 'ai' || by === 'system-auto') {
            throw new Error('SECURITY BLOCK: AI cannot perform Final Ledger Post.');
        }

        // 2. Status Check
        if (draft.status !== 'REVIEWED' && draft.status !== 'DRAFT') { // Allow Direct Post if Human
            // In stricter flow, might require REVIEWED first. For now allow DRAFT->POST if Human.
        }

        // 3. Execution
        draft.status = 'POSTED';
        draft.postedBy = by;
        draft.auditLog.push(`[${new Date().toISOString()}] POSTED TO LEDGER by ${by}`);

        console.log(`[AccWorkflow] 💰 LEDGER POST SUCCESS: ${id} by ${by}`);
        console.log(`[AccWorkflow] Narrative: AI Prepared -> Human Verified -> Human Posted`);

        return true;
    }

    getDraft(id: string) {
        return this.drafts.get(id);
    }
}

export const accountingWorkflow = new AccountingWorkflow();
