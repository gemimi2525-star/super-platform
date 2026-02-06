/**
 * Phase 16: SDK Types
 */

import type { Capability } from '../runtime/types';

// ═══════════════════════════════════════════════════════════════════════════
// SDK Result Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SDKResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    traceId: string;
    opId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// File System
// ═══════════════════════════════════════════════════════════════════════════

export interface FSReadOptions {
    path: string;
    encoding?: 'utf8' | 'base64';
    [key: string]: unknown;
}

export interface FSWriteOptions {
    path: string;
    data: string | ArrayBuffer;
    encoding?: 'utf8' | 'base64';
    [key: string]: unknown;
}

export interface FSReadResult {
    path: string;
    data: string | ArrayBuffer;
    size: number;
}

export interface FSWriteResult {
    path: string;
    bytesWritten: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════════════════════

export interface UINotifyOptions {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    [key: string]: unknown;
}

export interface UIWindowOptions {
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
    [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// Network
// ═══════════════════════════════════════════════════════════════════════════

export interface NetFetchOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string | object;
    [key: string]: unknown;
}

export interface NetFetchResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Bridge Config
// ═══════════════════════════════════════════════════════════════════════════

export interface BridgeConfig {
    appId: string;
    grantedCapabilities: Capability[];
}
