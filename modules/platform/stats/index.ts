/**
 * Platform Stats Updater
 * 
 * Maintains orgs/{orgId}/_stats/summary accuracy
 * Uses Firestore atomic operations (increment, serverTimestamp)
 * Thread-safe สำหรับสถานการณ์ concurrent writes
 */

import {
    doc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
    getDoc
} from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { handleError } from '@super-platform/core';

interface StatsUpdate {
    keywordsCount?: number;
    pagesCount?: number;
    lastActivityAt?: ReturnType<typeof serverTimestamp>;
    enabledApps?: string[];
}

/**
 * ตรวจสอบว่า summary doc มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
 */
async function ensureStatsSummary(orgId: string): Promise<void> {
    const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
        // สร้าง summary doc ใหม่ด้วย default values
        await setDoc(statsRef, {
            keywordsCount: 0,
            pagesCount: 0,
            lastActivityAt: serverTimestamp(),
            enabledApps: [],
            createdAt: serverTimestamp()
        });
        console.log(`[STATS] Created summary for org: ${orgId}`);
    }
}

/**
 * เพิ่ม/ลด keywords count (atomic)
 * delta: +1 สำหรับ create, -1 สำหรับ delete, +N สำหรับ CSV import
 */
export async function incrementKeywords(orgId: string, delta: number = 1): Promise<void> {
    try {
        await ensureStatsSummary(orgId);

        const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');

        await updateDoc(statsRef, {
            keywordsCount: increment(delta),
            lastActivityAt: serverTimestamp()
        });

        console.log(`[STATS] Keywords updated for ${orgId}: delta=${delta}`);
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[STATS] Failed to increment keywords [${appError.errorId}]:`, (error as Error).message || String(error));
        // ไม่ throw เพื่อไม่ให้การอัพเดท stats ทำให้ operation หลักล้มเหลว
    }
}

/**
 * เพิ่ม/ลด pages count (atomic)
 */
export async function incrementPages(orgId: string, delta: number = 1): Promise<void> {
    try {
        await ensureStatsSummary(orgId);

        const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');

        await updateDoc(statsRef, {
            pagesCount: increment(delta),
            lastActivityAt: serverTimestamp()
        });

        console.log(`[STATS] Pages updated for ${orgId}: delta=${delta}`);
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[STATS] Failed to increment pages [${appError.errorId}]:`, (error as Error).message || String(error));
    }
}

/**
 * อัพเดท lastActivityAt timestamp
 */
export async function setLastActivity(orgId: string): Promise<void> {
    try {
        await ensureStatsSummary(orgId);

        const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');

        await updateDoc(statsRef, {
            lastActivityAt: serverTimestamp()
        });

        console.log(`[STATS] LastActivityAt updated for ${orgId}`);
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[STATS] Failed to set last activity [${appError.errorId}]:`, (error as Error).message || String(error));
    }
}

/**
 * อัพเดท enabled apps array
 */
export async function setEnabledApps(orgId: string, enabledApps: string[]): Promise<void> {
    try {
        await ensureStatsSummary(orgId);

        const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');

        await updateDoc(statsRef, {
            enabledApps,
            lastActivityAt: serverTimestamp()
        });

        console.log(`[STATS] Enabled apps updated for ${orgId}:`, enabledApps);
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[STATS] Failed to set enabled apps [${appError.errorId}]:`, (error as Error).message || String(error));
    }
}

/**
 * ตรวจสอบความถูกต้องของ stats (สำหรับ QA)
 * เปรียบเทียบ summary vs การนับจริง
 */
export async function verifyStatsConsistency(orgId: string): Promise<{
    consistent: boolean;
    summary: { keywordsCount: number; pagesCount: number };
    actual: { keywordsCount: number; pagesCount: number };
    drift: { keywords: number; pages: number };
}> {
    try {
        const statsRef = doc(db, 'orgs', orgId, '_stats', 'summary');
        const statsDoc = await getDoc(statsRef);

        const summary = {
            keywordsCount: statsDoc.data()?.keywordsCount || 0,
            pagesCount: statsDoc.data()?.pagesCount || 0
        };

        // นับจำนวนจริงจาก collection (อาจช้าในกรณีข้อมูลเยอะ)
        const { getDocs, collection } = await import('@/lib/firebase');

        const keywordsSnapshot = await getDocs(
            collection(db, 'orgs', orgId, 'seo_keywords')
        );
        const pagesSnapshot = await getDocs(
            collection(db, 'orgs', orgId, 'seo_pages')
        );

        const actual = {
            keywordsCount: keywordsSnapshot.size,
            pagesCount: pagesSnapshot.size
        };

        const drift = {
            keywords: actual.keywordsCount - summary.keywordsCount,
            pages: actual.pagesCount - summary.pagesCount
        };

        return {
            consistent: drift.keywords === 0 && drift.pages === 0,
            summary,
            actual,
            drift
        };
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[STATS] Verification failed [${appError.errorId}]:`, (error as Error).message || String(error));
        throw error;
    }
}
