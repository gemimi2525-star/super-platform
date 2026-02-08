/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB QUEUE (IndexedDB Persistence)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages the background job queue with persistence.
 * Uses raw IndexedDB for zero-dependency operation.
 * 
 * @module coreos/workers/sync/queue
 */

import type { Job, JobStatus, JobPriority } from '../types';

const DB_NAME = 'synapse_jobs_db';
const DB_VERSION = 1;
const STORE_NAME = 'jobs';

export class JobQueue {
    private db: IDBDatabase | null = null;

    /**
     * Initialize DB connection
     */
    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('priority', 'priority', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    /**
     * Add a job to the queue
     */
    async enqueue(job: Job): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(job);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update job status
     */
    async updateStatus(id: string, status: JobStatus, updates?: Partial<Job>): Promise<void> {
        await this.init();
        const job = await this.get(id);
        if (!job) throw new Error(`Job ${id} not found`);

        const updatedJob = { ...job, status, ...updates };
        await this.enqueue(updatedJob); // put overwrites
    }

    /**
     * Get a job by ID
     */
    async get(id: string): Promise<Job | undefined> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get next pending job (Highest Priority -> FIFO)
     */
    async getNextPending(): Promise<Job | undefined> {
        await this.init();
        // Naive implementation: fetch all pending and sort.
        // For production, use a cursor or proper index query.
        // Given reasonable queue size, this is acceptable for MVP.
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('status');
            const request = index.getAll('PENDING'); // Get all pending

            request.onsuccess = () => {
                const pendingJobs = request.result as Job[];
                if (pendingJobs.length === 0) {
                    resolve(undefined);
                    return;
                }

                // Sort by Priority (HIGH > NORMAL > BACKGROUND) then CreatedAt (Oldest first)
                const priorityWeight = { 'HIGH': 3, 'NORMAL': 2, 'BACKGROUND': 1 };

                pendingJobs.sort((a, b) => {
                    const weightA = priorityWeight[a.priority];
                    const weightB = priorityWeight[b.priority];
                    if (weightA !== weightB) return weightB - weightA; // Higher weight first
                    return a.createdAt - b.createdAt; // Older first
                });

                resolve(pendingJobs[0]);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all jobs
     */
    async getAll(): Promise<Job[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

export const jobQueue = new JobQueue();
