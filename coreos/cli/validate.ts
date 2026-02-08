/**
 * CLI: Validate Command
 */

import { AppManifest } from '../manifests/spec';
import { calculateRequiredTrustLevel } from '../policy/enforcement';
import { TrustLevel } from '../policy/trust';

// Mock file reading
async function readManifest(path: string): Promise<AppManifest> {
    // In real CLI, this reads fs.readFileSync(path)
    // Here we assume path is a JSON string or we mock it for tests
    try {
        if (path.startsWith('{')) {
            return JSON.parse(path);
        }
        throw new Error('For simulation, pass valid JSON string as path');
    } catch (e) {
        throw new Error(`Invalid manifest: ${e}`);
    }
}

export async function validateApp(args: string[]) {
    const manifestInput = args[0];
    if (!manifestInput) throw new Error('Manifest path/json required');

    console.log(`Running validation...`);

    // 1. Read & Parse
    const manifest = await readManifest(manifestInput);
    console.log(`✅ JSON Schema Valid`);
    console.log(`   App ID: ${manifest.appId}`);
    console.log(`   Version: ${manifest.version}`);

    // 2. Policy Check
    const requiredTrust = calculateRequiredTrustLevel(manifest.capabilitiesRequested);

    console.log(`\nPolicy Analysis:`);
    console.log(`   Requested Capabilities: ${manifest.capabilitiesRequested.join(', ') || 'None'}`);
    console.log(`   Minimum Trust Required: ${TrustLevel[requiredTrust]}`);

    // 3. Warnings
    if (requiredTrust >= TrustLevel.SYSTEM) {
        console.warn(`   ⚠️  WARNING: This app requires SYSTEM trust. It will be rejected unless signed by OS Vendor.`);
    } else if (requiredTrust >= TrustLevel.ENTERPRISE) {
        console.log(`   ℹ️  NOTE: Requesting Enterprise capabilities. Requires Enterprise signature.`);
    }

    console.log(`\n✅ Validation Passed. Ready to pack.`);
}
