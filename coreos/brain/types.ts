/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI BRAIN TYPES (Phase 25A → Phase 19 DRAFTER)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the contract for interacting with the Core OS "Single Brain".
 * Supporting Request/Response models, Tool definitions, and Proposal types.
 * 
 * Phase 19: Added ProposalAction for DRAFTER mode (propose-only)
 * 
 * @module coreos/brain/types
 */

import { CapabilityId } from '../types';

export type BrainRole = 'system' | 'user' | 'assistant' | 'tool';

export interface BrainMessage {
    role: BrainRole;
    content: string;
    name?: string; // For function calling
    tool_call_id?: string;
}

export interface BrainRequest {
    appId: string;
    correlationId: string;
    messages: BrainMessage[];
    locale?: string;
    userId?: string;
    context?: Record<string, any>; // Additional context (e.g. selected text)
    shadow?: boolean; // If true, AI observes/explains only (No Execution)
    appScope?: string; // Phase 19: App-scoped context (e.g. 'core.notes')
}

export interface BrainResponse {
    id: string;
    content?: string;
    tool_calls?: BrainToolCall[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Tool Contract
export interface BrainToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface BrainTool {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
    requiredCapabilities: CapabilityId[]; // Security Scope
    handler: (args: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
    appId: string;
    userId: string;
    correlationId: string;
    appScope?: string; // Phase 19: App scope for tool filtering
}

export type BrainStatus = 'idle' | 'processing' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 19: PROPOSAL TYPES (DRAFTER MODE)
// ═══════════════════════════════════════════════════════════════════════════

export type ProposalType = 'rewrite' | 'summarize' | 'structure' | 'organize' | 'recommend';

export interface ProposalAction {
    id: string;
    type: ProposalType;
    appId: string;
    title: string;
    description: string;
    preview?: string;        // ตัวอย่างผลลัพธ์
    confidence: number;      // 0-1
    requiresConfirm: true;   // บังคับเสมอ — ผู้ใช้ต้องยืนยัน
    metadata?: Record<string, any>;
}
