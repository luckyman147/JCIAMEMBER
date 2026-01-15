import  { useMemo, useState } from 'react';
import { Filter, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PointsHistoryRaw {
    id: string;
    points: number;
    created_at: string;
    member_id: string;
    member: { 
        fullname: string; 
        avatar_url: string | null;
        roles?: { name: string } | { name: string }[];
        postes?: { name: string } | { name: string }[];
    } | { 
        fullname: string; 
        avatar_url: string | null;
        roles?: { name: string } | { name: string }[];
        postes?: { name: string } | { name: string }[];
    }[];
}

interface ChartProps {
    history: PointsHistoryRaw[];
}
 
type TimeFrame = 'all' | 'year' | 'quarter' | 'month';

export default function MembersGrowthChart({ history }: ChartProps) {
    const { t } = useTranslation();
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');

    const { chartData, maxScore } = useMemo(() => {
        if (!history || history.length === 0) return { chartData: [], maxScore: 0 };

        // 1. Filter History by TimeFrame
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const filteredHistory = history.filter(record => {
            const date = new Date(record.created_at);
            if (timeFrame === 'year') return date >= startOfYear;
            if (timeFrame === 'quarter') return date >= startOfQuarter;
            if (timeFrame === 'month') return date >= startOfMonth;
            return true;
        });

        if (filteredHistory.length === 0) return { chartData: [], maxScore: 0 };

        // 2. Group by Member & Sum Points
        const memberMap = new Map<string, { 
            name: string; 
            avatar: string | null;
            poste?: string;
            total: number;
        }>();

        filteredHistory.forEach(record => {
            const memberData: any = Array.isArray(record.member) ? record.member[0] : record.member;
            if (!memberData?.fullname) return;

            // Exclude Presidents and VPs
            const rawRoles = memberData.roles;
            const roleObject = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles;
            const roleName = (roleObject?.name || '').toLowerCase();
            if (roleName.includes('president') || roleName.includes('vp') || roleName === 'vice-president') return;

            if (!memberMap.has(record.member_id)) {
                const rawPostes = memberData.postes;
                const posteObject = Array.isArray(rawPostes) ? rawPostes[0] : rawPostes;
                memberMap.set(record.member_id, { 
                    name: memberData.fullname, 
                    avatar: memberData.avatar_url,
                    poste: posteObject?.name,
                    total: 0 
                });
            }

            const m = memberMap.get(record.member_id)!;
            m.total += record.points;
        });

        // 3. Identify Top 3 active in this period
        const sortedMembers = Array.from(memberMap.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 3);

        const max = Math.max(...sortedMembers.map(m => m[1].total)) || 10;

        return { 
            chartData: sortedMembers.map(([id, data], index) => ({
                id,
                ...data,
                rank: index + 1,
                color: [
                    'from-blue-500 to-blue-600',
                    'from-emerald-500 to-emerald-600',
                    'from-amber-500 to-amber-600',
                ][index % 3],
                shadowColor: [
                    'shadow-blue-200',
                    'shadow-emerald-200',
                    'shadow-amber-200',
                ][index % 3]
            })),
            maxScore: max
        };
    }, [history, timeFrame]);

    if (chartData.length === 0 && history.length > 0) {
        return (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Filter className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">{t('members.noPointsActivity', 'No points activity found for this period.')}</p>
                <div className="flex gap-2 mt-4">
                    {(['month', 'quarter', 'year', 'all'] as TimeFrame[]).map(tf => (
                         <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${timeFrame === tf ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            {tf === 'all' ? t('common.all') : tf === 'year' ? t('profile.year') : tf === 'quarter' ? t('profile.trimester') : t('profile.month')}
                        </button>
                    ))}
                </div>
             </div>
        )
    }
    
    if (chartData.length === 0) return null;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl shadow-[0_2px_10px_-3px_rgba(245,158,11,0.3)] border border-amber-100 flex items-center justify-center">
                            <Crown className="w-5 h-5 text-amber-500" />
                        </div>
                        {t('members.topPerformers', 'Top Performers')}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1 ml-14">
                        {t('members.performersBy', 'Performers by Points')}
                    </p>
                </div>
                
                <div className="flex bg-gray-100/80 p-1 rounded-lg self-start">
                    {(['month', 'quarter', 'year', 'all'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                timeFrame === tf
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tf === 'all' ? t('common.all') : tf === 'year' ? t('profile.year') : tf === 'quarter' ? t('profile.trimester') : t('profile.month')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bar Chart Container */}
            <div className="h-[200px] w-full flex items-end justify-center sm:justify-around gap-2 sm:gap-6 px-4 pb-2">
                {chartData.map((member) => {
                    const heightPercent = Math.max((member.total / maxScore) * 100, 4); // Min 4% height
                    const isHovered = hoveredMember === member.id;

                    return (
                        <div 
                            key={member.id}
                            className="flex flex-col items-center group relative w-12 sm:w-16 transition-all duration-300"
                            onMouseEnter={() => setHoveredMember(member.id)}
                            onMouseLeave={() => setHoveredMember(null)}
                        >
                            {/* Score Bubble (Floating) */}
                            <div 
                                className={`mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm transition-all duration-300 transform
                                    ${isHovered ? 'bg-gray-800 text-white -translate-y-1 scale-110' : 'bg-gray-100 text-gray-600'}
                                `}
                            >
                                +{member.total}
                            </div>

                            {/* The Bar */}
                            <div 
                                className={`w-full sm:w-12 rounded-t-xl bg-gradient-to-b ${member.color} transition-all duration-500 relative ${isHovered ? 'opacity-100' : 'opacity-90'}`}
                                style={{ 
                                    height: `${heightPercent}%`,
                                    // Make it look like a bar chart
                                    minHeight: '20px'
                                }}
                            >
                                {/* Glass Reflection Effect */}
                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-linear-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
                            </div>

                            {/* Avatar & Info */}
                            <div className="mt-3 flex flex-col items-center">
                                <div className={`relative p-0.5 rounded-full bg-gradient-to-tr ${member.color} mb-1.5 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                                    <div className="bg-white p-0.5 rounded-full">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 overflow-hidden">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Rank Badge */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                        #{member.rank}
                                    </div>
                                </div>
                                
                                <span className={`text-[10px] font-medium text-center truncate max-w-full transition-colors ${isHovered ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {member.name.split(' ')[0]} {/* First name only for cleaner look */}
                                </span>
                              
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
