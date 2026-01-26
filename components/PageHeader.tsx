'use client';

/**
 * Page Header Component
 * 
 * Standardized header for individual pages.
 * Displays title, description, and primary action (CTA).
 * 
 * Usage:
 * <PageHeader 
 *   title="Customers" 
 *   description="Manage your customers" 
 *   action={<Button>New Customer</Button>} 
 * />
 */

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-[#242424] tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-[#6B6B6B]">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="w-full sm:w-auto *:w-full sm:*:w-auto">
                        {action}
                    </div>
                </div>
            )}
        </div>
    );
}
