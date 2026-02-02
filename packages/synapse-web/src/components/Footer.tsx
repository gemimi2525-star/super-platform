import { tokens } from '../styles/tokens';

export interface FooterProps {
    locale: string;
}

/**
 * Footer - Consistent footer across all pages
 */
export function Footer({ locale }: FooterProps) {
    return (
        <footer
            className="py-8 mt-16"
            style={{
                backgroundColor: tokens.colors.neutral[900],
                color: tokens.colors.neutral[300],
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="font-medium">SYNAPSE Governance Kernel v1.5 - Verifiable Audit Ledger</p>
                <p
                    className="text-sm mt-2"
                    style={{ color: tokens.colors.neutral[400] }}
                >
                    Cryptographically verifiable governance for the modern era
                </p>
            </div>
        </footer>
    );
}
