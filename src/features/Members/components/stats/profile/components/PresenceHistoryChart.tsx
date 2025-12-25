import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePresenceChart } from '../hooks/usePresenceChart';
import type { ActivityHistoryItem } from '../interfaces/MemberActivities.types';

interface PresenceHistoryChartProps {
    items: ActivityHistoryItem[];
}

const PresenceHistoryChart: React.FC<PresenceHistoryChartProps> = ({ items }) => {
    const { t } = useTranslation();
    const {
        period,
        setPeriod,
        customStart,
        setCustomStart,
        customEnd,
        setCustomEnd,
        chartData,
        maxVal,
        hasData
    } = usePresenceChart(items);

    return (
        <div className="flex-1 flex flex-col min-h-[200px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {t('profile.countOfPresences')}
                </h4>
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-lg overflow-x-auto">
                    {(['month', 'trimester', 'year', 'custom'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                                period === p ? 'bg-white dark:bg-slate-700 text-(--color-mySecondary) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t(`profile.${p}`)}
                        </button>
                    ))}
                </div>
            </div>

            {period === 'custom' && (
                <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2">
                    <input
                        type="date"
                        value={customStart}
                        onChange={e => setCustomStart(e.target.value)}
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white"
                    />
                    <input
                        type="date"
                        value={customEnd}
                        onChange={e => setCustomEnd(e.target.value)}
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] p-1 rounded-md flex-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-white"
                    />
                </div>
            )}

            <div className="flex-1 flex items-end justify-between gap-1 h-32 mt-auto">
                {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                        {d.count > 0 && (
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold rounded py-1 px-2 z-20 whitespace-nowrap">
                                {d.count} {t('profile.activitiesCount', { count: d.count })}
                            </div>
                        )}
                        <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${d.count > 0 ? 'bg-green-500/80 shadow-[0_-4px_12px_rgba(34,197,94,0.2)]' : 'bg-gray-200/50 dark:bg-slate-700/50'}`}
                            style={{ height: `${(d.count / maxVal) * 100}%`, minHeight: '4px' }}
                        />
                        <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase truncate w-full text-center">
                            {period === 'month' ? (i % 5 === 0 ? d.label : '') : d.label}
                        </span>
                    </div>
                ))}
            </div>
            {!hasData && (
                <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400">{t('profile.noPresencesInRange')}</span>
                </div>
            )}
        </div>
    );
};

export default PresenceHistoryChart;
