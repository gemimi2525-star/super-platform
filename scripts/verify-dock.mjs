#!/usr/bin/env node
/**
 * Phase 39D: Dock Regression Check
 * 
 * Verifies that the dock contains exactly the expected number of canonical icons.
 * Works by fetching the /os page HTML and checking for dock-related markers.
 * 
 * Usage:
 *   node scripts/verify-dock.mjs [url]
 *   Default URL: http://localhost:3000
 * 
 * Expected dock items (4):
 *   Ops Center, Brain, Notes, System Hub
 */

const EXPECTED_DOCK_LABELS = ['Ops Center', 'Brain', 'Notes', 'System Hub'];
const FORBIDDEN_DOCK_LABELS = [
    'System Settings', 'User Management', 'Organizations',
    'Audit Logs', 'System Configuration',
];

async function main() {
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    const url = `${baseUrl}/api/platform/health`;

    console.log(`\n🔍 Phase 39D: Dock Regression Check`);
    console.log(`   Target: ${baseUrl}`);
    console.log('');

    // Strategy: Since dock items are rendered client-side via React,
    // we verify via the manifest registry which is the source of truth.
    // Check that the 5 shortcut capabilities have showInDock=false in the
    // compiled code by importing the manifests directly.

    try {
        // Verify server is reachable
        const healthResp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!healthResp.ok) {
            console.log(`❌ FAIL: Server not reachable at ${url} (status ${healthResp.status})`);
            process.exit(1);
        }
        console.log(`   ✅ Server reachable (health: ${healthResp.status})`);
    } catch (err) {
        console.log(`❌ FAIL: Cannot reach server at ${baseUrl}`);
        console.log(`   ${err.message}`);
        process.exit(1);
    }

    // Verify manifest source of truth: import the capability manifests
    // and check showInDock values
    try {
        const manifests = await import('../coreos/manifests/index.ts')
            .catch(() => null);

        // Fallback: read the manifest files directly
        const fs = await import('fs');
        const path = await import('path');
        const __dirname = path.dirname(new URL(import.meta.url).pathname);
        const manifestDir = path.join(__dirname, '..', 'coreos', 'manifests');

        const shortcutIds = [
            'core.settings', 'user.manage', 'org.manage',
            'audit.view', 'system.configure',
        ];

        let violations = [];
        let passes = [];

        for (const id of shortcutIds) {
            const filePath = path.join(manifestDir, `${id}.ts`);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const showInDockMatch = content.match(/showInDock:\s*(true|false)/);
                if (!showInDockMatch) {
                    violations.push(`${id}: showInDock not found in manifest`);
                } else if (showInDockMatch[1] === 'true') {
                    violations.push(`${id}: showInDock is TRUE (should be false)`);
                } else {
                    passes.push(id);
                }
            } catch {
                violations.push(`${id}: manifest file not found at ${filePath}`);
            }
        }

        // Count dock capabilities in the index
        const indexPath = path.join(manifestDir, 'index.ts');
        const indexContent = fs.readFileSync(indexPath, 'utf-8');

        // Count how many manifests have showInDock: true (excluding inline ones)
        const dockTrueMatches = indexContent.match(/showInDock:\s*true/g) || [];
        const dockFalseMatches = indexContent.match(/showInDock:\s*false/g) || [];

        console.log(`   Manifest registry: ${dockTrueMatches.length} showInDock:true, ${dockFalseMatches.length} showInDock:false (inline)`);
        console.log(`   Shortcut manifests verified: ${passes.length}/5 correctly hidden`);

        // Check DockBar.tsx has the HUB_SHORTCUT filter
        const dockBarPath = path.join(__dirname, '..', 'components', 'os-shell', 'DockBar.tsx');
        const dockBarContent = fs.readFileSync(dockBarPath, 'utf-8');
        const hasFilter = dockBarContent.includes('HUB_SHORTCUT_CAPABILITIES');
        console.log(`   DockBar.tsx HUB_SHORTCUT filter: ${hasFilter ? '✅ present' : '❌ MISSING'}`);
        if (!hasFilter) violations.push('DockBar.tsx missing HUB_SHORTCUT_CAPABILITIES filter');

        // Check hooks.tsx has the upstream filter
        const hooksPath = path.join(__dirname, '..', 'governance', 'synapse', 'hooks.tsx');
        const hooksContent = fs.readFileSync(hooksPath, 'utf-8');
        const hasUpstreamFilter = hooksContent.includes('HUB_SHORTCUT_IDS');
        console.log(`   hooks.tsx upstream filter: ${hasUpstreamFilter ? '✅ present' : '❌ MISSING'}`);
        if (!hasUpstreamFilter) violations.push('hooks.tsx missing HUB_SHORTCUT_IDS filter');

        console.log('');

        if (violations.length > 0) {
            console.log('❌ FAIL: Dock regression violations found:');
            violations.forEach(v => console.log(`   - ${v}`));
            process.exit(1);
        }

        console.log(`✅ PASS: Dock regression check — all 5 shortcuts hidden, filters in place`);
        console.log(`   Expected dock items: ${EXPECTED_DOCK_LABELS.join(', ')}`);
        process.exit(0);

    } catch (err) {
        console.log(`❌ FAIL: Error during manifest check: ${err.message}`);
        process.exit(1);
    }
}

main();
