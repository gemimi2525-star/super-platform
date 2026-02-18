/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET/POST /api/ops/vfs-duplicates — VFS Duplicate Report (Phase 37B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only endpoint for VFS duplicate name management.
 *
 * GET  → Returns last scan result status and metadata
 * POST → Accepts scan results from browser (OPFS is client-side)
 *
 * @module app/api/ops/vfs-duplicates/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY SCAN RESULT STORE (server-side, per-deployment)
// ═══════════════════════════════════════════════════════════════════════════

interface StoredScanResult {
    scannedDirs: number;
    totalEntries: number;
    duplicateCount: number;
    duplicateGroups: any[];
    scope: string;
    timestamp: number;
    submittedBy: string;
}

let lastScanResult: StoredScanResult | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// GET — Retrieve last scan status
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        return NextResponse.json({
            ok: true,
            data: {
                available: true,
                description: 'VFS Duplicate Scanner — client-side OPFS scan with server-side result storage',
                lastScan: lastScanResult
                    ? {
                        timestamp: lastScanResult.timestamp,
                        scope: lastScanResult.scope,
                        scannedDirs: lastScanResult.scannedDirs,
                        totalEntries: lastScanResult.totalEntries,
                        duplicateCount: lastScanResult.duplicateCount,
                        submittedBy: lastScanResult.submittedBy,
                    }
                    : null,
            },
        });
    } catch (error: any) {
        console.error('[API/ops/vfs-duplicates] GET error:', error?.message);
        return NextResponse.json(
            { ok: false, error: 'Internal error' },
            { status: 500 },
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST — Store scan results from browser
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const body = await request.json();

        // Validate required fields
        if (
            typeof body.scannedDirs !== 'number' ||
            typeof body.totalEntries !== 'number' ||
            !Array.isArray(body.duplicateGroups)
        ) {
            return NextResponse.json(
                { ok: false, error: 'Invalid scan result format' },
                { status: 400 },
            );
        }

        lastScanResult = {
            scannedDirs: body.scannedDirs,
            totalEntries: body.totalEntries,
            duplicateCount: body.duplicateGroups.length,
            duplicateGroups: body.duplicateGroups,
            scope: body.scope || 'unknown',
            timestamp: body.timestamp || Date.now(),
            submittedBy: guard.uid,
        };

        console.info('[API/ops/vfs-duplicates] Scan result stored:', {
            scope: lastScanResult.scope,
            duplicateCount: lastScanResult.duplicateCount,
            submittedBy: lastScanResult.submittedBy,
        });

        return NextResponse.json({
            ok: true,
            data: {
                stored: true,
                duplicateCount: lastScanResult.duplicateCount,
                timestamp: lastScanResult.timestamp,
            },
        });
    } catch (error: any) {
        console.error('[API/ops/vfs-duplicates] POST error:', error?.message);
        return NextResponse.json(
            { ok: false, error: 'Internal error' },
            { status: 500 },
        );
    }
}
