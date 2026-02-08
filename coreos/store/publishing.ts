/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PUBLISHING SERVICE & GOVERNANCE (Phase 24C.2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles app submissions, automated policy checks, and status management.
 * 
 * @module coreos/store/publishing
 */

import { AppPackage } from '../manifests/spec';
import { validateInstallPolicy, determineTrustLevel } from '../policy/enforcement';
import { DistributionChannel } from './types';
import { storeCatalog } from './catalog';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Submission {
    readonly id: string;
    readonly appId: string;
    readonly version: string;
    readonly channel: DistributionChannel;
    readonly pkg: AppPackage;
    readonly submittedAt: number;

    status: SubmissionStatus;
    reasonCode?: string;
    notes?: string;
}

class PublishingService {
    private submissions: Map<string, Submission> = new Map();

    /**
     * Submit a release to a channel
     */
    async submitRelease(pkg: AppPackage, channel: DistributionChannel): Promise<Submission> {
        const submissionId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const submission: Submission = {
            id: submissionId,
            appId: pkg.manifest.appId,
            version: pkg.manifest.version,
            channel,
            pkg,
            submittedAt: Date.now(),
            status: 'PENDING'
        };

        console.log(`[Publishing] Received submission ${submissionId} for ${pkg.manifest.appId} -> ${channel}`);

        // 1. Automated Governance Check (Gate 1)
        // Check signatures and basic policy
        const trustLevel = determineTrustLevel(pkg);
        const policy = validateInstallPolicy(pkg.manifest, trustLevel);

        // Channel-specific Rules
        if (channel === 'official') {
            // Official requires strict Verified+ policy
            if (!policy.allowed) {
                return this.reject(submission, 'POLICY_VIOLATION', policy.reason);
            }
            // Official always goes to PENDING review unless we add auto-approve list
            submission.status = 'PENDING';

        } else if (channel === 'enterprise') {
            // Enterprise requires valid enterprise signature
            if (!policy.allowed) { // validateInstallPolicy checks signatures vs requested caps
                return this.reject(submission, 'POLICY_VIOLATION', policy.reason);
            }
            if (!pkg.signature) {
                return this.reject(submission, 'MISSING_SIGNATURE', 'Enterprise apps must be signed.');
            }
            // Enterprise apps are typically auto-approved if they pass signature check
            return this.approve(submission);

        } else if (channel === 'dev') {
            // Dev allows Unverified, but we still capture it.
            // If it requests System capabilities without System signature, it should still fail hard?
            // validateInstallPolicy logic:
            // if Unverified & requests System -> FAIL.
            // if Unverified & requests Safe -> PASS (TrustLevel.UNVERIFIED)

            if (!policy.allowed) {
                // If policy is not allowed, it means the app requests more than its trust level permits.
                // Even in Dev, we cannot allow a random app to have 'system.configure'.
                return this.reject(submission, 'CAPABILITY_MISMATCH', policy.reason);
            }

            // Auto-approve Dev channel
            return this.approve(submission);
        }

        this.submissions.set(submissionId, submission);
        return submission;
    }

    /**
     * Approve a submission
     */
    async approve(submission: Submission): Promise<Submission> {
        submission.status = 'APPROVED';
        this.submissions.set(submission.id, submission);

        console.log(`[Publishing] Approved ${submission.id}. Syncing to Catalog...`);

        // Sync to Store Catalog
        // In real system, this updates DB. Here, we'd need to push to storeCatalog's mock data.
        // For Phase 24C, we'll expose a method on StoreCatalog or just log it.
        // Let's assume StoreCatalog has a way to ingest:
        await storeCatalog.ingest(submission);

        return submission;
    }

    /**
     * Reject a submission
     */
    private reject(submission: Submission, code: string, notes?: string): Submission {
        submission.status = 'REJECTED';
        submission.reasonCode = code;
        submission.notes = notes;
        this.submissions.set(submission.id, submission);
        console.log(`[Publishing] Rejected ${submission.id}: ${code} - ${notes}`);
        return submission;
    }

    /**
     * Admin Hook: Manually Review
     */
    async reviewSubmission(submissionId: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
        const sub = this.submissions.get(submissionId);
        if (!sub) throw new Error('Submission not found');

        if (decision === 'APPROVE') {
            return this.approve(sub);
        } else {
            return this.reject(sub, 'MANUAL_REJECTION', notes);
        }
    }
}

export const publishingService = new PublishingService();
