/**
 * Financial Domain Types
 */

import { BaseEntity } from '../common/base';

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense'
}

export interface Transaction extends BaseEntity {
    date: Date;
    type: TransactionType;
    amount: number;
    refDocId?: string;
    accountId: string;
}
