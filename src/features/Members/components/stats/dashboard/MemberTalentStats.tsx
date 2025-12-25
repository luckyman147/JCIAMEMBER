import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
    members: Member[];
}

export function MemberTalentStats({ members }: Props) {
    const { t } = useTranslation();

    const parseTalent = (raw: any): string[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(i => typeof i === 'string' && i.trim() !== '');
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return raw.split(',').map(s => s.trim()).filter(s => s !== '');
            }
        }
        return [];
    };

    const { strengthsData, strengthsFilled } = useMemo(() => {
        const counts: Record<string, number> = {};
        let filledCount = 0;
        members.forEach(m => {
            const list = parseTalent(m.strengths);
            if (list.length > 0) {
                filledCount++;
                list.forEach(s => {
                    counts[s] = (counts[s] || 0) + 1;
                });
            }
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ 
                name: t(`profile.strengthOptions.${name}`, { defaultValue: name }), 
                value 
            }));
        return { strengthsData: data, strengthsFilled: filledCount };
    }, [members, t]);

    const { weaknessesData, weaknessesFilled } = useMemo(() => {
        const counts: Record<string, number> = {};
        let filledCount = 0;
        members.forEach(m => {
            const list = parseTalent(m.weaknesses);
            if (list.length > 0) {
                filledCount++;
                list.forEach(w => {
                    counts[w] = (counts[w] || 0) + 1;
                });
            }
        });
        const data = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ 
                name: t(`profile.weaknessOptions.${name}`, { defaultValue: name }), 
                value 
            }));
        return { weaknessesData: data, weaknessesFilled: filledCount };
    }, [members, t]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strengths Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.strengthsDistribution', 'Top Strengths')}</h3>
                            <p className="text-[10px] text-gray-500 font-medium">{t('members.talentDensitySubtitle', 'Most common skills in the community')}</p>
                        </div>
                    </div>
                    <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100 text-green-700 text-[10px] font-bold">
                        {strengthsFilled} / {members.length} {t('common.members', 'Members')}
                    </div>
                </div>
                
                <div className="relative h-[300px] w-full mt-4">
                    {strengthsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={strengthsData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    fontSize={10} 
                                    stroke="#64748b"
                                    width={100}
                                    tick={{ fontWeight: 500 }}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 4}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}>
                                    {strengthsData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(142, 70%, ${Math.max(30, 65 - (index * 5))}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                             <ShieldCheck className="w-12 h-12 opacity-10" />
                             <p className="italic text-xs font-medium">{t('members.noTalentData', 'No data available yet')}</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-green-600">{strengthsFilled} {t('members.filled', 'Remplis')}</span>
                    <span className="text-gray-400">{members.length - strengthsFilled} {t('members.notFilled', 'Vides')}</span>
                </div>
            </div>

            {/* Weaknesses Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.weaknessesDistribution', 'Areas for Growth')}</h3>
                            <p className="text-[10px] text-gray-500 font-medium">{t('members.weaknessDensitySubtitle', 'Common challenges members are working on')}</p>
                        </div>
                    </div>
                    <div className="bg-red-50 px-3 py-1 rounded-full border border-red-100 text-red-700 text-[10px] font-bold">
                        {weaknessesFilled} / {members.length} {t('common.members', 'Members')}
                    </div>
                </div>
                
                <div className="relative h-[300px] w-full mt-4">
                    {weaknessesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weaknessesData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    fontSize={10} 
                                    stroke="#64748b"
                                    width={100}
                                    tick={{ fontWeight: 500 }}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 4}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}>
                                    {weaknessesData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(0, 70%, ${Math.max(30, 65 - (index * 5))}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                             <AlertCircle className="w-12 h-12 opacity-10" />
                             <p className="italic text-xs font-medium">{t('members.noTalentData', 'No data available yet')}</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className="text-red-600">{weaknessesFilled} {t('members.filled', 'Remplis')}</span>
                    <span className="text-gray-400">{members.length - weaknessesFilled} {t('members.notFilled', 'Vides')}</span>
                </div>
            </div>
        </div>
    );
}
