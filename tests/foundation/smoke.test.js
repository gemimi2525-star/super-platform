#!/usr/bin/env node

/**
 * Foundation Lock Smoke Tests (REAL Firebase Auth)
 * 
 * Creates real Firebase tokens using Admin SDK and tests routes
 * Run with: node tests/foundation/smoke.test.js
 * 
 * Prerequisites:
 * - Firebase Admin SDK configured (env vars)
 * - Server running on http://localhost:3000
 * - Test users exist in Firebase Auth with custom claims set
 */

const { getAdminAuth } = require('../../packages/firebase-admin/src');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const PLATFORM_OWNER_UID = process.env.TEST_PLATFORM_OWNER_UID || 'test-platform-owner';
const ORG_ADMIN_UID = process.env.TEST_ORG_ADMIN_UID || 'test-org-admin';
const ORG1_ID = 'test-org-1';

/**
 * Create custom token for user
 */
async function createUserToken(uid, customClaims) {
    const auth = getAdminAuth();
    try {
        const customToken = await auth.createCustomToken(uid, customClaims);
        console.log(`✓ Created token for ${uid}`);
        return customToken;
    } catch (error) {
        console.error(`✗ Failed to create token for ${uid}:`, error.message);
        throw error;
    }
}

/**
 * Exchange custom token for ID token (via Firebase REST API)
 */
async function exchangeForIdToken(customToken) {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
        console.warn('⚠️  FIREBASE_API_KEY not set - using custom token directly');
        return customToken;
    }

    try {
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: customToken, returnSecureToken: true })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }

        const data = await response.json();
        return data.idToken;
    } catch (error) {
        console.warn('⚠️  Could not exchange token (using custom token):', error.message);
        return customToken;
    }
}

async function fetchWithAuth(url, token) {
    // Set session cookie for middleware check
    return fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': '__session=' + token
        }
    });
}

async function runTests() {
    const results = [];

    console.log('🔬 Running Foundation Lock Smoke Tests (REAL Firebase Auth)\n');

    // Create real tokens
    let ownerToken, tenantToken;

    try {
        const ownerCustomToken = await createUserToken(PLATFORM_OWNER_UID, {
            role: 'platform_owner'
        });
        ownerToken = await exchangeForIdToken(ownerCustomToken);

        const tenantCustomToken = await createUserToken(ORG_ADMIN_UID, {
            role: 'org_admin',
            orgId: ORG1_ID
        });
        tenantToken = await exchangeForIdToken(tenantCustomToken);
    } catch (error) {
        console.error('❌ Failed to create test tokens:', error.message);
        console.log('\n💡 Make sure Firebase Admin SDK is configured:');
        console.log('   - FIREBASE_PROJECT_ID');
        console.log('   - FIREBASE_PRIVATE_KEY');
        console.log('   - FIREBASE_CLIENT_EMAIL\n');
        process.exit(1);
    }

    console.log(`\n📡 Testing against: ${BASE_URL}\n`);

    // Test 1: platform_owner can access /platform
    try {
        const response = await fetchWithAuth(`${BASE_URL}/platform`, ownerToken);
        results.push({
            name: 'platform_owner → /platform',
            pass: response.status === 200 || response.status === 307,
            status: response.status
        });
    } catch (error) {
        results.push({ name: 'platform_owner → /platform', pass: false, error: error.message });
    }

    // Test 2: org_admin cannot access /platform
    try {
        const response = await fetchWithAuth(`${BASE_URL}/platform`, tenantToken);
        results.push({
            name: 'org_admin → /platform (should fail)',
            pass: response.status === 403 || response.status === 500,
            status: response.status
        });
    } catch (error) {
        results.push({ name: 'org_admin → /platform (should fail)', pass: false, error: error.message });
    }

    // Test 3: org_admin can access /app
    try {
        const response = await fetchWithAuth(`${BASE_URL}/app`, tenantToken);
        results.push({
            name: 'org_admin → /app',
            pass: response.status === 200,
            status: response.status
        });
    } catch (error) {
        results.push({ name: 'org_admin → /app', pass: false, error: error.message });
    }

    // Test 4: Auth context API returns correct claims
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/auth/context`, ownerToken);
        const data = response.ok ? await response.json() : null;
        results.push({
            name: 'Auth context API (platform_owner)',
            pass: response.ok && data?.role === 'platform_owner',
            status: response.status,
            data: data?.role
        });
    } catch (error) {
        results.push({ name: 'Auth context API', pass: false, error: error.message });
    }

    // Print results
    console.log('📊 Test Results:\n');
    let passCount = 0;
    results.forEach(result => {
        const icon = result.pass ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        if (result.status) console.log(`   Status: ${result.status}`);
        if (result.data) console.log(`   Data: ${result.data}`);
        if (result.error) console.log(`   Error: ${result.error}`);
        if (result.pass) passCount++;
    });

    console.log(`\n${passCount}/${results.length} tests passed`);

    if (passCount === results.length) {
        console.log('\n🎉 All tests PASSED - Foundation Hardening Complete!\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests FAILED - Review errors above\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});
