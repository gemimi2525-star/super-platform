/**
 * SYNAPSE AUDIT LEDGER (VERIFIABLE)
 * Algorithm: SHA-256
 * Structure: Hash Chain (Merkle-like linear)
 */

import { DecisionRecord, DecisionResult } from '../reason-core/schema';
import * as crypto from 'crypto';

export interface LedgerEntry {
    readonly index: number;
    readonly timestamp: number;
    readonly event: 'DECISION_RECORDED' | 'GATE_VERIFICATION' | 'SYSTEM_EVENT';
    readonly data: unknown; // The content being audited
    readonly hash: string; // SHA-256(index + timestamp + event + JSON(data) + previousHash)
    readonly previousHash: string;
}

export interface VerificationReport {
    isValid: boolean;
    lastValidIndex: number;
    brokenIndex?: number;
    totalEntries: number;
}

export class AuditLedger {
    private static instance: AuditLedger;
    private chain: LedgerEntry[] = [];
    private readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

    // Ed25519 Keypair Stub (Deterministic for v1)
    private readonly AUTHORITY_PUBLIC_KEY = 'public-key-stub-v1';
    private readonly AUTHORITY_PRIVATE_KEY = 'private-key-stub-v1';

    private constructor() {
        // Genesis block
        const timestamp = Date.now();
        const genesisData = { message: 'SYNAPSE GENESIS' };

        // Calculate genesis hash
        const hash = this.calculateHash(0, timestamp, 'SYSTEM_EVENT', genesisData, this.GENESIS_HASH);

        this.chain.push({
            index: 0,
            timestamp,
            event: 'SYSTEM_EVENT',
            data: genesisData,
            hash,
            previousHash: this.GENESIS_HASH
        });
    }

    public static getInstance(): AuditLedger {
        if (!AuditLedger.instance) {
            AuditLedger.instance = new AuditLedger();
        }
        return AuditLedger.instance;
    }

    /**
     * compute SHA-256 hash
     */
    private calculateHash(index: number, timestamp: number, event: string, data: unknown, previousHash: string): string {
        const payload = `${index}:${timestamp}:${event}:${JSON.stringify(data)}:${previousHash}`;
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Append record to ledger
     */
    public append(event: LedgerEntry['event'], data: unknown): LedgerEntry {
        const previousBlock = this.chain[this.chain.length - 1];
        const index = this.chain.length;
        const timestamp = Date.now();

        const hash = this.calculateHash(index, timestamp, event, data, previousBlock.hash);

        const entry: LedgerEntry = {
            index,
            timestamp,
            event,
            data,
            hash,
            previousHash: previousBlock.hash
        };

        this.chain.push(entry);
        // console.log(`[LEDGER] #${index} mined: ${hash.substr(0, 8)}`);
        return entry;
    }

    /**
     * Verify the entire chain integrity
     */
    public verifyChain(): VerificationReport {
        // Check Genesis
        const genesis = this.chain[0];
        const genesisHashCalc = this.calculateHash(0, genesis.timestamp, genesis.event, genesis.data, this.GENESIS_HASH);
        if (genesis.hash !== genesisHashCalc) {
            return { isValid: false, lastValidIndex: -1, brokenIndex: 0, totalEntries: this.chain.length };
        }

        for (let i = 1; i < this.chain.length; i++) {
            const current = this.chain[i];
            const previous = this.chain[i - 1];

            // 1. Link Check
            if (current.previousHash !== previous.hash) {
                return { isValid: false, lastValidIndex: i - 1, brokenIndex: i, totalEntries: this.chain.length };
            }

            // 2. Data Integrity Check
            const recalculatedHash = this.calculateHash(current.index, current.timestamp, current.event, current.data, current.previousHash);
            if (current.hash !== recalculatedHash) {
                return { isValid: false, lastValidIndex: i - 1, brokenIndex: i, totalEntries: this.chain.length };
            }
        }

        return { isValid: true, lastValidIndex: this.chain.length - 1, totalEntries: this.chain.length };
    }

    /**
     * Sign a payload (Stub - Deterministic HMAC-SHA256 as sig simulation)
     */
    public sign(payload: string): string {
        return crypto.createHmac('sha256', this.AUTHORITY_PRIVATE_KEY).update(payload).digest('hex');
    }

    /**
     * Verify a signature (Stub)
     */
    public verifySignature(payload: string, signature: string): boolean {
        // Since we simulate symmetric signing for this stub (using HMAC), we verify by re-computing.
        // In real Ed25519, we would verify with Public Key.
        // This is sufficient for v1 internal verification test.
        const expected = crypto.createHmac('sha256', this.AUTHORITY_PRIVATE_KEY).update(payload).digest('hex');
        return expected === signature;
    }

    public getChain(): readonly LedgerEntry[] {
        return this.chain;
    }

    public getAuthorityId(): string {
        return 'synapse-authority-v1';
    }
}
