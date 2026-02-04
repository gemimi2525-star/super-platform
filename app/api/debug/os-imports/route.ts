/**
 * Debug API endpoint to test OSShell component imports
 * This runs server-side and reports which imports fail
 */

export const dynamic = 'force-dynamic';

export async function GET() {
    const results: Record<string, string> = {};

    // Test each component import
    const testImport = async (name: string, importFn: () => Promise<any>, exportName: string) => {
        try {
            const mod = await importFn();
            const exists = exportName === 'default'
                ? !!mod.default
                : !!mod[exportName];
            results[name] = exists ? 'OK' : `UNDEFINED (no .${exportName})`;
        } catch (e: any) {
            results[name] = `ERROR: ${e.message}`;
        }
    };

    // Test core shell components
    await testImport('CalmDesktop', () => import('@/components/os-shell/CalmDesktop'), 'CalmDesktop');
    await testImport('TopBar', () => import('@/components/os-shell/TopBar'), 'TopBar');
    await testImport('DockBar', () => import('@/components/os-shell/DockBar'), 'DockBar');
    await testImport('WindowChrome', () => import('@/components/os-shell/WindowChrome'), 'WindowChrome');
    await testImport('StepUpModal', () => import('@/components/os-shell/StepUpModal'), 'StepUpModal');
    await testImport('SystemLogPanel', () => import('@/components/os-shell/SystemLogPanel'), 'SystemLogPanel');
    await testImport('ServiceWorkerRegistration', () => import('@/components/os-shell/ServiceWorkerRegistration'), 'ServiceWorkerRegistration');

    // Test OSShell itself
    await testImport('OSShell (default)', () => import('@/components/os-shell/OSShell'), 'default');
    await testImport('OSShell (named)', () => import('@/components/os-shell/OSShell'), 'OSShell');

    // Test synapse hooks
    await testImport('useWindows', () => import('@/governance/synapse'), 'useWindows');
    await testImport('useKernelBootstrap', () => import('@/governance/synapse'), 'useKernelBootstrap');
    await testImport('useSystemState', () => import('@/governance/synapse'), 'useSystemState');

    // Test app registry
    await testImport('getAppComponent', () => import('@/components/os-shell/apps/registry'), 'getAppComponent');

    return Response.json(results, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
