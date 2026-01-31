import React from 'react';

/**
 * OS Widget Contract
 * Defines how a dashboard widget connects to the OS.
 */

export type OSWidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface OSWidgetDefinition {
    /** Unique identifier for the widget */
    widgetId: string;
    /** Display title of the widget */
    title: string;
    /** Optional description */
    description?: string;
    /** Size of the widget on the grid */
    size: OSWidgetSize;
    /** Policies required to view this widget */
    requiredPolicies?: string[];
    /** Feature flags (entitlements) required for this widget */
    requiredFlags?: string[];
    /** The React component to render */
    render: React.ComponentType<any>;
    /** Optional priority for default ordering (higher = first) */
    priority?: number;
}
