/**
 * API: Platform Insights
 * Returns aggregated stats for all orgs
 * Uses _stats/summary for performance (no full collection scans)
 */

import { NextResponse } from 'next/server';
import { requirePlatformOwner } from '@/lib/auth/server';
import { getAdminFirestore } from '@platform/firebase-admin';
import { logPlatformAccess } from '@modules/platform';

export async function GET() {
    try {
        // Require platform owner
        const auth = await requirePlatformOwner();

        const db = getAdminFirestore();

        // Get all orgs
        const orgsSnapshot = await db.collection('orgs').get();

        let totalKeywords = 0;
        let totalPages = 0;
        const orgStats = [];

        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;
            const orgData = orgDoc.data();

            // Read stats summary (lightweight)
            const statsDoc = await db
                .collection('orgs')
                .doc(orgId)
                .collection('_stats')
                .doc('summary')
                .get();

            const stats = statsDoc.exists ? statsDoc.data() : null;
            const keywordsCount = stats?.keywordsCount || 0;
            const pagesCount = stats?.pagesCount || 0;
            const lastActivityAt = stats?.lastActivityAt || null;
            const enabledApps = stats?.enabledApps || [];

            totalKeywords += keywordsCount;
            totalPages += pagesCount;

            // Determine health
            let health = 'no_data';
            if (lastActivityAt) {
                const daysSinceActivity = (Date.now() - lastActivityAt.toMillis()) / (1000 * 60 * 60 * 24);
                health = daysSinceActivity < 7 ? 'active' : 'low_activity';
            }

            orgStats.push({
                orgId,
                orgName: orgData.name || orgId,
                keywordsCount,
                pagesCount,
                lastActivityAt: lastActivityAt?.toDate?.()?.toISOString() || null,
                enabledApps,
                health
            });

            // Log access for this org
            await logPlatformAccess({
                actorId: auth.uid,
                action: 'owner.read',
                orgId,
                entityType: 'stats',
                path: `orgs/${orgId}/_stats/summary`
            });
        }

        // Get recent audit events (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const auditSnapshot = await db
            .collection('platform_audit_logs')
            .where('timestamp', '>=', sevenDaysAgo)
            .get();

        return NextResponse.json({
            totalOrgs: orgsSnapshot.size,
            totalKeywords,
            totalPages,
            recentAuditEvents: auditSnapshot.size,
            orgStats
        });
    } catch (error: any) {
        console.error('[API] Failed to fetch insights:', error);
        return NextResponse.json({
            error: error.message
        }, { status: error.message.includes('Forbidden') ? 403 : 500 });
    }
}
