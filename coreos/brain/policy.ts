/**
 * Core OS Brain Policy & Quota Engine (Phase 28)
 * Manages automation limits and safe scopes for AI Actions.
 */

export interface AutomationPolicy {
    maxFilesPerDay: number;
    maxBytesPerDay: number;
    allowedPaths: string[]; // Glob patterns (mocked as prefixes)
    allowedActions: string[];
}

export interface DailyUsage {
    date: string;
    filesProcessed: number;
    bytesProcessed: number;
}

const DEFAULT_POLICY: AutomationPolicy = {
    maxFilesPerDay: 50,
    maxBytesPerDay: 100 * 1024 * 1024, // 100MB
    allowedPaths: ['user://documents', 'user://downloads', 'tmp://'],
    allowedActions: ['move', 'rename', 'archive'] // NO permanent delete
};

class PolicyEngine {
    private usage: Map<string, DailyUsage> = new Map(); // Date -> Usage

    private getTodayKey(): string {
        return new Date().toISOString().split('T')[0];
    }

    private getUsage(): DailyUsage {
        const key = this.getTodayKey();
        if (!this.usage.has(key)) {
            this.usage.set(key, { date: key, filesProcessed: 0, bytesProcessed: 0 });
        }
        return this.usage.get(key)!;
    }

    /**
     * Check if an operation is allowed by policy and quota
     */
    checkOperation(action: string, path: string, estimatedSize: number = 1024): void {
        // 1. Path Check
        const isAllowedPath = DEFAULT_POLICY.allowedPaths.some(p => path.startsWith(p));
        if (!isAllowedPath) {
            throw new Error(`POLICY DENIED: Path not in allowed scope (${path})`);
        }

        // 2. Action Check
        if (!DEFAULT_POLICY.allowedActions.includes(action)) {
            throw new Error(`POLICY DENIED: Action '${action}' not allowed on user data`);
        }

        // 3. Quota Check
        const usage = this.getUsage();
        if (usage.filesProcessed + 1 > DEFAULT_POLICY.maxFilesPerDay) {
            throw new Error(`QUOTA EXCEEDED: Daily file limit reached (${DEFAULT_POLICY.maxFilesPerDay})`);
        }
        if (usage.bytesProcessed + estimatedSize > DEFAULT_POLICY.maxBytesPerDay) {
            throw new Error(`QUOTA EXCEEDED: Daily size limit reached`);
        }
    }

    /**
     * Commit usage after successful execution
     */
    commitUsage(count: number, size: number = 1024) {
        const usage = this.getUsage();
        usage.filesProcessed += count;
        usage.bytesProcessed += size;
        console.log(`[Policy] Usage Updated: ${usage.filesProcessed}/${DEFAULT_POLICY.maxFilesPerDay} files`);
    }

    resetUsage() {
        this.usage.clear();
        console.log('[Policy] Usage Reset');
    }

    getStats() {
        return this.getUsage();
    }
}

export const policyEngine = new PolicyEngine();
