'use client';

/**
 * Role List Component
 */

import { Card } from '@super-platform/ui';
import type { PlatformRole, PlatformRoleDefinition } from '../types';

const ROLE_COLORS: Record<PlatformRole, string> = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    user: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface RoleListProps {
    roles: PlatformRoleDefinition[];
    loading?: boolean;
    onEditRole?: (role: PlatformRoleDefinition) => void;
}

export function RoleList({ roles, loading, onEditRole }: RoleListProps) {
    if (loading) {
        return <div className="animate-pulse">Loading roles...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
                <Card
                    key={role.roleId}
                    className={`border-2 ${ROLE_COLORS[role.roleId]}`}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{role.displayName}</h3>
                            {role.roleId !== 'owner' && (
                                <button
                                    onClick={() => onEditRole?.(role)}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">{role.description}</p>

                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold uppercase text-gray-500">
                                Permissions ({role.permissions.length})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.slice(0, 5).map((p) => (
                                    <span
                                        key={p}
                                        className="text-xs bg-white/50 px-2 py-0.5 rounded"
                                    >
                                        {p.split(':')[2]}
                                    </span>
                                ))}
                                {role.permissions.length > 5 && (
                                    <span className="text-xs text-gray-500">
                                        +{role.permissions.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
