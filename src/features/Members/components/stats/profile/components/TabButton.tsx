import React from 'react';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            active
                ? 'bg-white dark:bg-slate-600 text-(--color-myPrimary) dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
        }`}
    >
        {label}
    </button>
);

export default TabButton;
