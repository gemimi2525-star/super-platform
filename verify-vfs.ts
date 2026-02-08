/**
 * Verification Script for Phase 21: VFS & OPFS Boundary
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyVFS()`
 */

import { dispatchFsIntent } from './lib/filesystem/dispatchFsIntent';

export async function verifyVFS() {
    console.log('🚀 Starting VFS Verification...');

    // 1. Write to App Sandbox
    console.log('1️⃣ Writing to app://data.txt...');
    try {
        await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'app://data.txt', scheme: 'app' },
            content: 'Hello OPFS Sandbox!',
            options: { create: true }
        });
        console.log('   ✅ Write Success');
    } catch (e) {
        console.error('   ❌ Write Failed:', e);
    }

    // 2. Read from App Sandbox
    console.log('2️⃣ Reading from app://data.txt...');
    try {
        const result = await dispatchFsIntent({
            action: 'os.fs.read',
            meta: { path: 'app://data.txt', scheme: 'app' },
        });
        console.log('   ✅ Read Content:', result.data);
    } catch (e) {
        console.error('   ❌ Read Failed:', e);
    }

    // 3. Try to access valid path (User Sandbox)
    console.log('3️⃣ Writing to user://notes.txt...');
    try {
        await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'user://notes.txt', scheme: 'user' },
            content: 'User Private Note',
            options: { create: true }
        });
        console.log('   ✅ Write Success');
    } catch (e) {
        console.error('   ❌ Write Failed:', e);
    }

    // 4. Try Path Traversal (Expect Fail)
    console.log('4️⃣ Testing Path Traversal app://../secret...');
    try {
        await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'app://../secret.txt', scheme: 'app' },
            content: 'Hacking attempt',
            options: { create: true }
        });
        console.log('   ❌ Security Fail: Traversal allowed');
    } catch (e) {
        console.log('   ✅ Security Success: Traversal blocked');
    }
}
