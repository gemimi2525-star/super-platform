/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORE CATALOG SERVICE (Phase 24B.1 & 24C)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides metadata for available applications.
 * Filters content based on active channels and policies.
 * 
 * @module coreos/store/catalog
 */

import type { StoreItem, StoreQuery, DistributionChannel } from './types';
import { TrustLevel } from '../policy/trust';
import { AppPackage } from '../manifests/spec';

// Mock Data
let MOCK_CATALOG: StoreItem[] = [
    {
        appId: 'com.example.productivity',
        info: {
            name: 'Super Notes',
            publisher: 'Productivity Inc.',
            description: 'The ultimate note-taking app for professionals. Syncs across all devices.',
            shortDescription: 'Professional note-taking app.',
            icon: '📝',
            screenshots: [],
            category: 'productivity',
            releaseDate: Date.now() - 10000000
        },
        trustLevel: TrustLevel.VERIFIED,
        requiredCapabilities: ['core.finder'],
        versions: {
            official: {
                manifest: {
                    appId: 'com.example.productivity',
                    name: 'Super Notes',
                    publisher: 'Productivity Inc.',
                    version: '1.2.0',
                    entry: 'index.js',
                    window: { defaultRole: 'APP', width: 800, height: 600, resizable: true },
                    capabilitiesRequested: ['core.finder'],
                    storageScopes: ['app://data'],
                    workers: [],
                    updateChannel: 'stable'
                },
                checksum: 'sha256:mock-1',
                signature: 'sig_store_valid',
                bundle: 'console.log("Super Notes Running")'
            }
        },
        releaseNotes: {
            '1.2.0': 'Added cloud sync and improved search.'
        }
    },
    {
        appId: 'com.corp.hr',
        info: {
            name: 'HR Portal',
            publisher: 'Internal Corp',
            description: 'Employee management and leave requests.',
            shortDescription: 'Internal HR System.',
            icon: '👥',
            screenshots: [],
            category: 'business',
            releaseDate: Date.now() - 5000000
        },
        trustLevel: TrustLevel.ENTERPRISE,
        requiredCapabilities: ['user.manage', 'org.manage'],
        versions: {
            enterprise: {
                manifest: {
                    appId: 'com.corp.hr',
                    name: 'HR Portal',
                    publisher: 'Internal Corp',
                    version: '2.0.1',
                    entry: 'main.js',
                    window: { defaultRole: 'APP', width: 1024, height: 768, resizable: true },
                    capabilitiesRequested: ['user.manage', 'org.manage'],
                    storageScopes: ['app://hr-data'],
                    workers: [],
                    updateChannel: 'stable'
                },
                checksum: 'sha256:mock-2',
                signature: 'sig_enterprise_valid',
                bundle: 'console.log("HR Portal Running")'
            }
        },
        releaseNotes: {}
    },
    {
        appId: 'com.indie.game',
        info: {
            name: 'Space Jumper',
            publisher: 'Indie Dev',
            description: 'A fun platformer game.',
            shortDescription: 'Jump through space!',
            icon: '🚀',
            screenshots: [],
            category: 'productivity', // Placeholder category
            releaseDate: Date.now() - 10000
        },
        trustLevel: TrustLevel.UNVERIFIED,
        requiredCapabilities: [],
        versions: {
            dev: {
                manifest: {
                    appId: 'com.indie.game',
                    name: 'Space Jumper',
                    publisher: 'Indie Dev',
                    version: '0.9.0-beta',
                    entry: 'game.js',
                    window: { defaultRole: 'APP', width: 600, height: 400, resizable: false },
                    capabilitiesRequested: [],
                    storageScopes: ['app://save'],
                    workers: [],
                    updateChannel: 'dev'
                },
                checksum: 'sha256:mock-3',
                // No signature = Unverified
                bundle: 'console.log("Game Running")'
            }
        },
        releaseNotes: {}
    }
];

// Interface for ingestion
interface SubmissionCompatible {
    appId: string;
    channel: DistributionChannel;
    pkg: AppPackage;
}

export class StoreCatalogService {

    /**
     * Ingest an approved submission into the catalog
     * (Phase 24C)
     */
    async ingest(submission: SubmissionCompatible) {
        const existingIndex = MOCK_CATALOG.findIndex(item => item.appId === submission.appId);
        const pkg = submission.pkg;

        if (existingIndex >= 0) {
            // Update existing
            const item = MOCK_CATALOG[existingIndex];

            // We need to cast to mutable to update it
            const mutableItem = item as any;
            mutableItem.versions[submission.channel] = pkg;
            mutableItem.info.releaseDate = Date.now();

            console.log(`[Catalog] Updated ${submission.appId} in ${submission.channel}`);
        } else {
            // Create new
            const newItem: StoreItem = {
                appId: submission.appId,
                info: {
                    name: pkg.manifest.name,
                    publisher: pkg.manifest.publisher || 'Unknown',
                    description: 'Newly published app',
                    shortDescription: 'New app',
                    icon: '📦',
                    screenshots: [],
                    category: 'utilities',
                    releaseDate: Date.now()
                },
                trustLevel: TrustLevel.UNVERIFIED,
                requiredCapabilities: pkg.manifest.capabilitiesRequested,
                versions: {
                    [submission.channel]: pkg
                },
                releaseNotes: {}
            };
            MOCK_CATALOG.push(newItem);
            console.log(`[Catalog] Created ${submission.appId} in ${submission.channel}`);
        }
    }

    /**
     * Get all items visible in specific channels
     */
    async getCatalog(channels: DistributionChannel[] = ['official']): Promise<StoreItem[]> {
        return MOCK_CATALOG.filter(item => {
            // Check if item has a version in any of the requested channels
            const availableChannels = Object.keys(item.versions) as DistributionChannel[];
            return channels.some(ch => availableChannels.includes(ch));
        });
    }

    /**
     * Get details for a specific app
     */
    async getAppDetails(appId: string): Promise<StoreItem | null> {
        return MOCK_CATALOG.find(item => item.appId === appId) || null;
    }

    /**
     * Search the catalog
     */
    async search(query: StoreQuery): Promise<StoreItem[]> {
        let results = MOCK_CATALOG;

        if (query.channel) {
            // Filter items that have the requested channel
            results = results.filter(item => Object.keys(item.versions).includes(query.channel!));
        }

        if (query.category) {
            results = results.filter(item => item.info.category === query.category);
        }

        if (query.term) {
            const term = query.term.toLowerCase();
            results = results.filter(item =>
                item.info.name.toLowerCase().includes(term) ||
                item.info.description.toLowerCase().includes(term)
            );
        }

        return results;
    }
}

export const storeCatalog = new StoreCatalogService();
