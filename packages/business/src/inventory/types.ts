/**
 * Inventory Domain Types
 */

import { BaseEntity } from '../common/base';

export enum StockMovementType {
    IN = 'in',
    OUT = 'out',
    ADJUST = 'adjust'
}

export interface Warehouse extends BaseEntity {
    code: string;
    name: string;
}

export interface StockMovement extends BaseEntity {
    productId: string;
    warehouseId: string;
    type: StockMovementType;
    quantity: number; // Amount (+/-)
    refDocId: string; // Audit Trail (e.g. Invoice ID)
    docType: string;
    balanceAfter: number; // Snapshot Balance
}
