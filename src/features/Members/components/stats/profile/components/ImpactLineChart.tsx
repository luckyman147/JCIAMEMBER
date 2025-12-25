import React, { useState } from 'react';
import { Star, Activity as ActivityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useImpactChart } from '../hooks/useImpactChart';
import type { ActivityHistoryItem } from '../interfaces/MemberActivities.types';

interface ImpactLineChartProps {
    items: ActivityHistoryItem[];
}

const ImpactLineChart: React.FC<ImpactLineChartProps> = ({ items }) => {
    const { t, i18n } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const {
        ratedItems,
        chartConfig,
        points,
        areaPoints,
        getX,
        getY,
        hasEnoughData
    } = useImpactChart(items);

    if (!hasEnoughData) {
        return (
            <div className="flex-1 flex flex-col min-h-[120px]">
                 <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-orange-500" /> {t('profile.memberImpactTrend')}
                </h4>
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic">
                    {t('profile.notEnoughDataTrend')}
                </div>
            </div>
        );
    }

    const { width, height, padding } = chartConfig;

    const getRatingColor = (rate: number) => {
        if (rate >= 4.5) return "#22c55e";
        if (rate >= 3.5) return "#a3e635";
        if (rate >= 2.5) return "#facc15";
        if (rate >= 1.5) return "#fb923c";
        return "#f87171";
    };

    return (
        <div className="flex-1 min-h-[120px] w-full relative group">
             <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-orange-500" /> {t('profile.memberImpactTrend')}
            </h4>
            <div className="relative flex items-center justify-center h-[120px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-myPrimary, #3b82f6)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="var(--color-myPrimary, #3b82f6)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {[1, 2, 3, 4, 5].map(r => (
                        <line key={r} x1={padding} y1={getY(r)} x2={width - padding} y2={getY(r)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" className="dark:stroke-slate-700" />
                    ))}

                    <polygon points={areaPoints} fill="url(#lineGradient)" className="opacity-20" />

                    <polyline
                        fill="none"
                        stroke="var(--color-myPrimary, #3b82f6)"
                        strokeWidth="3"
                        points={points}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                        style={{ transformOrigin: 'center', transform: i18n.dir() === 'rtl' ? 'scaleX(-1)' : 'none' }}
                    />

                    {ratedItems.map((item, index) => {
                        const rate = item.participation?.rate || 0;
                        const cx = getX(index);
                        const cy = getY(rate);
                        const isHovered = hoveredIndex === index;
                        const color = getRatingColor(rate);

                        return (
                            <g key={item.activity.id}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="cursor-pointer"
                            >
                                <circle cx={cx} cy={cy} r={isHovered ? 8 : 0} fill={color} opacity="0.3" className="transition-all duration-300" />
                                <circle cx={cx} cy={cy} r={isHovered ? 5 : 3.5} fill={isHovered ? color : "white"} stroke={color} strokeWidth="2.5" className="transition-all duration-200" />
                            </g>
                        );
                    })}
                </svg>

                {hoveredIndex !== null && ratedItems[hoveredIndex] && (
                    <div
                        className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg py-1.5 px-3 shadow-xl pointer-events-none transform -translate-y-full transition-all"
                        style={{
                            left: `${(getX(hoveredIndex) / width) * 100}%`,
                            top: `${(getY(ratedItems[hoveredIndex].participation?.rate || 0) / height) * 100}%`,
                            marginTop: '-12px',
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div className="font-semibold whitespace-nowrap">{ratedItems[hoveredIndex].activity.name}</div>
                        <div className="flex items-center gap-1 text-slate-300">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {ratedItems[hoveredIndex].participation?.rate}/5
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 end-0 text-[10px] text-gray-400">{t('profile.latest')}</div>
        </div>
    );
};

export default ImpactLineChart;
