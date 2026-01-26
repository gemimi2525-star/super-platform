/**
 * Product & Service Domain Types
 */

import { BaseEntity, Money } from '../common/base';

export enum ProductType {
    GOODS = 'goods',
    SERVICE = 'service'
}

export interface TaxRule extends BaseEntity {
    code: string; // 'VAT7', 'VAT0', 'EXEMPT'
    rate: number; // Percentage
    isInclusive: boolean; // Price includes tax?
}

export interface Product extends BaseEntity {
    type: ProductType;
    sku: string;
    name: string;
    description?: string;
    categoryId?: string;
    unit: string;
    price: number; // Standard Selling Price
    cost?: number; // Standard Cost
    taxRuleId?: string;
    trackStock: boolean;
    active: boolean;
}
