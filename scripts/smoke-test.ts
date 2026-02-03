#!/usr/bin/env npx tsx
/**
 * Production Smoke Test Script
 * 
 * Run: npm run ops:smoke
 * 
 * Tests critical endpoints and reports status.
 */

const BASE_URL = process.env.SMOKE_TEST_URL || 'https://www.apicoredata.com';

interface TestResult {
    name: string;
    url: string;
    expected: string;
    actual: string;
    pass: boolean;
    duration: number;
}

const tests: { name: string; path: string; check: (res: Response, body: string) => { expected: string; actual: string; pass: boolean } }[] = [
    {
        name: 'Login Page',
        path: '/en/login',
        check: (res) => ({
            expected: '200',
            actual: String(res.status),
            pass: res.status === 200
        })
    },
    {
        name: 'OS Dashboard',
        path: '/os',
        check: (res) => ({
            expected: '200 or redirect',
            actual: String(res.status),
            pass: res.status === 200 || res.status === 307 || res.status === 308
        })
    },
    {
        name: 'OS Auth Gate (P0-HOTFIX)',
        path: '/os',
        check: (res) => {
            const location = res.headers.get('location') || '';
            const redirectsToLogin = location.includes('/login');
            const hasCallback = location.includes('callbackUrl');
            return {
                expected: '307 → /login?callbackUrl',
                actual: `${res.status} → ${location.substring(0, 35)}...`,
                pass: (res.status === 307 || res.status === 308) && redirectsToLogin && hasCallback
            };
        }
    },
    {
        name: 'Auth Session API',
        path: '/api/auth/session',
        check: (res, body) => {
            let hasIsAuth = false;
            try {
                const json = JSON.parse(body);
                hasIsAuth = 'isAuth' in json;
            } catch { }
            return {
                expected: '200 + isAuth field',
                actual: `${res.status} ${hasIsAuth ? '+ isAuth' : '- no isAuth'}`,
                pass: res.status === 200 && hasIsAuth
            };
        }
    },
    {
        name: 'Organizations API',
        path: '/api/platform/orgs',
        check: (res, body) => {
            const isNotDisabled = !body.includes('LEGACY_ROUTE_DISABLED');
            return {
                expected: '200/401 (not 503 disabled)',
                actual: `${res.status} ${isNotDisabled ? '' : '(DISABLED)'}`,
                pass: res.status !== 503 && isNotDisabled
            };
        }
    },
    {
        name: 'Trust Center Redirect',
        path: '/en/trust',
        check: (res) => {
            const location = res.headers.get('location') || '';
            const redirectsToSynapse = location.includes('synapsegovernance');
            return {
                expected: '301/308 → synapsegovernance',
                actual: `${res.status} → ${location.substring(0, 40)}...`,
                pass: (res.status === 301 || res.status === 308) && redirectsToSynapse
            };
        }
    },
    {
        name: 'Me API (P5.1)',
        path: '/api/platform/me',
        check: (res, body) => {
            const isNotDisabled = !body.includes('LEGACY_ROUTE_DISABLED');
            return {
                expected: '200/401 (not 503 disabled)',
                actual: `${res.status} ${isNotDisabled ? '' : '(DISABLED)'}`,
                pass: res.status !== 503 && isNotDisabled
            };
        }
    },
    {
        name: 'Audit Logs API (P5.2)',
        path: '/api/platform/audit-logs',
        check: (res, body) => {
            const isNotDisabled = !body.includes('LEGACY_ROUTE_DISABLED');
            return {
                expected: '200/401/403 (not 503 disabled)',
                actual: `${res.status} ${isNotDisabled ? '' : '(DISABLED)'}`,
                pass: res.status !== 503 && isNotDisabled
            };
        }
    },
    {
        name: 'Health API (P5.3)',
        path: '/api/platform/health',
        check: (res, body) => {
            let hasStatus = false;
            try {
                const json = JSON.parse(body);
                hasStatus = json.data?.status === 'healthy';
            } catch { }
            return {
                expected: '200 + status=healthy',
                actual: `${res.status} ${hasStatus ? '+ healthy' : ''}`,
                pass: res.status === 200 && hasStatus
            };
        }
    },
    {
        name: 'Session Debug API (P5.4)',
        path: '/api/platform/session-debug',
        check: (res, body) => {
            // Should return 401 when not authenticated (our smoke test has no cookies)
            const isNotDisabled = !body.includes('LEGACY_ROUTE_DISABLED');
            return {
                expected: '401 (protected endpoint)',
                actual: `${res.status} ${isNotDisabled ? '' : '(DISABLED)'}`,
                pass: res.status === 401 && isNotDisabled
            };
        }
    }
];

async function runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
        const url = `${BASE_URL}${test.path}`;
        const start = Date.now();

        try {
            const res = await fetch(url, { redirect: 'manual' });
            const body = await res.text();
            const duration = Date.now() - start;
            const { expected, actual, pass } = test.check(res, body);

            results.push({
                name: test.name,
                url,
                expected,
                actual,
                pass,
                duration
            });
        } catch (error: any) {
            results.push({
                name: test.name,
                url,
                expected: 'Response',
                actual: `Error: ${error.message}`,
                pass: false,
                duration: Date.now() - start
            });
        }
    }

    return results;
}

async function main() {
    console.log('\n🔍 APICOREDATA Production Smoke Test');
    console.log(`📍 Target: ${BASE_URL}`);
    console.log('─'.repeat(60));

    const results = await runTests();
    let passed = 0;
    let failed = 0;

    for (const r of results) {
        const icon = r.pass ? '✅' : '❌';
        console.log(`${icon} ${r.name}`);
        console.log(`   URL:      ${r.url}`);
        console.log(`   Expected: ${r.expected}`);
        console.log(`   Actual:   ${r.actual}`);
        console.log(`   Time:     ${r.duration}ms`);
        console.log('');

        if (r.pass) passed++;
        else failed++;
    }

    console.log('─'.repeat(60));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        console.log('\n⚠️  SMOKE TEST FAILED - Do not deploy!');
        process.exit(1);
    } else {
        console.log('\n✅ All smoke tests passed!');
        process.exit(0);
    }
}

main();
