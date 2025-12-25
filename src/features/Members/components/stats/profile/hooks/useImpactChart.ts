import { useMemo } from 'react';
import type { ActivityHistoryItem } from '../interfaces/MemberActivities.types';

export const useImpactChart = (items: ActivityHistoryItem[]) => {
    const ratedItems = useMemo(() => {
        return items
            .filter(i => i.status === 'attended' && i.participation?.rate)
            .sort((a, b) => new Date(a.activity.activity_begin_date).getTime() - new Date(b.activity.activity_begin_date).getTime());
    }, [items]);

    const chartConfig = {
        height: 120,
        width: 240,
        padding: 15
    };

    const getY = (rate: number) => chartConfig.height - chartConfig.padding - (rate / 5) * (chartConfig.height - 2 * chartConfig.padding);
    const getX = (index: number) => chartConfig.padding + (index / (ratedItems.length - 1)) * (chartConfig.width - 2 * chartConfig.padding);

    const points = useMemo(() => {
        return ratedItems.map((item, index) => {
            const rate = item.participation?.rate || 0;
            return `${getX(index)},${getY(rate)}`;
        }).join(' ');
    }, [ratedItems]);

    const areaPoints = useMemo(() => {
        if (ratedItems.length === 0) return '';
        return `${getX(0)},${chartConfig.height-chartConfig.padding} ${points} ${getX(ratedItems.length-1)},${chartConfig.height-chartConfig.padding}`;
    }, [points, ratedItems, chartConfig.height, chartConfig.padding]);

    return {
        ratedItems,
        chartConfig,
        points,
        areaPoints,
        getX,
        getY,
        hasEnoughData: ratedItems.length >= 2
    };
};
