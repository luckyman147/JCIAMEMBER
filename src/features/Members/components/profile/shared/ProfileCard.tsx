
import React from 'react';
import { Pencil, Check, X, type LucideIcon } from 'lucide-react';

interface ProfileCardProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    iconColorClass?: string;
    iconBgClass?: string;
    isEditing?: boolean;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    readOnly?: boolean;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    className?: string;
    activeBorderClass?: string;
}

export const ProfileCard = ({
    title,
    subtitle,
    icon: Icon,
    iconColorClass = "text-blue-600",
    iconBgClass = "bg-blue-50",
    isEditing = false,
    onEdit,
    onSave,
    onCancel,
    readOnly = true,
    children,
    headerActions,
    className = "",
    activeBorderClass = "border-blue-400 ring-4 ring-blue-50"
}: ProfileCardProps) => {
    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${isEditing ? activeBorderClass : 'border-gray-100 hover:shadow-md'} ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${iconBgClass} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${iconColorClass}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {headerActions}
                    {!readOnly && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={onSave} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button onClick={onEdit} className={`p-1.5 text-gray-400 hover:${iconColorClass} ${iconBgClass.replace('bg-', 'hover:bg-')} rounded-lg transition-all`}>
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};
