import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';
import { Wallet, CheckCircle } from 'lucide-react';

interface Props {
    members: Member[];
}

export function CotisationStats({ members }: Props) {
    const { t } = useTranslation();

    const stats = useMemo(() => {
        let both = 0;
        let s1Only = 0;
        let s2Only = 0;
        let none = 0;

        members.forEach(m => {
            const status = m.cotisation_status || [false, false];
            const semester1 = status[0];
            const semester2 = status[1];
            if (semester1 && semester2) both++;
            else if (semester1) s1Only++;
            else if (semester2) s2Only++;
            else none++;
        });

        const paidFullMembers = members.filter(m => {
            const status = m.cotisation_status || [false, false];
            return status[0] && status[1];
        });

        const data = [
            { name: t('profile.bothSemesters', 'Both Semesters'), value: both, color: '#10b981' }, // emerald
            { name: t('profile.semester1Only', 'S1 Only'), value: s1Only, color: '#3b82f6' }, // blue
            { name: t('profile.semester2Only', 'S2 Only'), value: s2Only, color: '#f59e0b' }, // amber
            { name: t('profile.notPaid', 'Not Paid'), value: none, color: '#ef4444' }     // red
        ].filter(d => d.value > 0);

        const totalPaidS1 = both + s1Only;
        const totalPaidS2 = both + s2Only;
        const totalMembers = members.length || 1;

        return {
            chartData: data,
            s1Percent: ((totalPaidS1 / totalMembers) * 100).toFixed(0),
            s2Percent: ((totalPaidS2 / totalMembers) * 100).toFixed(0),
            totalBoth: both,
            paidFullMembers
        };
    }, [members, t]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Distribution Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-700">{t('members.cotisationLevels', 'Membership Fees Status')}</h3>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span>{t('profile.bothSemesters', 'Both')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <span>{t('profile.notPaid', 'None')}</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    <div className="h-[200px] w-full text-xs lg:col-span-2">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                                    {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('members.fullyPaid', 'Fully Paid')}</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{stats.totalBoth}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{t('members.fullyPaidDesc', 'Members with both semesters')}</p>
                        </div>

                        {stats.paidFullMembers.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl p-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{t('members.paidMembersList', 'Paid Members List')}</p>
                                <div className="space-y-2">
                                    {stats.paidFullMembers.slice(0, 50).map(m => (
                                        <div key={m.id} className="flex items-center gap-2 px-1">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[8px] font-bold text-emerald-700 overflow-hidden border border-emerald-200">
                                                {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : m.fullname.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-600 truncate">{m.fullname}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Semester Progress */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-6">{t('members.semesterCollection', 'Semester Collection')}</h3>
                    <div className="space-y-6">
                        {/* Semester 1 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('common.semester', 'Semester')} 1</span>
                                <span className="text-xs font-black text-blue-600">{stats.s1Percent}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${stats.s1Percent}%` }}></div>
                            </div>
                        </div>
                        
                        {/* Semester 2 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('common.semester', 'Semester')} 2</span>
                                <span className="text-xs font-black text-amber-600">{stats.s2Percent}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stats.s2Percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t('members.financialHealth', 'Financial Health')}</p>
                        <p className="text-xs text-gray-600 font-medium">{t('members.financialHealthDesc', 'Membership fee tracking')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
