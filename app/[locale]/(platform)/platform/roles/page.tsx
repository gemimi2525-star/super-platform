import { requireOwner } from '@/lib/auth/server';
import { getRoles } from '@/lib/roles/service';
import RolesList from '@/components/roles/RolesList';
import Link from 'next/link';

export default async function RolesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    await requireOwner();
    const { locale } = await params;

    // Pass locale to getRoles for translated role names/descriptions
    const roles = await getRoles(locale as 'en' | 'th' | 'zh');

    // Page header translations
    const translations = {
        en: {
            title: 'Role Management',
            subtitle: 'Manage platform roles and permissions',
            createButton: 'Create New Role'
        },
        th: {
            title: 'จัดการบทบาท',
            subtitle: 'จัดการบทบาทและสิทธิ์การใช้งานของแพลตฟอร์ม',
            createButton: 'สร้างบทบาทใหม่'
        },
        zh: {
            title: '角色管理',
            subtitle: '管理平台角色和权限',
            createButton: '创建新角色'
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    return (
        <div className="space-y-6">
            {/* Header: Title/Subtitle left + CTA right */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                    <p className="text-gray-500 mt-1">{t.subtitle}</p>
                </div>
                <Link
                    href={`/${locale}/platform/roles/create`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
                >
                    {t.createButton}
                </Link>
            </div>

            <RolesList initialRoles={roles} />
        </div>
    );
}
