/**
 * Dashboard Module Types
 */

export interface DashboardModule {
    id: string;
    name: string;
    description: string;
    icon: string;
    href: string;
    color: string;
    enabled: boolean;
}

export interface DashboardStats {
    organizations: number;
    users: number;
    scans: number;
    lastUpdated: Date;
}
