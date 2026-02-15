/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Users DataSource Interface — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @module coreos/system/shared/datasources/users-datasource
 * @version 1.0.0
 */

import type { UserRecord, UserFormData } from '../types';

export interface UsersDataSource {
    list(opts?: { query?: string }): Promise<UserRecord[]>;
    get(id: string): Promise<UserRecord | null>;
    create(data: UserFormData): Promise<UserRecord>;
    update(id: string, data: Partial<UserFormData>): Promise<UserRecord>;
    remove(id: string): Promise<void>;
}
