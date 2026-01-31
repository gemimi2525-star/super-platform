/**
 * Users App View
 * 
 * STEP A1.2: AppView wrapper for Users functionality
 * 
 * This is a thin wrapper that reuses the existing V2UsersPage logic
 * but is designed to be rendered inside the OS Shell.
 */

'use client';

import React from 'react';

// Re-export the existing page component as an AppView
// The actual implementation lives in the page file
// This approach minimizes code duplication during the transition

function UsersAppView() {
    // Import the page content dynamically to avoid circular imports
    const [PageContent, setPageContent] = React.useState<React.ComponentType | null>(null);

    React.useEffect(() => {
        // Dynamic import of the full page content
        import('../../users/page').then((module) => {
            setPageContent(() => module.default);
        });
    }, []);

    if (!PageContent) {
        return (
            <div className="p-8 animate-pulse">
                <div className="h-8 w-48 bg-neutral-200 rounded mb-4"></div>
                <div className="h-4 w-64 bg-neutral-200 rounded mb-8"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-neutral-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return <PageContent />;
}

export default UsersAppView;
