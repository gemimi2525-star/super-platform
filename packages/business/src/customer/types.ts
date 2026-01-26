/**
 * Customer & Partner Domain Types
 */

import { BaseEntity, Address } from '../common/base';
import { Status } from '../common/enums';

export enum CustomerType {
    INDIVIDUAL = 'individual',
    COMPANY = 'company'
}

export interface Customer extends BaseEntity {
    type: CustomerType;
    code: string; // Internal Code (RUNNING NO.)
    name: string;
    taxId?: string;
    branchCode?: string;
    address?: Address;
    phone?: string;
    email?: string;
    creditTerm?: number; // Days
    tags?: string[];
    status: Status;
}

export interface ContactPerson extends BaseEntity {
    customerId: string;
    name: string;
    role?: string;
    phone?: string;
    email?: string;
    isPrimary: boolean;
}
