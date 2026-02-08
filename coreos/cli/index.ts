/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS DEVELOPER CLI (Phase 24C)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Mock CLI entry point for 'apicore'.
 * Usage: apicore <command> [options]
 * 
 * Commands:
 * - validate: Validate app manifest
 * - pack: Create app package artifact
 * - sign: Sign app package
 * - publish: Upload and submit app
 * 
 * @module coreos/cli
 */

import { validateApp } from './validate';
import { packApp } from './pack';
import { signApp } from './sign';
import { publishApp } from './publish';

type Command = 'validate' | 'pack' | 'sign' | 'publish' | 'help';

export async function runCLI(args: string[]) {
    const command = (args[0] || 'help') as Command;
    const params = args.slice(1);

    console.log(`\n🤖 APICORE CLI v1.0.0`);
    console.log(`======================`);

    try {
        switch (command) {
            case 'validate':
                await validateApp(params);
                break;
            case 'pack':
                await packApp(params);
                break;
            case 'sign':
                await signApp(params);
                break;
            case 'publish':
                await publishApp(params);
                break;
            case 'help':
            default:
                printHelp();
                break;
        }
    } catch (error: any) {
        console.error(`\n❌ Error: ${error.message}`);
    }
}

function printHelp() {
    console.log(`
Usage: apicore <command> [options]

Commands:
  validate <manifest-path>      Validate app manifest and policy
  pack <manifest-path>          Create .app package artifact
  sign <artifact-path> <key>    Sign package with publisher key
  publish <artifact-path>       Submit package to store
    `);
}
