/**
 * PageHeader Pattern
 * Title/subtitle left + CTA buttons right
 * Zero inline styles - Phase 15/16 compliant
 */

import React from 'react';

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: { label: string; href?: string }[];
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    breadcrumbs,
    actions,
    className = '',
}) => {
    return (
        <div className={`flex items-start justify-between gap-6 mb-8 ${className}`}>
            <div className="flex flex-col gap-1 flex-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1 text-sm text-neutral-600 mb-1" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {crumb.href ? (
                                    <a
                                        href={crumb.href}
                                        className="text-neutral-600 no-underline cursor-pointer transition-colors hover:text-neutral-900"
                                    >
                                        {crumb.label}
                                    </a>
                                ) : (
                                    <span>{crumb.label}</span>
                                )}
                                {index < breadcrumbs.length - 1 && <span>/</span>}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
                <h1 className="text-3xl font-bold leading-tight text-neutral-900 m-0">{title}</h1>
                {subtitle && <p className="text-base font-normal leading-normal text-neutral-600 m-0">{subtitle}</p>}
            </div>

            {actions && <div className="flex items-center gap-4 flex-shrink-0">{actions}</div>}
        </div>
    );
};
