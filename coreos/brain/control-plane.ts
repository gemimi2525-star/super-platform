/**
 * Core OS Control Plane (Phase 31)
 * Admin Interface for Managing AI Adoption & Scope per Department.
 */

export interface DepartmentConfig {
    id: string; // 'finance', 'hr', 'sales'
    aiEnabled: boolean;
    quotaPerDay: number;
    allowedTools: string[];
}

class ControlPlane {
    private departments: Map<string, DepartmentConfig> = new Map();

    constructor() {
        // Default Configs
        this.setDepartmentConfig('finance', {
            id: 'finance',
            aiEnabled: true,
            quotaPerDay: 100,
            allowedTools: ['execute_create_accounting_draft', 'execute_business_analyze']
        });

        this.setDepartmentConfig('hr', {
            id: 'hr',
            aiEnabled: false, // Default OFF
            quotaPerDay: 0,
            allowedTools: []
        });
    }

    setDepartmentConfig(deptId: string, config: DepartmentConfig) {
        this.departments.set(deptId, config);
        console.log(`[ControlPlane] Config updated for ${deptId}: AI=${config.aiEnabled}`);
    }

    isAIEnabled(deptId: string): boolean {
        return this.departments.get(deptId)?.aiEnabled ?? false;
    }

    checkAccess(deptId: string, toolName: string) {
        const config = this.departments.get(deptId);
        if (!config) throw new Error(`Unknown Department: ${deptId}`);

        if (!config.aiEnabled) {
            throw new Error(`POLICY BLOCK: AI is disabled for ${deptId}`);
        }

        if (!config.allowedTools.includes(toolName)) {
            throw new Error(`POLICY BLOCK: Tool ${toolName} not allowed for ${deptId}`);
        }
    }
}

export const controlPlane = new ControlPlane();
