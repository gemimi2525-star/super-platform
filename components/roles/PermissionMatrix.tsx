'use client';

import { PERMISSIONS, MODULES_DISPLAY, PermissionModule } from '@super-platform/core';

interface PermissionMatrixProps {
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
}

export default function PermissionMatrix({ selectedPermissions, onChange, disabled }: PermissionMatrixProps) {

    // Group permissions by module
    const permissionsByModule = PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<PermissionModule, typeof PERMISSIONS>);

    const togglePermission = (id: string, checked: boolean) => {
        if (disabled) return;
        if (checked) {
            onChange([...selectedPermissions, id]);
        } else {
            onChange(selectedPermissions.filter(p => p !== id));
        }
    };

    const toggleModule = (module: PermissionModule, checked: boolean) => {
        if (disabled) return;
        const modulePermissions = permissionsByModule[module].map(p => p.id);
        if (checked) {
            // Add all from module
            const newSet = new Set([...selectedPermissions, ...modulePermissions]);
            onChange(Array.from(newSet));
        } else {
            // Remove all from module
            onChange(selectedPermissions.filter(p => !modulePermissions.includes(p)));
        }
    };

    return (
        <div className="space-y-6">
            {(Object.keys(permissionsByModule) as PermissionModule[]).map(module => {
                const modulePerms = permissionsByModule[module];
                const allSelected = modulePerms.every(p => selectedPermissions.includes(p.id));
                const someSelected = modulePerms.some(p => selectedPermissions.includes(p.id));
                const isIndeterminate = someSelected && !allSelected;

                return (
                    <div key={module} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b pb-2">
                            <h3 className="font-medium text-gray-900">{MODULES_DISPLAY[module]}</h3>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = isIndeterminate;
                                    }}
                                    onChange={(e) => toggleModule(module, e.target.checked)}
                                    disabled={disabled}
                                />
                                <span className="ml-2 text-sm text-gray-500">Select All</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modulePerms.map(perm => (
                                <label key={perm.id} className="relative flex items-start py-2 px-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="min-w-0 flex-1 text-sm">
                                        <div className="font-medium text-gray-700 select-none">
                                            {perm.name}
                                        </div>
                                        <p className="text-gray-500 select-none text-xs mt-1">
                                            {perm.description}
                                        </p>
                                    </div>
                                    <div className="ml-3 flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={selectedPermissions.includes(perm.id)}
                                            onChange={(e) => togglePermission(perm.id, e.target.checked)}
                                            disabled={disabled}
                                        />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
