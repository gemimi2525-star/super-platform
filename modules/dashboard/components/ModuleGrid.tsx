'use client';

/**
 * Module Grid Component
 * 
 * Displays available modules as a grid
 */

import Link from 'next/link';
import { Card } from '@super-platform/ui';
import type { DashboardModule } from '../types';

interface ModuleGridProps {
    modules: DashboardModule[];
}

export function ModuleGrid({ modules }: ModuleGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((module) => (
                <Link key={module.id} href={module.href}>
                    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${!module.enabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">{module.icon}</span>
                            <div>
                                <h3 className="font-semibold text-gray-900">{module.name}</h3>
                                <p className="text-sm text-gray-500">{module.description}</p>
                            </div>
                        </div>
                        {!module.enabled && (
                            <span className="absolute top-2 right-2 text-xs bg-gray-200 px-2 py-1 rounded">
                                Coming Soon
                            </span>
                        )}
                    </Card>
                </Link>
            ))}
        </div>
    );
}
