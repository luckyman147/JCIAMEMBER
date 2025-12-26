import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
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

type TimeFrame = 'all' | 'year' | 'quarter' | 'month';

interface TopProgressorsProps {
    history: PointsHistoryRaw[];
}

export default function TopProgressors({ history }: TopProgressorsProps) {
    const { t } = useTranslation();
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');

    const topProgressors = useMemo(() => {
        if (!history || history.length === 0) return [];

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const memberMap = new Map<string, { 
            name: string; 
            avatar: string | null;
            role: string;
            poste?: string;
            totalGained: number;
        }>();

        history.forEach(record => {
            const date = new Date(record.created_at);
            
            if (timeFrame === 'year' && date < startOfYear) return;
            if (timeFrame === 'quarter' && date < startOfQuarter) return;
            if (timeFrame === 'month' && date < startOfMonth) return;

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
                    role: roleName,
                    poste: posteObject?.name,
                    totalGained: 0 
                });
            }

            const m = memberMap.get(record.member_id)!;
            m.totalGained += record.points;
        });

        return Array.from(memberMap.values())
            .sort((a, b) => b.totalGained - a.totalGained)
            .slice(0, 5); // Show top 5 for cleaner look
    }, [history]);

    if (topProgressors.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{t('members.topGrowth', 'Top Growth')}</h3>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{t('members.performanceGains', 'Point gains')}</p>
                    </div>
                </div>
                
                <div className="flex bg-gray-100/80 p-1 rounded-lg self-start ">
                    {(['month', 'quarter', 'year', 'all'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-tighter ${
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

            <div className="space-y-4">
                {topProgressors.map((member, index) => (
                    <div key={member.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xs">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -top-1 -left-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                    {index + 1}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter truncate">{member.role}</span>
                                    {member.poste && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter italic truncate">{member.poste}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-sm font-black text-emerald-600">+{member.totalGained}</span>
                            <div className="w-16 h-1 bg-gray-50 rounded-full mt-1 overflow-hidden border border-gray-100">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((member.totalGained / topProgressors[0].totalGained) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
