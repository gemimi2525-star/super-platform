/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UPDATE SERVICE (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages the client-side update lifecycle:
 * Check -> Download -> Verify -> Stage
 * 
 * @module coreos/system/update/service
 */

import { UpdateState, UpdateManifest, UpdateChannel } from './types';

// Initial State
const INITIAL_STATE: UpdateState = {
    status: 'upt',
    currentVersion: '1.0.0', // Current OS Version
    channel: 'stable'
};

class UpdateService {
    private state: UpdateState = { ...INITIAL_STATE };
    private listeners: ((state: UpdateState) => void)[] = [];

    // Mock Remote Repository
    private MOCK_REPO: Record<UpdateChannel, UpdateManifest | null> = {
        stable: null,
        beta: {
            releaseId: 'rel-2.0.0-beta',
            version: '2.0.0-beta.1',
            channel: 'beta',
            releaseDate: Date.now(),
            notes: 'Testing new OTA features.',
            critical: false,
            components: [],
            checksum: 'sha256:mock-beta'
        },
        dev: {
            releaseId: 'rel-2.1.0-dev',
            version: '2.1.0-dev.5',
            channel: 'dev',
            releaseDate: Date.now(),
            notes: 'Internal build with debug tools.',
            critical: false,
            components: [],
            checksum: 'sha256:mock-dev'
        }
    };

    /**
     * Subscribe to state updates
     */
    subscribe(listener: (state: UpdateState) => void) {
        this.listeners.push(listener);
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private emit() {
        this.listeners.forEach(l => l(this.state));
    }

    /**
     * Check for updates
     */
    async checkForUpdates() {
        console.log(`[OTA] Checking for updates on channel: ${this.state.channel}`);
        this.state.status = 'chk';
        this.emit();

        // Simulate Network Latency
        await new Promise(resolve => setTimeout(resolve, 1000));

        const update = this.MOCK_REPO[this.state.channel];

        if (update && update.version !== this.state.currentVersion) {
            // Found update
            this.state.status = 'avl';
            this.state.availableUpdate = update;
            console.log(`[OTA] Update available: ${update.version}`);
        } else {
            // Up to date
            this.state.status = 'upt';
            this.state.availableUpdate = undefined;
            console.log(`[OTA] System is up to date.`);
        }
        this.emit();
    }

    /**
     * Download and Verify
     */
    async downloadUpdate() {
        if (this.state.status !== 'avl' || !this.state.availableUpdate) {
            throw new Error('No update available to download');
        }

        console.log(`[OTA] Downloading update...`);
        this.state.status = 'dwn';
        this.state.progress = 0;
        this.emit();

        // Simulate Download Progress
        for (let i = 0; i <= 100; i += 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.state.progress = i;
            this.emit();
        }

        // Verify Integrity (Mock)
        console.log(`[OTA] Verifying checksum: ${this.state.availableUpdate.checksum}`);
        // if (checksum(downloaded) !== expected) ...

        this.state.status = 'rdy';
        this.state.progress = undefined;
        console.log(`[OTA] Update ready to install.`);
        this.emit();
    }

    /**
     * Set preferred channel
     */
    setChannel(channel: UpdateChannel) {
        if (this.state.channel !== channel) {
            console.log(`[OTA] Switching channel: ${this.state.channel} -> ${channel}`);
            this.state.channel = channel;
            this.checkForUpdates(); // Auto-check on switch
        }
    }

    /**
     * Apply Update (Transition to Installer)
     */
    async applyUpdate() {
        if (this.state.status !== 'rdy') {
            throw new Error('Update not ready');
        }

        return this.state.availableUpdate;
    }

    /**
     * Reset State (Simulate Rollback or Complete)
     */
    reset(version?: string) {
        this.state.status = 'upt';
        this.state.availableUpdate = undefined;
        if (version) this.state.currentVersion = version;
        this.emit();
    }

    // For Verification Script to inject mocks
    _injectMockUpdate(channel: UpdateChannel, manifest: UpdateManifest) {
        this.MOCK_REPO[channel] = manifest;
    }
}

export const updateService = new UpdateService();
