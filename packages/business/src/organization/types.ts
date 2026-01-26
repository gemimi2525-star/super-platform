/**
 * Organization Domain Types
 */

import { BaseEntity, Address } from '../common/base';
import { Status } from '../common/enums';

export interface Organization extends BaseEntity {
    name: string;
    slug: string;
    taxId?: string;
    headOffice: boolean; // True = Head Office, False = Branch
    logoUrl?: string;
    settings?: Record<string, unknown>; // Domain preferences
}

export interface Branch extends BaseEntity {
    code: string; // e.g., 00000, 00001
    name: string;
    address: Address;
    isDefault: boolean;
    active: boolean;
}

export interface TaxProfile extends BaseEntity {
    vatRate: number; // e.g., 7.0
    whtRates?: number[]; // List of common WHT rates
    taxAddress: Address;
    currency: string; // Base Currency (THB)
}
