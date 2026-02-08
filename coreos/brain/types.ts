/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI BRAIN TYPES (Phase 25A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the contract for interacting with the Core OS "Single Brain".
 * Supporting Request/Response models and Tool definitions.
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
}

export type BrainStatus = 'idle' | 'processing' | 'error';
