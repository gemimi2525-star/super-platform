/**
 * Base Definitions
 */

import { CurrencyCode } from './enums';

export interface BaseEntity {
    id: string;
    orgId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Money {
    amount: number;
    currency: CurrencyCode;
}

export interface Address {
    line1: string;
    line2?: string;
    city?: string;
    state?: string;
    zip: string;
    country: string;
}
