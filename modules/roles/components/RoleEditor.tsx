'use client';

/**
 * Role Editor Component
 */

import { useState } from 'react';
import type { PlatformRoleDefinition } from '../types';
import { PLATFORM_PERMISSIONS } from '../types';

interface RoleEditorProps {
    role: PlatformRoleDefinition;
    onSave: (permissions: string[]) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function RoleEditor({ role, onSave, onCancel, loading }: RoleEditorProps) {
    const [permissions, setPermissions] = useState<string[]>([...role.permissions]);

    const togglePermission = (key: string) => {
        setPermissions((prev) =>
            prev.includes(key)
                ? prev.filter((p) => p !== key)
                : [...prev, key]
        );
    };

    // Group permissions by category
    const permissionsByCategory = Object.entries(PLATFORM_PERMISSIONS).reduce(
        (acc, [key, description]) => {
            const category = key.split(':')[1];
            if (!acc[category]) acc[category] = [];
            acc[category].push({ key, description });
            return acc;
        },
        {} as Record<string, { key: string; description: string }[]>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Edit {role.displayName} Permissions</h3>

            <div className="space-y-3">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category}>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">
                            {category}
                        </h4>
                        {perms.map((p) => (
                            <label key={p.key} className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    checked={permissions.includes(p.key)}
                                    onChange={() => togglePermission(p.key)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">{p.description}</span>
                            </label>
                        ))}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 pt-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1 text-sm border border-gray-300 rounded"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(permissions)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
