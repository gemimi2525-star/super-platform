/**
 * Verification Script for Phase 24A.1: App Lifecycle
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyAppLifecycle()`
 */

import { appLifecycle } from './coreos/registry/lifecycle';
import { appRegistry } from './coreos/registry/index';
import type { AppPackage } from './coreos/manifests/spec';

export async function verifyAppLifecycle() {
    console.log('🚀 Starting App Lifecycle Verification...');

    // 1. Prepare Mock Package
    const mockPackage: AppPackage = {
        manifest: {
            appId: 'com.example.demo',
            name: 'Demo App',
            publisher: 'Example Corp',
            version: '1.0.0',
            entry: 'index.js',
            window: {
                defaultRole: 'APP',
                width: 800,
                height: 600,
                resizable: true
            },
            capabilitiesRequested: ['core.finder'],
            storageScopes: ['app://data'],
            workers: [],
            updateChannel: 'stable'
        },
        checksum: 'sha256:mock-checksum-123',
        bundle: 'console.log("Hello World")'
    };

    // 2. Test Install
    console.log('📦 Installing App...');
    const installed = await appLifecycle.installApp(mockPackage);

    if (installed) {
        console.log('✅ Installation Successful');
    } else {
        console.error('❌ Installation Failed');
        return;
    }

    // 3. Verify Registry
    const app = appRegistry.getApp('com.example.demo');
    console.log('📋 Registry Lookup:', app);

    if (app && app.status === 'INSTALLED') {
        console.log('✅ Registry Verified');
    } else {
        console.error('❌ Registry Mismatch');
    }

    // 4. Test Duplicate Install (Should Fail)
    console.log('🔁 Testing Duplicate Install...');
    try {
        await appLifecycle.installApp(mockPackage);
        console.error('❌ Duplicate Install Should Have Failed');
    } catch (e) {
        console.log('✅ Duplicate Install Rejected (Expected)');
    }

    // 5. Test Uninstall
    console.log('🗑 Uninstalling App...');
    const uninstalled = await appLifecycle.uninstallApp('com.example.demo');

    if (uninstalled) {
        console.log('✅ Uninstall Successful');
    } else {
        console.error('❌ Uninstall Failed');
    }

    // 6. Verify Removal
    if (!appRegistry.getApp('com.example.demo')) {
        console.log('✅ Registry Verified (Empty)');
    } else {
        console.error('❌ App still in registry');
    }
}
