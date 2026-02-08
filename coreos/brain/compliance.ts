/**
 * Core OS Compliance & Localization Engine (Phase 32)
 * Manages Country-Specific Rules (Tax, Retention) and Localization.
 */

export interface CountryRule {
    code: 'TH' | 'SG' | 'US';
    taxName: string;
    taxRate: number;
    retentionYears: number;
    locale: string;
}

const RULES: Record<string, CountryRule> = {
    TH: { code: 'TH', taxName: 'VAT', taxRate: 0.07, retentionYears: 5, locale: 'th-TH' },
    SG: { code: 'SG', taxName: 'GST', taxRate: 0.09, retentionYears: 5, locale: 'en-SG' },
    US: { code: 'US', taxName: 'Sales Tax', taxRate: 0.0, retentionYears: 7, locale: 'en-US' } // Rate varies by state, simplified
};

class ComplianceEngine {
    private currentCountry: string = 'TH';

    setCountry(code: string) {
        if (!RULES[code]) throw new Error(`Unsupported Country: ${code}`);
        this.currentCountry = code;
        console.log(`[Compliance] Country switched to ${code}`);
    }

    getRules(): CountryRule {
        return RULES[this.currentCountry];
    }

    /**
     * AI uses this to calculate tax suggestions
     */
    calculateTax(amount: number): { taxName: string, taxAmount: number } {
        const rule = this.getRules();
        return {
            taxName: rule.taxName,
            taxAmount: amount * rule.taxRate
        };
    }

    getLocale(): string {
        return this.getRules().locale;
    }
}

export const complianceEngine = new ComplianceEngine();
