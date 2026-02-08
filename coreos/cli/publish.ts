/**
 * CLI: Publish Command
 */

import { AppManifest, AppPackage } from '../manifests/spec';
import { validateInstallPolicy, determineTrustLevel } from '../policy/enforcement';
import { publishingService } from '../store/publishing';

export async function publishApp(args: string[]) {
    const packageInput = args[0];
    const channel = args[1] || 'dev'; // dev | enterprise | official

    if (!packageInput) throw new Error('Usage: publish <package-json> [channel]');

    console.log(`🚀 Publishing to channel: [${channel}]...`);

    // 1. Parse & Verify Integrity
    let pkg: AppPackage;
    try {
        pkg = JSON.parse(packageInput);
    } catch {
        throw new Error('Invalid package file');
    }

    console.log(`   App: ${pkg.manifest.appId} v${pkg.manifest.version}`);
    console.log(`   Checksum: ${pkg.checksum}`);
    console.log(`   Signature: ${pkg.signature || 'Unsigned'}`);

    // 2. Client-side Pre-flight Check
    const trustLevel = determineTrustLevel(pkg);
    const policyCheck = validateInstallPolicy(pkg.manifest, trustLevel);

    if (!policyCheck.allowed) {
        if (channel !== 'dev') {
            console.error(`\n❌ PRE-FLIGHT ERROR: ${policyCheck.reason}`);
            throw new Error('Policy check failed. Cannot publish to strict channel.');
        } else {
            console.warn(`\n⚠️  PRE-FLIGHT WARNING: ${policyCheck.reason} (Allowed in Dev)`);
        }
    }

    // 3. Upload & Submit
    try {
        const submission = await publishingService.submitRelease(pkg, channel as any);

        if (submission.status === 'REJECTED') {
            console.error(`\n❌ Submission Rejected`);
            console.error(`   Reason: ${submission.reasonCode} - ${submission.notes}`);
            throw new Error(`Submission rejected: ${submission.reasonCode}`);
        } else {
            console.log(`\n✅ Submission Accepted`);
            console.log(`   ID: ${submission.id}`);
            console.log(`   Status: ${submission.status}`);

            if (submission.status === 'APPROVED') {
                console.log(`   🚀 Live directly (Auto-approved)`);
            } else {
                console.log(`   ⏳ Pending Review`);
            }
        }
    } catch (e: any) {
        throw new Error(`Upload failed: ${e.message}`);
    }
}
