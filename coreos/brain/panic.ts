/**
 * Core OS Panic Control (Phase 33)
 * Emergency Kill Switches and AI Mode Governance.
 */

export class PanicControl {
    private globalKillSwitch: boolean = false;
    private deptKillSwitch: Map<string, boolean> = new Map();

    /**
     * Emergency Interface
     */
    activateKillSwitch(scope: 'GLOBAL' | string) {
        if (scope === 'GLOBAL') {
            this.globalKillSwitch = true;
            console.error('[PanicControl] 🟥 GLOBAL KILL SWITCH ACTIVATED');
        } else {
            this.deptKillSwitch.set(scope, true);
            console.error(`[PanicControl] 🟧 Kill Switch Activated for ${scope}`);
        }
    }

    resetKillSwitch(scope: 'GLOBAL' | string) {
        if (scope === 'GLOBAL') {
            this.globalKillSwitch = false;
            console.log('[PanicControl] 🟩 Global AI Restored');
        } else {
            this.deptKillSwitch.set(scope, false);
            console.log(`[PanicControl] 🟩 AI Restored for ${scope}`);
        }
    }

    /**
     * Check if operations are allowed
     */
    checkHealth(dept?: string): boolean {
        if (this.globalKillSwitch) {
            throw new Error('PANIC BLOCK: Global Kill Switch is ACTIVE');
        }
        if (dept && this.deptKillSwitch.get(dept)) {
            throw new Error(`PANIC BLOCK: Kill Switch ACTIVE for ${dept}`);
        }
        return true;
    }
}

export const panicControl = new PanicControl();
