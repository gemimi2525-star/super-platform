'use client';

/**
 * Reusable Error Boundary Component
 * Catches React errors in component tree
 */

import React, { Component, ReactNode } from 'react';
import { handleError } from './error-handler';
import type { AppError } from './types';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: AppError, reset: () => void) => ReactNode;
    onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        const appError = handleError(error);
        return {
            hasError: true,
            error: appError,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        const appError = handleError(error);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(appError);
        }

        // Log component stack in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Component Stack:', errorInfo.componentStack);
        }
    }

    reset = (): void => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.reset);
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-4">
                            {process.env.NODE_ENV === 'development'
                                ? this.state.error.message
                                : 'An unexpected error occurred. Please try again.'}
                        </p>
                        <button
                            onClick={this.reset}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
