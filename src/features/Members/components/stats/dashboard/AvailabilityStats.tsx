import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Props {
    members: Member[];
}

export function AvailabilityStats({ members }: Props) {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        const timeCounts: Record<string, number> = { 'Matinal': 0, 'Afternoon': 0, 'Full Day': 0 };
        const dayCounts: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
        const dayMapping: Record<string, string> = {
            'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 
            'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'
        };

        let filled = 0;
        members.forEach(m => {
            const time = m.availability_time;
            const days = m.availability_days || [];
            if (time || days.length > 0) filled++;
            if (time === 'matinal') timeCounts['Matinal']++;
            else if (time === 'afternoon') timeCounts['Afternoon']++;
            else if (time === 'full_day') timeCounts['Full Day']++;
            days.forEach(day => {
                const shortDay = dayMapping[day.toLowerCase()];
                if (shortDay) dayCounts[shortDay]++;
            });
        });

        return {
            timeData: Object.entries(timeCounts).map(([name, value]) => ({ name, value })),
            dayData: Object.entries(dayCounts).map(([name, value]) => ({ name, value })),
            filled,
            notFilled: members.length - filled
        };
    }, [members]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('members.timePreferences', 'Time Preferences')}</h4>
                    <div className="h-[180px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={stats.timeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={70} />
                                <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Bar name={t('common.members')} dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.timeData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('members.weeklySchedule', 'Weekly Schedule')}</h4>
                    <div className="h-[180px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={stats.dayData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                                <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Bar name={t('common.members')} dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20}>
                                    {stats.dayData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[10px] font-medium uppercase text-gray-400">
                <span>{stats.filled} {t('members.filled', 'Filled')}</span>
                <span>{stats.notFilled} {t('members.notFilled', 'Not Filled')}</span>
            </div>
        </div>
    );
}
