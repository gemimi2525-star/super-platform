/**
 * API: Org Detail Insights
 * Returns detailed stats and timeseries for a specific org
 * Platform owner only, all reads audited
 */

import { NextRequest } from 'next/server';
import { requirePlatformAccess } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { logPlatformAccess } from '@/modules/platform';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        // Require platform owner
        const auth = await requirePlatformAccess();
        const { orgId } = await params;

        const db = getAdminFirestore();

        // Get org basic info
        const orgDoc = await db.collection('orgs').doc(orgId).get();
        if (!orgDoc.exists) {
            return ApiErrorResponse.notFound('Organization');
        }

        const orgData = orgDoc.data();

        // Get stats summary
        const statsDoc = await db
            .collection('orgs')
            .doc(orgId)
            .collection('_stats')
            .doc('summary')
            .get();

        const stats = statsDoc.exists ? statsDoc.data() : null;

        // Generate timeseries for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Keywords timeseries (constrained query)
        const keywordsSnapshot = await db
            .collection('orgs')
            .doc(orgId)
            .collection('seo_keywords')
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();

        const keywordsByDay: Record<string, number> = {};
        keywordsSnapshot.docs.forEach(doc => {
            const createdAt = doc.data().createdAt?.toDate();
            if (createdAt) {
                const dateKey = createdAt.toISOString().split('T')[0];
                keywordsByDay[dateKey] = (keywordsByDay[dateKey] || 0) + 1;
            }
        });

        // Pages timeseries (constrained query)
        const pagesSnapshot = await db
            .collection('orgs')
            .doc(orgId)
            .collection('seo_pages')
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();

        const pagesByDay: Record<string, number> = {};
        pagesSnapshot.docs.forEach(doc => {
            const createdAt = doc.data().createdAt?.toDate();
            if (createdAt) {
                const dateKey = createdAt.toISOString().split('T')[0];
                pagesByDay[dateKey] = (pagesByDay[dateKey] || 0) + 1;
            }
        });

        // Convert to arrays and sort
        const keywordsByDayArray = Object.entries(keywordsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));

        const pagesByDayArray = Object.entries(pagesByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));

        // Log access
        await logPlatformAccess({
            actorId: auth.uid,
            action: 'owner.read',
            orgId,
            entityType: 'insights_detail',
            path: `orgs/${orgId}/insights`
        });

        return ApiSuccessResponse.ok({
            orgId,
            orgName: orgData?.name || orgId,
            status: orgData?.status || 'active',
            createdAt: orgData?.createdAt?.toDate?.()?.toISOString() || null,
            stats: {
                keywordsCount: stats?.keywordsCount || 0,
                pagesCount: stats?.pagesCount || 0,
                lastActivityAt: stats?.lastActivityAt?.toDate?.()?.toISOString() || null,
                enabledApps: stats?.enabledApps || []
            },
            timeseries: {
                keywordsByDay: keywordsByDayArray,
                pagesByDay: pagesByDayArray
            }
        });
    } catch (error: any) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to fetch org detail insights [${appError.errorId}]:`, (error as Error).message || String(error));

        // Preserve original 403 vs 500 logic based on error message
        const errorMessage = (error as Error).message || String(error);
        if (errorMessage.includes('Forbidden') || errorMessage.includes('forbidden')) {
            return ApiErrorResponse.forbidden('Forbidden');
        }

        return ApiErrorResponse.internalError();
    }
}
