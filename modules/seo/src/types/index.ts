/**
 * SEO Module Type Definitions
 */

// ==================== Site ====================

export interface Site {
    id: string;
    organizationId: string;
    name: string;
    domain: string;
    url: string;
    status: 'active' | 'inactive' | 'pending';
    settings?: {
        gscConnected?: boolean;
        gscPropertyUrl?: string;
        gaConnected?: boolean;
        gaPropertyId?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export type CreateSiteInput = Omit<Site, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSiteInput = Partial<Omit<Site, 'id' | 'organizationId' | 'createdAt' | 'createdBy'>>;

// ==================== Page ====================

export interface Page {
    id: string;
    siteId: string;
    organizationId: string;
    url: string;
    path: string;
    title?: string;
    metaDescription?: string;
    h1?: string;
    status: 'published' | 'draft' | 'archived';
    seo?: {
        titleTag?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };
    metrics?: {
        wordCount?: number;
        lastCrawled?: Date;
        lastIndexed?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export type CreatePageInput = Omit<Page, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePageInput = Partial<Omit<Page, 'id' | 'siteId' | 'organizationId' | 'createdAt' | 'createdBy'>>;

// ==================== Keyword ====================

export interface Keyword {
    id: string;
    pageId: string;
    organizationId: string;
    term: string;
    targetUrl?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'tracking' | 'paused';
    ranking?: {
        currentPosition?: number;
        previousPosition?: number;
        bestPosition?: number;
        lastChecked?: Date;
    };
    metrics?: {
        searchVolume?: number;
        difficulty?: number;
        cpc?: number;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export type CreateKeywordInput = Omit<Keyword, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateKeywordInput = Partial<Omit<Keyword, 'id' | 'pageId' | 'organizationId' | 'createdAt' | 'createdBy'>>;

// ==================== Analytics ====================

export interface AnalyticsMetrics {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
}

export interface PageAnalytics {
    id: string;
    pageId: string;
    organizationId: string;
    date: Date;
    metrics: AnalyticsMetrics;
    source: 'gsc' | 'ga' | 'manual';
    createdAt: Date;
}

export interface KeywordAnalytics {
    id: string;
    keywordId: string;
    organizationId: string;
    date: Date;
    metrics: AnalyticsMetrics;
    rank: number;
    rankChange?: number;
    source: 'gsc' | 'semrush' | 'ahrefs' | 'manual';
    createdAt: Date;
}

// ==================== Filters & Options ====================

export interface DateRange {
    start: Date;
    end: Date;
}

export interface PaginationOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
}

export interface SiteFilters extends PaginationOptions {
    status?: Site['status'];
    search?: string;
}

export interface PageFilters extends PaginationOptions {
    status?: Page['status'];
    search?: string;
}

export interface KeywordFilters extends PaginationOptions {
    priority?: Keyword['priority'];
    status?: Keyword['status'];
    search?: string;
}
