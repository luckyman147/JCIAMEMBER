import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Props {
    members: Member[];
}

export function PreferenceStats({ members }: Props) {
    const { t } = useTranslation();

    const socialMediaStats = useMemo(() => {
        const counts: Record<string, number> = {};
        let filled = 0;
        members.forEach(m => {
            const platform = m.preferred_social_media;
            if (platform) { filled++; counts[platform] = (counts[platform] || 0) + 1; }
        });
        return {
            data: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ 
                name: t(`profile.socialMedia.${name}`, { defaultValue: name }), value 
            })),
            filled, notFilled: members.length - filled
        };
    }, [members, t]);

    const activityTypeStats = useMemo(() => {
        const counts: Record<string, number> = {};
        let filled = 0;
        members.forEach(m => {
            const type = m.preferred_activity_type;
            if (type) { filled++; counts[type] = (counts[type] || 0) + 1; }
        });
        return {
            data: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ 
                name: t(`profile.activityTypes.${name}`, { defaultValue: name }), value 
            })),
            filled, notFilled: members.length - filled
        };
    }, [members, t]);

    const committeeStats = useMemo(() => {
        const counts: Record<string, number> = {};
        let filled = 0;
        members.forEach(m => {
            const committee = m.preferred_committee;
            if (committee) { filled++; counts[committee] = (counts[committee] || 0) + 1; }
        });
        return {
            data: Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ 
                name: t(`profile.committees.${name}`, { defaultValue: name }), value 
            })),
            filled, notFilled: members.length - filled
        };
    }, [members, t]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Social Media */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('members.socialMediaStats')}</h3>
                <div className="h-[200px] w-full text-xs">
                    {socialMediaStats.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={socialMediaStats.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {socialMediaStats.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-gray-400 italic">{t('members.noSocialData', 'No social media data')}</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[10px] font-medium uppercase">
                    <span className="text-pink-600">{socialMediaStats.filled} {t('members.filled', 'Filled')}</span>
                    <span className="text-gray-400">{socialMediaStats.notFilled} {t('members.notFilled', 'Not Filled')}</span>
                </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('members.activityStats', 'Activity Preferences')}</h3>
                <div className="h-[200px] w-full text-xs">
                    {activityTypeStats.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={activityTypeStats.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {activityTypeStats.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-gray-400 italic">{t('members.noActivityData', 'No activity data')}</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[10px] font-medium uppercase">
                    <span className="text-purple-600">{activityTypeStats.filled} {t('members.filled', 'Filled')}</span>
                    <span className="text-gray-400">{activityTypeStats.notFilled} {t('members.notFilled', 'Not Filled')}</span>
                </div>
            </div>

            {/* Committee Prefs */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('members.committeeStats', 'Committee Preferences')}</h3>
                <div className="h-[200px] w-full text-xs">
                    {committeeStats.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={committeeStats.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {committeeStats.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-gray-400 italic">{t('members.noCommitteeData', 'No committee data')}</div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[10px] font-medium uppercase">
                    <span className="text-blue-600">{committeeStats.filled} {t('members.filled', 'Filled')}</span>
                    <span className="text-gray-400">{committeeStats.notFilled} {t('members.notFilled', 'Not Filled')}</span>
                </div>
            </div>
        </div>
    );
}
