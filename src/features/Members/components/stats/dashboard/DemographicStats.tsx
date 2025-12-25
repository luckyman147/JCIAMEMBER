import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Props {
    members: Member[];
}

export function DemographicStats({ members }: Props) {
    const { t } = useTranslation();

    const roleData = useMemo(() => {
        const counts: Record<string, number> = {};
        members.forEach(m => {
            const role = m.role || 'Unknown';
            counts[role] = (counts[role] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    const statusData = useMemo(() => {
        const validated = members.filter(m => m.is_validated).length;
        const pending = members.length - validated;
        return [
            { name: 'Validated', value: validated, color: '#10b981' },
            { name: 'Pending', value: pending, color: '#f59e0b' }
        ];
    }, [members]);

    const ageStats = useMemo(() => {
        const ranges = [
            { name: '<20', min: 0, max: 19, count: 0 },
            { name: '20-25', min: 20, max: 25, count: 0 },
            { name: '26-30', min: 26, max: 30, count: 0 },
            { name: '31-35', min: 31, max: 35, count: 0 },
            { name: '36-40', min: 36, max: 40, count: 0 },
            { name: '40+', min: 41, max: Infinity, count: 0 },
        ];
        let filled = 0;
        members.forEach(m => {
            if (!m.birth_date) return;
            filled++;
            const birthDate = new Date(m.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m_diff = today.getMonth() - birthDate.getMonth();
            if (m_diff < 0 || (m_diff === 0 && today.getDate() < birthDate.getDate())) age--;
            const range = ranges.find(r => age >= r.min && age <= r.max);
            if (range) range.count++;
        });
        return {
            data: ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count })),
            filled,
            notFilled: members.length - filled
        };
    }, [members]);

    const occupationData = useMemo(() => {
        const counts: Record<string, number> = {};
        members.forEach(m => {
            const job = m.job_title || 'Other';
            counts[job] = (counts[job] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name, value }));
        const otherCount = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
        if (otherCount > 0) top5.push({ name: 'Other', value: otherCount });
        return top5;
    }, [members]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Roles */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.roles', 'Member Roles')}</h3>
                    <div className="bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-600">
                        {members.length} {t('common.total', 'Total')}
                    </div>
                </div>
                <div className="flex-1 w-full text-xs">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={roleData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={100} 
                                paddingAngle={5} 
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {roleData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.count', 'Count')]} 
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.status', 'Status')}</h3>
                </div>
                <div className="flex-1 w-full text-xs">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={statusData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={0} 
                                outerRadius={100} 
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.age', 'Age Distribution')}</h3>
                    <div className="flex gap-2 text-[10px] items-center">
                        <span className="text-emerald-600 font-bold">{ageStats.filled} {t('members.filled', 'Rempli')}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-400 font-medium">{ageStats.notFilled} {t('members.notFilled', 'Vide')}</span>
                    </div>
                </div>
                <div className="flex-1 w-full text-xs">
                    {ageStats.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ageStats.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 500}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 10, fontWeight: 500}} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 4}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.count', 'Count')]} 
                                />
                                <Bar name={t('common.members')} dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                                    {ageStats.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">{t('members.noAgeData', 'No age data available')}</div>
                    )}
                </div>
            </div>

            {/* Professional Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.occupations', 'Professional Breakdown')}</h3>
                </div>
                <div className="flex-1 w-full text-xs">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={occupationData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={100} 
                                paddingAngle={2} 
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {occupationData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
