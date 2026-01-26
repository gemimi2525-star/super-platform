'use client';

/**
 * Quick Actions Component
 * 
 * Displays quick action buttons for common tasks
 */

interface QuickAction {
    label: string;
    icon: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}

interface QuickActionsProps {
    actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${action.variant === 'primary'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <span>{action.icon}</span>
                    {action.label}
                </button>
            ))}
        </div>
    );
}
