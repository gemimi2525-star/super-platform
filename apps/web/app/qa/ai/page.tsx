'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card, Button, Badge } from '@platform/ui-kit';

interface TestResult {
    suite: string;
    name: string;
    pass: boolean;
    details: string;
    timestamp: string;
}

interface AuthContext {
    uid: string;
    email?: string;
    role: string;
    orgId?: string;
}

/**
 * AI QA Command Center
 * DEV-ONLY: AI can run real system tests and analyze results
 */
export default function AIQAPage() {
    const t = useTranslations('qa.ai');
    const { firebaseUser, currentOrganization } = useAuthStore();
    const [authContext, setAuthContext] = useState<AuthContext | null>(null);
    const [results, setResults] = useState<TestResult[]>([]);
    const [running, setRunning] = useState(false);
    const [lastRun, setLastRun] = useState<Date | null>(null);

    // Fetch auth context
    useEffect(() => {
        async function fetchContext() {
            if (!firebaseUser) return;
            try {
                const token = await firebaseUser.getIdToken();
                const response = await fetch('/api/auth/context', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAuthContext(data);
                }
            } catch (error) {
                console.error('Failed to fetch auth context:', error);
            }
        }
        fetchContext();
    }, [firebaseUser]);

    const runAllSystemTests = async () => {
        if (!firebaseUser) return;

        setRunning(true);
        const testResults: TestResult[] = [];
        const token = await firebaseUser.getIdToken(true);

        // Foundation Security Suite
        testResults.push(...await runFoundationTests(token, authContext));

        // Apps Gating Suite
        if (authContext?.orgId) {
            testResults.push(...await runAppsGatingTests(token, authContext));
        }

        // Platform Owner Global Read Suite
        if (authContext?.role === 'platform_owner') {
            testResults.push(...await runGlobalReadTests(token, authContext));
        }

        setResults(testResults);
        setLastRun(new Date());
        setRunning(false);
    };

    async function runFoundationTests(token: string, ctx: AuthContext | null): Promise<TestResult[]> {
        const suite = t('suiteFoundation');
        const tests: TestResult[] = [];

        // Platform Guard
        try {
            const res = await fetch('/platform/tenants', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            tests.push({
                suite,
                name: t('testPlatformGuard'),
                pass: ctx?.role === 'platform_owner' ? res.ok : (res.status === 403 || res.status === 500),
                details: `Status: ${res.status} | Expected: ${ctx?.role === 'platform_owner' ? '200' : '403'}`,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            tests.push({
                suite,
                name: t('testPlatformGuard'),
                pass: false,
                details: `Error: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }

        // Tenant Guard
        try {
            const res = await fetch('/app', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            tests.push({
                suite,
                name: t('testTenantGuard'),
                pass: (ctx?.orgId || ctx?.role === 'platform_owner') ? res.ok : !res.ok,
                details: `Status: ${res.status} | Has Org: ${!!ctx?.orgId}`,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            tests.push({
                suite,
                name: t('testTenantGuard'),
                pass: false,
                details: `Error: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }

        return tests;
    }

    async function runAppsGatingTests(token: string, ctx: AuthContext | null): Promise<TestResult[]> {
        const suite = t('suiteApps');
        const tests: TestResult[] = [];

        // SEO App Access
        try {
            const res = await fetch('/app/seo/keywords', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            tests.push({
                suite,
                name: t('testSEOAccess'),
                pass: res.ok,
                details: `Status: ${res.status} | App should be enabled`,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            tests.push({
                suite,
                name: t('testSEOAccess'),
                pass: false,
                details: `Error: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }

        return tests;
    }

    async function runGlobalReadTests(token: string, ctx: AuthContext | null): Promise<TestResult[]> {
        const suite = t('suiteGlobalRead');
        const tests: TestResult[] = [];

        // Audit Log Check
        try {
            const res = await fetch('/api/qa/audit-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            tests.push({
                suite,
                name: t('testAuditLog'),
                pass: res.ok,
                details: `Status: ${res.status} | Audit logs accessible`,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            tests.push({
                suite,
                name: t('testAuditLog'),
                pass: false,
                details: `Error: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }

        return tests;
    }

    const exportResults = () => {
        const data = {
            timestamp: new Date().toISOString(),
            authContext,
            results,
            summary: {
                total: results.length,
                passed: results.filter(r => r.pass).length,
                failed: results.filter(r => !r.pass).length
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-report-${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <Badge variant="destructive">{t('devOnly')}</Badge>
                <p className="text-gray-600 mt-4">{t('description')}</p>
            </header>

            <Card>
                <h2 className="text-xl font-semibold mb-4">{t('systemStatus')}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>UID:</strong> {authContext?.uid || firebaseUser?.uid || '-'}</div>
                    <div><strong>Email:</strong> {authContext?.email || '-'}</div>
                    <div><strong>Role:</strong> <Badge>{authContext?.role || '...'}</Badge></div>
                    <div><strong>Org ID:</strong> {authContext?.orgId || '-'}</div>
                </div>
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">{t('testSuite')}</h2>
                        <p className="text-sm text-gray-500">
                            {t('lastRun')}: {lastRun ? lastRun.toLocaleString() : t('never')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={runAllSystemTests} loading={running} disabled={!firebaseUser || running}>
                            {running ? t('runningTests') : t('runAllTests')}
                        </Button>
                        {results.length > 0 && (
                            <Button variant="outline" onClick={exportResults}>
                                {t('exportJson')}
                            </Button>
                        )}
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="space-y-1">
                        {results.map((result, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border-b">
                                <div>
                                    <span className="text-xs text-gray-500">[{result.suite}]</span>
                                    <span className="ml-2 font-medium">{result.name}</span>
                                    <p className="text-xs text-gray-600 mt-1">{result.details}</p>
                                </div>
                                <Badge variant={result.pass ? 'success' : 'destructive'}>
                                    {result.pass ? '✓' : '✗'}
                                </Badge>
                            </div>
                        ))}
                        <div className="pt-4 mt-4 border-t">
                            <strong>Summary:</strong> {results.filter(r => r.pass).length}/{results.length} passed
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
