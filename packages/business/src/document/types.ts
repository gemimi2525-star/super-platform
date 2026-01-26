/**
 * Business Document Domain Types (CORE)
 */

import { BaseEntity, Address } from '../common/base';
import { TaxRule } from '../product/types';

export enum DocumentType {
    PR = 'PR',
    PO = 'PO',
    QUOTATION = 'QT',
    INVOICE = 'INV',
    RECEIPT = 'RCP',
    TAX_INVOICE = 'TAX',
    CREDIT_NOTE = 'CN',
    DEBIT_NOTE = 'DN'
}

export enum DocumentStatus {
    DRAFT = 'draft',
    ISSUED = 'issued',
    VOID = 'void',
    PAID = 'paid'
}

export interface DocumentItem {
    id: string;
    docId: string;
    seq: number;
    productId?: string;
    description: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    discount?: number;
    amount: number; // (Qty * Price) - Discount
    taxRuleSnapshot: TaxRule; // Snapshot of tax rule at time of creation
}

export interface DocumentHeader extends BaseEntity {
    type: DocumentType;
    docNo: string;
    issueDate: Date;
    dueDate?: Date;
    subject?: string;
    customerId?: string;
    customerName: string; // Snapshot
    addressSnapshot: Address; // Snapshot
    currency: string;
    // Financial Totals
    subTotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    whtTotal?: number;

    status: DocumentStatus;
    createdBy: string;
    refDocId?: string;

    items: DocumentItem[];
}
