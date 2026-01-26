'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleError } from '@super-platform/core';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string; // Component name for context
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        handleError(error, {
            severity: 'warn',
            context: {
                component: this.props.name || 'UnknownComponent',
                reactParams: errorInfo.componentStack,
            }
        });
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 border border-red-100 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium">Unable to load this section</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
