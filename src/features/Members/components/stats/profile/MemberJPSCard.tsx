import { useEffect, useState } from "react";
import { jpsService } from "../../../services/jpsService";
import type { JPSDetails, JPSPeriodScores } from "../../../services/jpsService";
import { Loader, Trophy, Target, AlertCircle, TrendingUp, Info, ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../../lib/utils";
import supabase from "../../../../../utils/supabase";

interface MemberJPSCardProps {
    memberId: string;
}

type Period = 'month' | 'trimester' | 'year';

const EMPTY_DETAILS: JPSDetails = {
    activityPoints: 0, meetingsPoints: 0, formationsPoints: 0, gaPoints: 0, eventsPoints: 0,
    taskPoints: 0, earnedPoints: 0, participationRate: 0, actualParticipationRate: 0,
    complaintsPenalty: 0, feeMultiplier: 1, committeeCount: 0, committeeIsChef: false, committeeFactor: 0,
};

const PERIOD_HEADER_KEY: Record<Period, string> = {
    month: 'profile.jps.monthPerformance',
    trimester: 'profile.jps.trimesterPerformance',
    year: 'profile.jps.yearPerformance',
};

export default function MemberJPSCard({ memberId }: MemberJPSCardProps) {
    const { t } = useTranslation();
    const [scores, setScores] = useState<JPSPeriodScores | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('trimester');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const data = await jpsService.getMemberPeriodScores(memberId);
                if (!cancelled) setScores(data);
            } catch (error) {
                console.error("Error loading JPS scores:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();

        // The DB triggers recalculate all three tables the instant a factor changes
        // (a rating, a completed task, cotisation status...) — reload live numbers when they fire.
        const channel = supabase
            .channel(`jps-scores-${memberId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jps_month_snapshots', filter: `member_id=eq.${memberId}` }, () => load())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jps_snapshots', filter: `member_id=eq.${memberId}` }, () => load())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jps_year_snapshots', filter: `member_id=eq.${memberId}` }, () => load())
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [memberId]);

    if (loading) return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center lg:col-span-2 min-h-[200px]">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 text-sm font-medium">{t('profile.jps.calculating')}</p>
        </div>
    );

    if (!scores) return null;

    const periodData = scores[period];
    const { score, category } = periodData;
    const details = periodData.details ?? EMPTY_DETAILS;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col lg:col-span-2">
            {/* Header */}
            <div className="p-6 bg-linear-to-br from-(--color-myPrimary) to-indigo-700 text-white relative">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t(PERIOD_HEADER_KEY[period])}</span>
                            <h2 className="text-xl font-bold">{t('profile.jps.memberScore')}</h2>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-5xl font-black">{score}</span>
                        <span className="text-sm font-bold opacity-80 uppercase tracking-widest">{t('profile.jps.score')}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">{category}</span>
                        </div>

                        {/* Period switcher */}
                        <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/10">
                            {(['month', 'trimester', 'year'] as Period[]).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors',
                                        period === p ? 'bg-white text-(--color-myPrimary)' : 'text-white/80 hover:text-white'
                                    )}
                                >
                                    {t(`common.${p}`, p)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Abstract Background Design */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full translate-y-12 -translate-x-12 blur-xl" />
            </div>

            {/* Breakdown */}
            <div className="p-6 flex-1 space-y-6">
                {!periodData.details && (
                    <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        {t('profile.jps.noSnapshotYet')}
                    </p>
                )}

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                            <Target className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">{t('profile.jps.activities')}</span>
                        </div>
                        <p className="text-base font-bold text-gray-900">{details.activityPoints}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                            <ListTodo className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">{t('profile.jps.tasks')}</span>
                        </div>
                        <p className="text-base font-bold text-gray-900">{details.taskPoints}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                            <Trophy className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">{t('profile.jps.other')}</span>
                        </div>
                        <p className="text-base font-bold text-gray-900">{details.earnedPoints}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{t('profile.jps.participationRate')}</p>
                                <p className="text-[10px] text-gray-500 font-medium">{t('profile.jps.attendanceImpact')}</p>
                            </div>
                        </div>
                        <span className="text-sm font-black text-emerald-600">
                            {((details.actualParticipationRate ?? details.participationRate) * 100).toFixed(0)}%
                        </span>
                    </div>

                    {details.complaintsPenalty > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{t('profile.jps.complaintsPenalty')}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{t('profile.jps.behaviorImpact')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-red-600">-{details.complaintsPenalty}</span>
                        </div>
                    )}
                </div>

                {/* Mathematical Breakdown */}
                <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1 px-2 rounded-md bg-(--color-myAccent) text-[10px] font-black text-white uppercase tracking-widest">
                                {t('profile.jps.calculationFormula')}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-blue-900/80">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-blue-100 shadow-sm font-bold">
                                (({details.meetingsPoints.toFixed(1)}M + {details.formationsPoints.toFixed(1)}F + {details.gaPoints.toFixed(1)}G + {details.eventsPoints.toFixed(1)}E) + {details.taskPoints.toFixed(1)}T + {details.earnedPoints}P + {details.committeeFactor.toFixed(1)}C)
                            </span>
                            <span>×</span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-blue-100 shadow-sm font-bold">
                                {details.participationRate.toFixed(2)}Rate
                            </span>
                            <span>×</span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-blue-100 shadow-sm font-bold">
                                {details.feeMultiplier.toFixed(1)}Fee
                            </span>
                            <span>-</span>
                            <span className="bg-white px-1.5 py-0.5 rounded border border-blue-100 shadow-sm font-bold">
                                {details.complaintsPenalty}Pen
                            </span>
                            <span className="font-bold text-blue-600">=</span>
                            <span className="bg-(--color-myAccent) text-white px-2 py-0.5 rounded-md font-black shadow-sm">
                                {score}
                            </span>
                        </div>
                    </div>

                    {/* Formula Legend */}
                    <div className="px-1 space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">
                            {t('profile.jps.formula.title')}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            {[
                                { color: 'bg-blue-400', label: 'M: Meetings attended (activity_points)' },
                                { color: 'bg-indigo-400', label: 'F: Formations attended (activity_points)' },
                                { color: 'bg-emerald-400', label: 'G: Assemblies attended (activity_points)' },
                                { color: 'bg-purple-400', label: 'E: Events attended (activity_points)' },
                                { color: 'bg-orange-400', label: 'T: Tasks' },
                                { color: 'bg-amber-400', label: 'P: Points Earned' },
                                { color: 'bg-teal-400', label: 'C: Committees (Count × 1.5 if Chef)' },
                                { color: 'bg-gray-400', label: 'Rate: Participation' },
                                { color: 'bg-gray-400', label: 'Fee: Membership' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                                    <span className="text-[9px] font-medium text-gray-500 leading-none">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] text-gray-400 italic mt-2 bg-gray-50/80 p-2 rounded-lg leading-relaxed">
                            <Info className="w-2.5 h-2.5 inline-block mr-1 -mt-0.5" />
                            Each attended activity contributes its own configured points value (set when the activity was created) — not a generic rating-based multiplier.
                        </p>
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        <span>{t('profile.jps.categoryProgress')}</span>
                        <span>{category}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-(--color-myAccent) rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (score / 800) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
