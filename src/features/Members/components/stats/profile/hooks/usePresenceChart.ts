import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActivityHistoryItem, TimeRange, ChartData } from '../interfaces/MemberActivities.types';

export const usePresenceChart = (items: ActivityHistoryItem[]) => {
    const { t, i18n } = useTranslation();
    const [period, setPeriod] = useState<TimeRange>('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const currentLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    const chartData = useMemo(() => {
        const attended = items.filter(i => i.status === 'attended');
        const now = new Date();
        
        let filteredAttended = attended;
        let groupBy: (d: Date) => string;
        let buckets: string[] = [];

        if (period === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => `${t('profile.day')} ${d.getDate()}`;
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            buckets = Array.from({length: daysInMonth}, (_, i) => `${t('profile.day')} ${i + 1}`);
        } else if (period === 'trimester') {
            const start = new Date();
            start.setMonth(now.getMonth() - 3);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => d.toLocaleString(currentLocale, { month: 'short' });
            buckets = [];
            for(let i=3; i>=0; i--) {
                const d = new Date();
                d.setMonth(now.getMonth() - i);
                buckets.push(d.toLocaleString(currentLocale, { month: 'short' }));
            }
        } else if (period === 'year') {
            const start = new Date(now.getFullYear(), 0, 1);
            filteredAttended = attended.filter(i => new Date(i.activity.activity_begin_date) >= start);
            groupBy = (d) => d.toLocaleString(currentLocale, { month: 'short' });
            buckets = Array.from({ length: 12 }, (_, i) => {
                const d = new Date(now.getFullYear(), i, 1);
                return d.toLocaleString(currentLocale, { month: 'short' });
            });
        } else {
            const start = customStart ? new Date(customStart) : new Date(0);
            const end = customEnd ? new Date(customEnd) : new Date();
            filteredAttended = attended.filter(i => {
                const d = new Date(i.activity.activity_begin_date);
                return d >= start && d <= end;
            });
            groupBy = (d) => d.toLocaleDateString(currentLocale, { month: 'short', day: 'numeric' });
            
            const sortedDates = filteredAttended
                .map(i => new Date(i.activity.activity_begin_date))
                .sort((a,b) => a.getTime() - b.getTime());
            
            buckets = Array.from(new Set(sortedDates.map(groupBy)));
        }

        const counts = new Map<string, number>();
        filteredAttended.forEach(i => {
            const key = groupBy(new Date(i.activity.activity_begin_date));
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return buckets.map(b => ({ label: b, count: counts.get(b) || 0 } as ChartData));
    }, [items, period, customStart, customEnd, currentLocale, t]);

    const maxVal = Math.max(...chartData.map(d => d.count), 5);

    return {
        period,
        setPeriod,
        customStart,
        setCustomStart,
        customEnd,
        setCustomEnd,
        chartData,
        maxVal,
        hasData: chartData.some(d => d.count > 0)
    };
};
