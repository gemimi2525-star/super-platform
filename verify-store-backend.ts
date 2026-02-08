/**
 * Verification Script for Phase 24B.1: Store Backend
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyStoreBackend()`
 */

import { storeCatalog } from './coreos/store/catalog';
import { storeBridge } from './coreos/store/bridge';
import { appRegistry } from './coreos/registry/index';

export async function verifyStoreBackend() {
    console.log('🚀 Starting Store Backend Verification...');

    // 1. Search Catalog
    console.log('🔍 Searching Catalog...');
    const results = await storeCatalog.search({ term: 'Super' });
    console.log(`Found ${results.length} apps matching 'Super'`);

    if (results.length > 0 && results[0].info.name === 'Super Notes') {
        console.log('✅ Catalog Search Verified');
    } else {
        console.error('❌ Catalog Search Failed');
    }

    // 2. Request Install (Official Channel)
    console.log('📦 Requesting Install (Official)...');
    const installResult = await storeBridge.requestInstall('com.example.productivity', 'official');

    if (installResult.success) {
        console.log('✅ Install Request Succeeded');
    } else {
        console.error('❌ Install Request Failed:', installResult.reason);
    }

    // 3. Verify Registry
    const app = appRegistry.getApp('com.example.productivity');
    if (app) {
        console.log('✅ App present in Registry');
    } else {
        console.error('❌ App missing from Registry');
    }

    // 4. Request Install (Enterprise - Should Fail for non-enterprise user context, 
    // but here we check if the app exists in enterprise channel first)
    console.log('🏢 Requesting Enterprise Install...');
    const entResult = await storeBridge.requestInstall('com.corp.hr', 'enterprise');
    // Note: This needs a valid signature in our policy mock. The mock data has 'sig_enterprise_valid'.

    if (entResult.success) {
        console.log('✅ Enterprise Install Succeeded');
    } else {
        console.error('❌ Enterprise Install Failed:', entResult.reason);
    }

    // 5. Request Invalid Channel
    console.log('🚫 Requesting Invalid Channel...');
    const failResult = await storeBridge.requestInstall('com.example.productivity', 'dev');
    if (!failResult.success) {
        console.log('✅ Invalid Channel Rejected (Expected)');
    } else {
        console.error('❌ Invalid Channel Accepted');
    }
}
