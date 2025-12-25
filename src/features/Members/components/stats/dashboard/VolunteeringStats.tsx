import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Users, Zap } from 'lucide-react';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
    members: Member[];
}

export function VolunteeringStats({ members }: Props) {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        const filledMembers = members.filter(m => (m.estimated_volunteering_hours || 0) > 0);
        const totalHours = filledMembers.reduce((acc, m) => acc + (m.estimated_volunteering_hours || 0), 0);
        const avgHours = filledMembers.length > 0 ? (totalHours / filledMembers.length).toFixed(1) : '0';
        const filledRate = ((filledMembers.length / members.length) * 100).toFixed(0);

        const ranges = [
            { name: '1-2h', min: 1, max: 2, count: 0 },
            { name: '3-5h', min: 3, max: 5, count: 0 },
            { name: '6-10h', min: 6, max: 10, count: 0 },
            { name: '10h+', min: 11, max: Infinity, count: 0 },
        ];

        filledMembers.forEach(m => {
            const h = m.estimated_volunteering_hours || 0;
            const range = ranges.find(r => h >= r.min && h <= r.max);
            if (range) range.count++;
        });

        return {
            avgHours,
            filledRate,
            filledCount: filledMembers.length,
            totalCount: members.length,
            distribution: ranges.map(r => ({ name: r.name, value: r.count }))
        };
    }, [members]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-6">{t('members.volunteeringOverview', 'Volunteering Overview')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100/50 text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('members.avgHours', 'Avg Hours')}</span>
                            </div>
                            <p className="text-2xl font-black text-emerald-900">{stats.avgHours}</p>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">{t('profile.hoursAbbr', 'hrs')}/{t('profile.week', 'week')}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50 text-center">
                            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('members.filledRate', 'Filled Rate')}</span>
                            </div>
                            <p className="text-2xl font-black text-blue-900">{stats.filledRate}%</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase">{stats.filledCount}/{stats.totalCount}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('members.commitmentTitle', 'Commitment Level')}</p>
                        <p className="text-xs text-gray-600 font-medium">{t('members.commitmentDesc', 'Based on self-reported hours')}</p>
                    </div>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('members.volunteeringDistribution', 'Time Commitment Distribution')}</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={stats.distribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                            <Tooltip 
                                cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} 
                                formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]}
                            />
                            <Bar name={t('common.members')} dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                                {stats.distribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
