/**
 * Verification Script for Phase 24A.2: Policy Enforcement
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyPolicy()`
 */

import { appLifecycle } from './coreos/registry/lifecycle';
import { appRegistry } from './coreos/registry/index';
import type { AppPackage } from './coreos/manifests/spec';

export async function verifyPolicy() {
    console.log('🚀 Starting Policy Verification...');

    // 1. Unverified App requesting Privileged Cap (Should Fail)
    const malwarePackage: AppPackage = {
        manifest: {
            appId: 'com.hacker.evil',
            name: 'Evil App',
            publisher: 'Unknown',
            version: '1.0.0',
            entry: 'index.js',
            window: { defaultRole: 'APP' },
            capabilitiesRequested: ['system.configure'], // Requires SYSTEM tier
            storageScopes: [],
            workers: [],
            updateChannel: 'dev'
        },
        checksum: 'sha256:bad',
        bundle: '...'
    };

    console.log('🧪 Test 1: Installing Unverified App with Privileged Cap...');
    const result1 = await appLifecycle.installApp(malwarePackage);
    if (!result1) {
        console.log('✅ Blocked Successfully (Expected)');
    } else {
        console.error('❌ FAILED: Malware installed!');
    }

    // 2. Enterprise App with Valid Signature (Should Pass)
    const enterprisePackage: AppPackage = {
        manifest: {
            appId: 'com.corp.dashboard',
            name: 'Corp Dashboard',
            publisher: 'My Corp',
            version: '1.0.0',
            entry: 'index.js',
            window: { defaultRole: 'APP' },
            capabilitiesRequested: ['audit.view'], // Requires ENTERPRISE tier
            storageScopes: [],
            workers: [],
            updateChannel: 'stable'
        },
        checksum: 'sha256:corp',
        signature: 'sig_enterprise_valid', // Valid Mock Sig
        bundle: '...'
    };

    console.log('🧪 Test 2: Installing Enterprise App with Valid Sig...');
    const result2 = await appLifecycle.installApp(enterprisePackage);
    if (result2) {
        console.log('✅ Installed Successfully (Expected)');
    } else {
        console.error('❌ FAILED: Enterprise app blocked');
    }

    // 3. Enterprise App with Missing Signature (Should Fail)
    const unsignedCorpPackage: AppPackage = {
        ...enterprisePackage,
        manifest: { ...enterprisePackage.manifest, appId: 'com.corp.unsigned' },
        signature: undefined
    };

    console.log('🧪 Test 3: Installing Enterprise App without Sig...');
    const result3 = await appLifecycle.installApp(unsignedCorpPackage);
    if (!result3) {
        console.log('✅ Blocked Successfully (Expected)');
    } else {
        console.error('❌ FAILED: Unsigned app installed as Enterprise');
    }
}
