import { ReactNode } from 'react';
import { tokens } from '../styles/tokens';

export interface ContainerProps {
    children: ReactNode;
    size?: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';
    className?: string;
}

/**
 * Container - Responsive max-width wrapper
 * 
 * Automatically centers content and applies appropriate max-width
 * based on breakpoint tier.
 */
export function Container({
    children,
    size = 'desktop',
    className = '',
}: ContainerProps) {
    const maxWidth = tokens.layout.container[size];

    return (
        <div
            className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
            style={{
                maxWidth,
            }}
        >
            {children}
        </div>
    );
}
