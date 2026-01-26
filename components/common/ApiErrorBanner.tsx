/**
 * ApiErrorBanner Component
 * 
 * Global error banner สำหรับแสดง errors จาก errorMapper/useApi
 * ใช้รูปแบบเดียวกันทั่วทั้งแอป
 * 
 * @example
 * ```tsx
 * const { error } = useApi<User>('/api/users');
 * 
 * return (
 *   <div>
 *     <ApiErrorBanner error={error} />
 *     {data && <UserList users={data} />}
 *   </div>
 * );
 * ```
 */

'use client';

import type { MappedError } from '@super-platform/core';

interface ApiErrorBannerProps {
    /** Mapped error from errorMapper or useApi hook */
    error?: MappedError;

    /** Optional custom className */
    className?: string;
}

export default function ApiErrorBanner({ error, className = '' }: ApiErrorBannerProps) {
    // ไม่มี error → ไม่แสดงอะไร
    if (!error) {
        return null;
    }

    // Base styles
    const baseStyles = 'rounded-lg p-4 mb-4 border';
    const iconStyles = 'h-5 w-5 mr-3';

    // Error icon SVG
    const ErrorIcon = () => (
        <svg className={iconStyles} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
    );

    // Warning icon SVG
    const WarningIcon = () => (
        <svg className={iconStyles} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );

    // type = redirect → Session expired
    if (error.type === 'redirect') {
        return (
            <div className={`${baseStyles} bg-yellow-50 border-yellow-200 ${className}`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 text-yellow-600">
                        <WarningIcon />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Session หมดอายุ
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700">
                            กรุณาเข้าสู่ระบบใหม่เพื่อดำเนินการต่อ
                        </p>
                        {error.redirectTo && (
                            <p className="mt-1 text-xs text-yellow-600">
                                Redirect to: {error.redirectTo}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // type = form → Validation error
    if (error.type === 'form') {
        return (
            <div className={`${baseStyles} bg-red-50 border-red-200 ${className}`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 text-red-600">
                        <ErrorIcon />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                            ข้อมูลไม่ถูกต้อง
                        </h3>
                        <p className="mt-1 text-sm text-red-700">
                            {error.message}
                        </p>
                        {error.fieldErrors && error.fieldErrors.length > 0 && (
                            <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                                {error.fieldErrors.map((fieldError, index) => (
                                    <li key={index}>
                                        <span className="font-medium">{fieldError.field}:</span> {fieldError.message}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // type = toast (default) → General error
    return (
        <div className={`${baseStyles} bg-red-50 border-red-200 ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 text-red-600">
                    <ErrorIcon />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                        เกิดข้อผิดพลาด
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                        {error.message}
                    </p>
                    {error.originalError?.errorId && (
                        <p className="mt-2 text-xs text-red-600 font-mono">
                            Error ID: {error.originalError.errorId}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
