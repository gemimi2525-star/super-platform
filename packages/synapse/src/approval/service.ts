/**
 * SYNAPSE APPROVAL SERVICE
 * 
 * Manages the lifecycle of Approval Requests and Tokens.
 * In a real system, this would handle notifications and multi-party consensus.
 */

import { ApprovalRequest, ApprovalToken } from './types';
import * as crypto from 'crypto';

export class ApprovalService {
    private static instance: ApprovalService;
    private requests: Map<string, ApprovalRequest> = new Map();
    private tokens: Map<string, ApprovalToken> = new Map();

    private constructor() { }

    public static getInstance(): ApprovalService {
        if (!ApprovalService.instance) {
            ApprovalService.instance = new ApprovalService();
        }
        return ApprovalService.instance;
    }

    /**
     * Create a new Approval Request
     */
    public createRequest(
        decisionId: string,
        intent: any,
        policyId: string,
        requestedBy: string
    ): ApprovalRequest {
        const timestamp = Date.now();
        const id = `apr-${timestamp}-${Math.random().toString(36).substr(2, 6)}`;

        // Simple hash of intent to bind it
        const intentHash = crypto.createHash('sha256').update(JSON.stringify(intent)).digest('hex');

        const request: ApprovalRequest = {
            id,
            decisionId,
            intentHash,
            policyId,
            description: `Escalation required for policy ${policyId}`,
            requestedBy,
            status: 'pending',
            createdAt: timestamp
        };

        this.requests.set(id, request);
        console.log(`[APPROVAL] Request Created: ${id} for intent hash ${intentHash.substr(0, 8)}`);
        return request;
    }

    /**
     * Approve a request and issue a Token (Human Action)
     */
    public approve(requestId: string, approverId: string): ApprovalToken {
        const request = this.requests.get(requestId);
        if (!request) throw new Error('Request not found');
        if (request.status !== 'pending') throw new Error(`Request is ${request.status}`);

        // Update Request
        const updatedRequest = { ...request, status: 'approved' as const };
        this.requests.set(requestId, updatedRequest);

        // Issue Token
        const now = Date.now();
        const tokenId = `tok-${now}-${Math.random().toString(36).substr(2, 6)}`;

        // Mock Signature logic: Sign(requestId + decisionId + approver)
        const signaturePayload = `${requestId}:${request.decisionId}:${approverId}:${now}`;
        const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');

        const token: ApprovalToken = {
            tokenId,
            requestId,
            decisionId: request.decisionId,
            approverId,
            issuedAt: now,
            expiresAt: now + (5 * 60 * 1000), // 5 mins
            signature
        };

        this.tokens.set(tokenId, token);
        console.log(`[APPROVAL] Token Issued: ${tokenId} by ${approverId}`);
        return token;
    }

    /**
     * Verify a Token for a valid Step-Up
     */
    public verify(token: ApprovalToken, decisionId: string, intent: any): boolean {
        // 1. Existence
        const storedToken = this.tokens.get(token.tokenId);
        if (!storedToken) {
            console.warn('[APPROVAL] Verify Failed: Token not found');
            return false;
        }

        // 2. Correlation
        if (storedToken.decisionId !== decisionId) {
            console.warn('[APPROVAL] Verify Failed: Decision ID mismatch');
            return false;
        }

        // 3. Expiry
        if (Date.now() > storedToken.expiresAt) {
            console.warn('[APPROVAL] Verify Failed: Token expired');
            return false;
        }

        // 4. Intent Integrity (Re-hash assumption)
        // In real world, we'd look up the request and verify the intent matches content
        const request = this.requests.get(storedToken.requestId);
        if (!request) {
            console.warn('[APPROVAL] Verify Failed: Request link broken');
            return false;
        }

        const currentIntentHash = crypto.createHash('sha256').update(JSON.stringify(intent)).digest('hex');
        if (request.intentHash !== currentIntentHash) {
            console.warn('[APPROVAL] Verify Failed: Intent mismatch/tampered');
            return false;
        }

        return true;
    }
}
