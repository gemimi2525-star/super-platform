import { getAdminFirestore } from '@/lib/firebase-admin';
import { PERMISSIONS, Permission } from '@super-platform/core';
import { Timestamp } from 'firebase-admin/firestore';
import type { Locale } from '@/lib/i18n';

export interface PlatformRole {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: string[];
    createdAt?: string; // ISO string for client
    updatedAt?: string;
}

const COLLECTION = 'platform_roles';

// Role translations by locale
const ROLE_TRANSLATIONS = {
    owner: {
        name: {
            en: 'Platform Owner',
            th: 'เจ้าของแพลตฟอร์ม',
            zh: '平台所有者'
        },
        description: {
            en: 'Full access to all platform resources',
            th: 'เข้าถึงทรัพยากรแพลตฟอร์มทั้งหมด',
            zh: '完全访问所有平台资源'
        }
    },
    admin: {
        name: {
            en: 'Platform Admin',
            th: 'ผู้ดูแลแพลตฟอร์ม',
            zh: '平台管理员'
        },
        description: {
            en: 'Can manage users and organizations',
            th: 'สามารถจัดการผู้ใช้และองค์กร',
            zh: '可以管理用户和组织'
        }
    },
    viewer: {
        name: {
            en: 'Platform Viewer',
            th: 'ผู้ดูแพลตฟอร์ม',
            zh: '平台查看者'
        },
        description: {
            en: 'Read-only access to platform',
            th: 'สิทธิ์อ่านเท่านั้น',
            zh: '平台的只读访问权限'
        }
    }
};

// Get default roles with translations
function getDefaultRoles(locale: Locale = 'en'): PlatformRole[] {
    return [
        {
            id: 'owner',
            name: ROLE_TRANSLATIONS.owner.name[locale],
            description: ROLE_TRANSLATIONS.owner.description[locale],
            isSystem: true,
            permissions: PERMISSIONS.map(p => p.id),
        },
        {
            id: 'admin',
            name: ROLE_TRANSLATIONS.admin.name[locale],
            description: ROLE_TRANSLATIONS.admin.description[locale],
            isSystem: true,
            permissions: [
                'users.read', 'users.write',
                'roles.read',
                'audit.read',
                'orgs.read', 'orgs.write', 'orgs.delete'
            ],
        },
        {
            id: 'viewer',
            name: ROLE_TRANSLATIONS.viewer.name[locale],
            description: ROLE_TRANSLATIONS.viewer.description[locale],
            isSystem: true,
            permissions: PERMISSIONS.filter(p => p.action === 'read').map(p => p.id),
        }
    ];
}

export async function getRoles(locale: Locale = 'en'): Promise<PlatformRole[]> {
    const db = getAdminFirestore();
    const snapshot = await db.collection(COLLECTION).get();

    if (snapshot.empty) {
        // Initialize defaults if empty (using English for storage)
        await initializeDefaultRoles();
        return getDefaultRoles(locale);
    }

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const roleId = doc.id;

        // For system roles, use translated name/description
        if (data.isSystem && roleId in ROLE_TRANSLATIONS) {
            const roleKey = roleId as keyof typeof ROLE_TRANSLATIONS;
            return {
                id: doc.id,
                name: ROLE_TRANSLATIONS[roleKey].name[locale],
                description: ROLE_TRANSLATIONS[roleKey].description[locale],
                isSystem: data.isSystem,
                permissions: data.permissions || [],
                createdAt: data.createdAt?.toDate?.().toISOString(),
                updatedAt: data.updatedAt?.toDate?.().toISOString(),
            };
        }

        // For custom roles, return as-is from DB
        return {
            id: doc.id,
            name: data.name,
            description: data.description,
            isSystem: data.isSystem,
            permissions: data.permissions || [],
            createdAt: data.createdAt?.toDate?.().toISOString(),
            updatedAt: data.updatedAt?.toDate?.().toISOString(),
        };
    });
}

export async function getRole(id: string, locale: Locale = 'en'): Promise<PlatformRole | null> {
    const db = getAdminFirestore();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data()!;

    // For system roles, use translated name/description
    if (data.isSystem && id in ROLE_TRANSLATIONS) {
        const roleKey = id as keyof typeof ROLE_TRANSLATIONS;
        return {
            id: doc.id,
            name: ROLE_TRANSLATIONS[roleKey].name[locale],
            description: ROLE_TRANSLATIONS[roleKey].description[locale],
            isSystem: data.isSystem,
            permissions: data.permissions || [],
            createdAt: data.createdAt?.toDate?.().toISOString(),
            updatedAt: data.updatedAt?.toDate?.().toISOString(),
        };
    }

    // For custom roles, return as-is
    return {
        id: doc.id,
        name: data.name,
        description: data.description,
        isSystem: data.isSystem,
        permissions: data.permissions || [],
        createdAt: data.createdAt?.toDate?.().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString(),
    };
}

export async function createRole(data: Omit<PlatformRole, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getAdminFirestore();
    const docRef = db.collection(COLLECTION).doc(); // Auto ID

    await docRef.set({
        ...data,
        isSystem: false,
        permissions: data.permissions || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return docRef.id;
}

export async function updateRole(id: string, data: Partial<Omit<PlatformRole, 'id' | 'isSystem' | 'createdAt'>>): Promise<void> {
    const db = getAdminFirestore();

    // Prevent system role modification on name/desc? (Optional: allow updating permissions but rarely name)
    // For now: allow full edit
    await db.collection(COLLECTION).doc(id).update({
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteRole(id: string): Promise<void> {
    const db = getAdminFirestore();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) throw new Error('Role not found');
    if (doc.data()?.isSystem) throw new Error('Cannot delete system role');

    // Check if role is in use by any users
    const usersWithRole = await db.collection('users')
        .where('roleId', '==', id)
        .limit(1)
        .get();

    if (!usersWithRole.empty) {
        throw new Error('Cannot delete role: Role is in use by one or more users');
    }

    await db.collection(COLLECTION).doc(id).delete();
}

export async function copyRole(sourceRoleId: string, newName: string): Promise<string> {
    const sourceRole = await getRole(sourceRoleId);
    if (!sourceRole) throw new Error('Source role not found');

    return createRole({
        name: newName,
        description: `Copy of ${sourceRole.name}`,
        permissions: sourceRole.permissions,
    });
}

async function initializeDefaultRoles() {
    const db = getAdminFirestore();
    const batch = db.batch();

    // Store English version in DB (default locale)
    const defaultRoles = getDefaultRoles('en');

    for (const role of defaultRoles) {
        const ref = db.collection(COLLECTION).doc(role.id);
        batch.set(ref, {
            ...role,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }

    await batch.commit();
}
