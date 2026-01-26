/**
 * Firebase Brand Utilities
 * 
 * Upload and manage brand logo in Firebase Storage
 * Store settings in Firestore at /platform_settings/brand
 */

import {
    storage,
    db,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from '@/lib/firebase/client';

const BRAND_STORAGE_PATH = 'brand/logo';
const PLATFORM_SETTINGS_COLLECTION = 'platform_settings';
const BRAND_DOC_ID = 'brand';

/** Per-location brand display settings */
export interface LocationBrandSettings {
    logoScale: number;       // 50-200, default 100
    brandNameScale: number;  // 50-200, default 100
    gap: number;             // 0-32px, default 8
    brandName: string;       // Per-location brand name (empty = use default)
}

export const DEFAULT_HEADER: LocationBrandSettings = {
    logoScale: 100,
    brandNameScale: 100,
    gap: 8,
    brandName: '',
};

export const DEFAULT_SIDEBAR: LocationBrandSettings = {
    logoScale: 100,
    brandNameScale: 100,
    gap: 8,
    brandName: '',
};

export const DEFAULT_LOGIN: LocationBrandSettings = {
    logoScale: 100,
    brandNameScale: 100,
    gap: 12,
    brandName: '',
};

/** Legacy: Scale settings for each location (for backwards compatibility) */
export interface LogoScales {
    header: number;
    login: number;
}

export const DEFAULT_LOGO_SCALES: LogoScales = {
    header: 100,
    login: 100,
};

/** Legacy: Brand name settings */
export interface BrandNameSettings {
    name: string;
    scale: number;
}

export const DEFAULT_BRAND_NAME: BrandNameSettings = {
    name: '',
    scale: 100,
};

export interface BrandSettings {
    logoUrl: string;
    logoFileName?: string;
    header: LocationBrandSettings;   // Header-specific settings
    sidebar: LocationBrandSettings;  // Sidebar-specific settings
    login: LocationBrandSettings;    // Login page settings
    // Legacy fields for backwards compatibility
    brandName?: string;  // Legacy: shared brand name
    logoScales?: LogoScales;
    brandNameOld?: BrandNameSettings;
    updatedAt?: Date;
    updatedBy?: string;
}

/**
 * Delete old logo from Firebase Storage
 */
export async function deleteOldLogo(fileName: string): Promise<void> {
    if (!fileName) return;

    try {
        const storageRef = ref(storage, `${BRAND_STORAGE_PATH}/${fileName}`);
        await deleteObject(storageRef);
        console.log('Deleted old logo:', fileName);
    } catch (error: any) {
        if (error?.code !== 'storage/object-not-found') {
            console.error('Error deleting old logo:', error);
        }
    }
}

/**
 * Delete stored logo (by filename in settings)
 */
export async function deleteStoredLogo(): Promise<void> {
    try {
        const settings = await getBrandSettings();
        if (settings?.logoFileName) {
            await deleteOldLogo(settings.logoFileName);
        }
    } catch (error) {
        console.error('Error deleting stored logo:', error);
    }
}

/**
 * Upload a new logo to Firebase Storage
 */
export async function uploadBrandLogo(file: File): Promise<{ downloadUrl: string; fileName: string }> {
    if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image.');
    }

    await deleteStoredLogo();

    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const validExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    const ext = validExtensions.includes(originalExt) ? originalExt : 'png';

    const fileName = `logo_${Date.now()}.${ext}`;
    const storageRef = ref(storage, `${BRAND_STORAGE_PATH}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
            uploadedAt: new Date().toISOString(),
        },
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { downloadUrl, fileName };
}

/**
 * Save brand settings to Firestore
 */
export async function saveBrandSettings(
    settings: Partial<BrandSettings>,
    userId?: string
): Promise<void> {
    const docRef = doc(db, PLATFORM_SETTINGS_COLLECTION, BRAND_DOC_ID);

    await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userId || 'anonymous',
    }, { merge: true });
}

/**
 * Get current brand settings from Firestore
 * Handles migration from legacy format
 */
export async function getBrandSettings(): Promise<BrandSettings | null> {
    try {
        const docRef = doc(db, PLATFORM_SETTINGS_COLLECTION, BRAND_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Handle new format (3 separate locations with per-location brandName)
            if (data.header && data.sidebar && data.login) {
                // Ensure each location has brandName (migration from intermediate format)
                const legacyBrandName = data.brandName || '';
                return {
                    logoUrl: data.logoUrl || '',
                    logoFileName: data.logoFileName || '',
                    header: {
                        ...DEFAULT_HEADER,
                        ...data.header,
                        brandName: data.header.brandName ?? legacyBrandName,
                    },
                    sidebar: {
                        ...DEFAULT_SIDEBAR,
                        ...data.sidebar,
                        brandName: data.sidebar.brandName ?? legacyBrandName,
                    },
                    login: {
                        ...DEFAULT_LOGIN,
                        ...data.login,
                        brandName: data.login.brandName ?? legacyBrandName,
                    },
                    updatedAt: data.updatedAt?.toDate(),
                    updatedBy: data.updatedBy,
                };
            }

            // Migrate from old format (headerSidebar combined)
            if (data.headerSidebar && data.login) {
                const legacyBrandName = data.brandName || '';
                return {
                    logoUrl: data.logoUrl || '',
                    logoFileName: data.logoFileName || '',
                    header: {
                        ...data.headerSidebar,
                        brandName: legacyBrandName,
                    },
                    sidebar: {
                        ...data.headerSidebar,
                        brandName: legacyBrandName,
                    },
                    login: {
                        ...data.login,
                        brandName: legacyBrandName,
                    },
                    updatedAt: data.updatedAt?.toDate(),
                    updatedBy: data.updatedBy,
                };
            }

            // Migrate from legacy format
            const legacyLogoScales = data.logoScales || { header: 100, login: 100 };
            const legacyBrandName = data.brandName?.name || data.brandName || '';
            const legacyBrandNameScale = data.brandName?.scale || 100;

            return {
                logoUrl: data.logoUrl || '',
                logoFileName: data.logoFileName || '',
                header: {
                    logoScale: legacyLogoScales.header || 100,
                    brandNameScale: legacyBrandNameScale,
                    gap: 8,
                    brandName: typeof legacyBrandName === 'string' ? legacyBrandName : '',
                },
                sidebar: {
                    logoScale: legacyLogoScales.header || 100,
                    brandNameScale: legacyBrandNameScale,
                    gap: 8,
                    brandName: typeof legacyBrandName === 'string' ? legacyBrandName : '',
                },
                login: {
                    logoScale: legacyLogoScales.login || 100,
                    brandNameScale: legacyBrandNameScale,
                    gap: 12,
                    brandName: typeof legacyBrandName === 'string' ? legacyBrandName : '',
                },
                updatedAt: data.updatedAt?.toDate(),
                updatedBy: data.updatedBy,
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching brand settings:', error);
        return null;
    }
}

/**
 * Reset brand settings to default
 */
export async function resetBrandSettings(userId?: string): Promise<void> {
    await deleteStoredLogo();

    const docRef = doc(db, PLATFORM_SETTINGS_COLLECTION, BRAND_DOC_ID);

    await setDoc(docRef, {
        logoUrl: '',
        logoFileName: '',
        brandName: '',
        header: DEFAULT_HEADER,
        sidebar: DEFAULT_SIDEBAR,
        login: DEFAULT_LOGIN,
        updatedAt: serverTimestamp(),
        updatedBy: userId || 'anonymous',
    }, { merge: false }); // Replace entire document
}
