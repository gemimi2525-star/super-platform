/**
 * Firestore Collection Names
 * 
 * Centralized collection name constants
 */

// Core Platform Collections
export const COLLECTION_USERS = 'users';
export const COLLECTION_ORGANIZATIONS = 'organizations';
export const COLLECTION_ORGANIZATION_MEMBERS = 'organization_members';
export const COLLECTION_ROLES = 'roles';
export const COLLECTION_PERMISSIONS = 'permissions';
export const COLLECTION_AUDIT_LOGS = 'audit_logs';
export const COLLECTION_NOTIFICATIONS = 'notifications';
export const COLLECTION_WORKFLOWS = 'workflows';

// SEO Module Collections
export const COLLECTION_SEO_SITES = 'seo_sites';
export const COLLECTION_SEO_PAGES = 'seo_pages';
export const COLLECTION_SEO_KEYWORDS = 'seo_keywords';
export const COLLECTION_SEO_ANALYTICS = 'seo_analytics';

// Future Module Collections
// export const COLLECTION_CRM_CONTACTS = 'crm_contacts';
// export const COLLECTION_CRM_DEALS = 'crm_deals';
// export const COLLECTION_INVENTORY_ITEMS = 'inventory_items';

/**
 * Helper function to get collection path
 */
export function getCollectionPath(collection: string, ...segments: string[]): string {
    return [collection, ...segments].join('/');
}
