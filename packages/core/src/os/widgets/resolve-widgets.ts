import { WIDGET_REGISTRY } from '../../../../../config/widget-registry';
import { OSWidgetDefinition } from './types';

export interface ResolveWidgetsOptions {
    enabledFlags: string[];
    userPolicies: string[];
}

/**
 * Resolves accessible widgets for the current user context.
 * Filters by policy and feature flags.
 * Returns sorted widgets by priority.
 */
export function resolveWidgets(options: ResolveWidgetsOptions): OSWidgetDefinition[] {
    const { enabledFlags, userPolicies } = options;

    return WIDGET_REGISTRY.filter(widget => {
        // 1. Check Feature Flags (Entitlements)
        if (widget.requiredFlags && widget.requiredFlags.length > 0) {
            const hasFlags = widget.requiredFlags.every(flag => enabledFlags.includes(flag));
            if (!hasFlags) return false;
        }

        // 2. Check User Policies
        if (widget.requiredPolicies && widget.requiredPolicies.length > 0) {
            const hasPolicies = widget.requiredPolicies.every(policy => userPolicies.includes(policy));
            if (!hasPolicies) return false;
        }

        return true;
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
