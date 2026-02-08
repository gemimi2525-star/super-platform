/**
 * CLI: Sign Command
 */

import { AppPackage } from '../manifests/spec';

export async function signApp(args: string[]) {
    const packageInput = args[0]; // JSON string of AppPackage
    const key = args[1]; // 'enterprise-key', 'publisher-key', etc.

    if (!packageInput || !key) throw new Error('Usage: sign <package-json> <key-id>');

    console.log(`✍️  Signing application...`);

    // 1. Parse Package
    let pkg: AppPackage;
    try {
        pkg = JSON.parse(packageInput);
    } catch {
        throw new Error('Invalid package file');
    }

    if (!pkg.checksum) throw new Error('Package missing checksum. Did you run pack?');

    // 2. Sign (Mock Crypto)
    let signature = '';
    const keyName = key; // Use 'key' as keyName for logging
    if (key === 'enterprise-key') {
        signature = 'sig_enterprise_valid';
        console.log(`   Using Enterprise Key`);
    } else if (key === 'publisher-key') {
        signature = 'sig_store_valid';
        console.log(`   Using Publisher Key`);
    } else {
        signature = 'sig_unknown';
        console.warn(`   ⚠️  Unknown Key ID`);
    }

    // 3. Attach Signature
    // In a real system, we'd write to a new file. Here we mutate the object in memory or create new.
    // AppPackage signature might be readonly in spec, so we treat it as mutable here for simulation.
    const signedPkg = { ...pkg, signature };

    // Write back
    // fs.writeFileSync(packagePath, JSON.stringify(signedPkg, null, 2)); // In real CLI
    console.log(JSON.stringify(signedPkg, null, 2));

    console.log(`\n✅ Signed ${pkg.manifest.appId} with ${keyName}`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);

    return JSON.stringify(signedPkg);
}
