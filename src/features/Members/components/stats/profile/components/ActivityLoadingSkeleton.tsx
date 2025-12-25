import React from 'react';

const ActivityLoadingSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                        <div className="h-16 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default ActivityLoadingSkeleton;
