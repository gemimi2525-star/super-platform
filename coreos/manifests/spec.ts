/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP MANIFEST SPECIFICATION (Phase 24A.1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the strict schema for Third-Party Applications running on Core OS.
 * - Must be declared BEFORE installation
 * - Immutable identity (appId)
 * - Explicit capability requests
 * 
 * @module coreos/manifests/spec
 */

import type { CapabilityId } from '../types';

/**
 * Supported Update Channels
 */
export type UpdateChannel = 'stable' | 'beta' | 'dev';

/**
 * Window Role for the App's main window
 */
export type AppWindowRole = 'APP' | 'UTILITY' | 'PANEL';

/**
 * Application Manifest Schema
 * The source of truth for an application's identity and capabilities.
 */
export interface AppManifest {
    // ── IDENTITY ─────────────────────────────────────────────────────────────
    /** Globally unique identifier (reverse domain: com.example.app) */
    readonly appId: string;

    /** Human-readable display name */
    readonly name: string;

    /** Publisher/Organization name */
    readonly publisher: string;

    /** Semantic Version (e.g. 1.0.0) */
    readonly version: string;

    /** Short description */
    readonly description?: string;

    /** Icon URL or Base64 */
    readonly icon?: string;

    // ── RUNTIME CONFIG ───────────────────────────────────────────────────────
    /** Entry point module/script (e.g., 'index.js') */
    readonly entry: string;

    /** Main window configuration */
    readonly window: {
        readonly defaultRole: AppWindowRole;
        readonly width?: number;
        readonly height?: number;
        readonly minWidth?: number;
        readonly minHeight?: number;
        readonly resizable?: boolean;
    };

    // ── GOVERNANCE & SECURITY ────────────────────────────────────────────────
    /** 
     * Capabilities requested by the app.
     * Core OS will verify these against the Trust Policy during installation.
     */
    readonly capabilitiesRequested: readonly CapabilityId[];

    /**
     * Filesystem scopes requested (e.g., 'app://data', 'user://documents')
     * 'app://data' is usually granted by default to the app's own sandbox.
     */
    readonly storageScopes: readonly string[];

    /**
     * Worker types requested (for background processing)
     */
    readonly workers: readonly string[];

    // ── LIFECYCLE ────────────────────────────────────────────────────────────
    /** Preferred update channel */
    readonly updateChannel: UpdateChannel;

    /** Minimum Core OS version required */
    readonly minCoreVersion?: string;
}

/**
 * App Package Structure
 * Represents the signed bundle distributed to the OS.
 */
export interface AppPackage {
    readonly manifest: AppManifest;

    /** 
     * Integrity Checksum (SHA-256) of the bundle 
     * Used to verify that the code hasn't been tampered with.
     */
    readonly checksum: string;

    /**
     * Cryptographic Signature (Phase 24A.2)
     * Signed by the Publisher's private key.
     */
    readonly signature?: string;

    /**
     * Code Bundle (path or content reference)
     * In a real system, this would be a zip/tarball. 
     * For this runtime, it might be a module path.
     */
    readonly bundle: string;

    /**
     * Installation Metadata
     */
    readonly metadata?: {
        readonly installDate: number;
        readonly installSource: string;
    };
}
