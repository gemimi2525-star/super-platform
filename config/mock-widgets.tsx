import React from 'react';

// --- MOCK WIDGET IMPLEMENTATIONS ---
// Ideally these live in `modules/*/widgets/*.tsx`

export const UsersSummaryWidget = () => (
    <div className="flex flex-col gap-2 h-full justify-center">
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">1,245</span>
            <span className="text-sm font-medium text-green-600">↑ 12%</span>
        </div>
        <div className="text-sm text-neutral-500">Active Users</div>
    </div>
);

export const AuditActivityWidget = () => (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
        <div className="flex items-center gap-2 text-xs text-neutral-500 pb-2 border-b border-neutral-100">
            <span>Latest Activity</span>
        </div>
        <div className="space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2 items-start text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">User Login Success</div>
                        <div className="text-xs text-neutral-400">2 mins ago</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const OrgOverviewWidget = () => (
    <div className="flex flex-col gap-2 h-full justify-center">
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neutral-900">8</span>
            <span className="text-sm font-medium text-neutral-400">Total</span>
        </div>
        <div className="text-sm text-neutral-500">Organizations</div>
    </div>
);
