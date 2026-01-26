/**
 * Notification Helpers
 * 
 * Centralized toast notification functions using sonner
 * Provides consistent notification behavior across the application
 */

import { toast } from 'sonner';
import type { MappedError } from '@super-platform/core';

/**
 * แสดง success notification
 * 
 * @example
 * ```ts
 * notifySuccess('Role created successfully!');
 * ```
 */
export function notifySuccess(message: string) {
    toast.success(message);
}

/**
 * แสดง info notification
 * 
 * @example
 * ```ts
 * notifyInfo('Processing your request...');
 * ```
 */
export function notifyInfo(message: string) {
    toast.info(message);
}

/**
 * แสดง loading notification
 * ใช้สำหรับแสดง progress
 * 
 * @example
 * ```ts
 * const toastId = notifyLoading('Saving changes...');
 * // ... do work
 * toast.dismiss(toastId);
 * ```
 */
export function notifyLoading(message: string) {
    return toast.loading(message);
}

/**
 * แสดง error notification จาก MappedError
 * จัดการ error types ต่างๆ จาก errorMapper
 * 
 * @example
 * ```ts
 * const { error } = useApi('/api/roles');
 * if (error) {
 *   notifyError(error);
 * }
 * ```
 */
export function notifyError(error?: MappedError | null) {
    // ไม่มี error → ไม่ทำอะไร
    if (!error) {
        return;
    }

    // Toast error (default)
    if (error.type === 'toast') {
        toast.error(error.message);
        return;
    }

    // Redirect error (session expired)
    if (error.type === 'redirect') {
        toast.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        return;
    }

    // Form validation error
    if (error.type === 'form') {
        toast.error('ข้อมูลไม่ถูกต้อง');
        return;
    }

    // Fallback: แสดง message โดยตรง
    toast.error(error.message || 'เกิดข้อผิดพลาด');
}

/**
 * ปิด notification ทั้งหมด
 * 
 * @example
 * ```ts
 * dismissAll();
 * ```
 */
export function dismissAll() {
    toast.dismiss();
}
