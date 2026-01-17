/**
 * Firestore Collection Names
 *
 * Centralized collection name constants
 */
export declare const COLLECTIONS: {
    readonly ORGANIZATIONS: "organizations";
    readonly USERS: "users";
    readonly MEMBERSHIPS: "memberships";
    readonly ROLES: "roles";
    readonly PERMISSIONS: "permissions";
    readonly AUDIT_LOGS: "auditLogs";
    readonly NOTIFICATIONS: "notifications";
    readonly WORKFLOWS: "workflows";
    readonly FILES: "files";
    readonly SEO_SITES: "seo_sites";
    readonly SEO_PAGES: "seo_pages";
    readonly SEO_KEYWORDS: "seo_keywords";
    readonly SEO_CONTENT: "seo_content";
    readonly CRM_CONTACTS: "crm_contacts";
    readonly CRM_CONVERSATIONS: "crm_conversations";
    readonly HR_EMPLOYEES: "hr_employees";
    readonly HR_ATTENDANCE: "hr_attendance";
    readonly INV_ITEMS: "inv_items";
    readonly INV_ORDERS: "inv_orders";
};
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
//# sourceMappingURL=collections.d.ts.map