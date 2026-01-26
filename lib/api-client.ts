import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'admin_context_org_id';

interface ApiOptions extends RequestInit {
    // Option to explicitly skip org injection (e.g. for creating orgs or user profile)
    skipOrgContext?: boolean;
}

/**
 * Standardized API Client for Platform
 * Automatically injects 'x-org-id' from localStorage if present
 * Handles 401/403 errors centrally
 */
export async function apiClient<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { skipOrgContext = false, headers = {}, ...rest } = options;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    // Inject Org Context for Admin
    if (!skipOrgContext && typeof window !== 'undefined') {
        const orgId = localStorage.getItem(STORAGE_KEY);
        if (orgId) {
            requestHeaders['x-org-id'] = orgId;
        }
    }

    try {
        const res = await fetch(endpoint, {
            ...rest,
            headers: requestHeaders,
        });

        // Handle Auth Errors
        if (res.status === 401) {
            // Redirect to login if needed, or just warn
            if (typeof window !== 'undefined') {
                window.location.href = '/en/auth/login';
            }
            throw new Error('Unauthorized');
        }

        if (res.status === 403) {
            const errorData = await res.json().catch(() => ({}));
            const msg = errorData?.error || 'Access Forbidden';
            toast.error(`Permission Denied: ${msg}`);
            throw new Error(msg);
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData?.error || `API Error: ${res.statusText}`);
        }

        // Handle 204 No Content
        if (res.status === 204) {
            return {} as T;
        }

        return await res.json();

    } catch (error: any) {
        console.error(`[API Client] Error calling ${endpoint}:`, error);
        // Rethrow for component-level handling
        throw error;
    }
}
