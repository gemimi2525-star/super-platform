/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organizations DataSource Interface — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @module coreos/system/shared/datasources/orgs-datasource
 * @version 1.0.0
 */

import type { OrgRecord, OrgFormData } from '../types';

export interface OrgsDataSource {
    list(opts?: { query?: string }): Promise<OrgRecord[]>;
    create(data: OrgFormData): Promise<OrgRecord>;
    update(id: string, data: Partial<OrgFormData>): Promise<OrgRecord>;
    remove(id: string): Promise<void>;
}
