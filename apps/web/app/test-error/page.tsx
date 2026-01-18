'use client';

/**
 * Test Route to Trigger Error Boundary
 * FOR TESTING ONLY - DO NOT USE IN PRODUCTION
 * Navigate to /test-error to trigger intentional error
 */

import { useState } from 'react';
import { Button } from '@platform/ui-kit';

export default function TestErrorPage() {
    const [shouldError, setShouldError] = useState(false);

    if (shouldError) {
        // Intentionally throw error to test error boundary
        throw new Error('This is an intentional test error to verify error boundary');
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">Error Boundary Test Page</h1>
                <p className="text-gray-600">Click the button below to trigger an error</p>
                <Button
                    variant="danger"
                    onClick={() => setShouldError(true)}
                >
                    🧨 Trigger Error
                </Button>
                <p className="text-xs text-gray-400">
                    This page is for testing only
                </p>
            </div>
        </div>
    );
}
