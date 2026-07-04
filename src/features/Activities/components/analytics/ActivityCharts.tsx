
import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { CalendarDays, Users, GraduationCap, Landmark, Crown } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import type { Activity } from '../../models/Activity';


interface ActivityChartsProps {
    activities: Activity[];
}

const COLORS = {
    event: 'var(--color-myPrimary)',    // Blue
    meeting: 'var(--color-mySecondary)',  // Green
    formation: 'var(--color-myAccent)', // Orange
    general_assembly: '#8b5cf6' // Purple
};

// A darker step of the same hues, used only where color fills a data mark
// (bars, icons) rather than a small badge — validated for legibility against
// a white surface (the brand's mySecondary gold is too pale as a filled mark).
const MARK_COLORS: Record<string, string> = {
    event: '#0097D7',
    meeting: '#C99A1F',
    formation: '#56BDA3',
    general_assembly: '#8b5cf6',
};

const TYPE_ICON = {
    event: CalendarDays,
    meeting: Users,
    formation: GraduationCap,
    general_assembly: Landmark,
} as const;

const hexToRgba = (hex: string, alpha: number) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ActivityCharts({ activities }: ActivityChartsProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    // 1. Stats by Type
    const typeData = useMemo(() => {
        const counts: Record<string, number> = { event: 0, meeting: 0, formation: 0, general_assembly: 0 };
        activities.forEach(a => {
            if (counts[a.type] !== undefined) counts[a.type]++;
        });
        return [
            { name: t('activities.events'), value: counts.event, type: 'event' },
            { name: t('activities.meetings'), value: counts.meeting, type: 'meeting' },
            { name: t('activities.formations'), value: counts.formation, type: 'formation' },
            { name: t('activities.generalAssembly'), value: counts.general_assembly, type: 'general_assembly' }
        ].filter(d => d.value > 0);
    }, [activities, t]);

    // 2. Activities per Month (Current Year or Rolling 12 Months)
    const timelineData = useMemo(() => {
        const months: Record<string, number> = {};
        const now = new Date();
        const year = now.getFullYear();

        // Initialize all months for current year
        for (let i = 0; i < 12; i++) {
            const monthName = new Date(year, i, 1).toLocaleString(i18n.language, { month: 'short' });
            months[monthName] = 0;
        }

        activities.forEach(a => {
            const d = new Date(a.activity_begin_date);
            if (d.getFullYear() === year) {
                const monthName = d.toLocaleString(i18n.language, { month: 'short' });
                if (months[monthName] !== undefined) months[monthName]++;
            }
        });

        return Object.keys(months).map(m => ({ name: m, count: months[m] }));
    }, [activities, i18n.language]);

    // 3. Simple Stats
    const stats = useMemo(() => {
        const total = activities.length;
        const online = activities.filter(a => a.is_online).length;
        const upcoming = activities.filter(a => new Date(a.activity_begin_date) > new Date()).length;
        return { total, online, upcoming, offline: total - online };
    }, [activities]);

    // 4. Average Attendance by Type
    const attendanceData = useMemo(() => {
        const typeStats: Record<string, { count: number; participants: number }> = {
            event: { count: 0, participants: 0 },
            meeting: { count: 0, participants: 0 },
            formation: { count: 0, participants: 0 },
            general_assembly: { count: 0, participants: 0 }
        };

        activities.forEach(a => {
            const pCount = a.activity_participants?.[0]?.count || 0;
            if (typeStats[a.type]) {
                typeStats[a.type].count++;
                typeStats[a.type].participants += pCount;
            }
        });

        return [
            { name: t('activities.events'), avg: typeStats.event.count ? Math.round(typeStats.event.participants / typeStats.event.count) : 0, count: typeStats.event.count, type: 'event' },
            { name: t('activities.meetings'), avg: typeStats.meeting.count ? Math.round(typeStats.meeting.participants / typeStats.meeting.count) : 0, count: typeStats.meeting.count, type: 'meeting' },
            { name: t('activities.formations'), avg: typeStats.formation.count ? Math.round(typeStats.formation.participants / typeStats.formation.count) : 0, count: typeStats.formation.count, type: 'formation' },
            { name: t('activities.generalAssembly'), avg: typeStats.general_assembly.count ? Math.round(typeStats.general_assembly.participants / typeStats.general_assembly.count) : 0, count: typeStats.general_assembly.count, type: 'general_assembly' }
        ]
            .filter(d => d.count > 0)
            .sort((a, b) => b.avg - a.avg);
    }, [activities, t]);

    const maxAvgAttendance = Math.max(1, ...attendanceData.map(d => d.avg));
    const topAttended = attendanceData[0];

    if (activities.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* KPI Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-start">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">{t('activities.totalActivities')}</p>
                    <p className="text-2xl font-bold text-(--color-mySecondary)">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">{t('activities.upcoming')}</p>
                    <p className="text-2xl font-bold text-(--color-myPrimary)">{stats.upcoming}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">{t('activities.online')}</p>
                    <p className="text-2xl font-bold text-green-600">{stats.online}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">{t('activities.inPerson')}</p>
                    <p className="text-2xl font-bold text-red-500">{stats.offline}</p>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 col-span-2">
                    <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">{t('activities.avgAttendance')}</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {Math.round(activities.reduce((acc, a) => acc + (a.activity_participants?.[0]?.count || 0), 0) / (activities.length || 1))}
                    </p>
                </div>
            </div>

            {/* Type Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-start">{t('activities.distributionByType')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.type]} />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-start">
                    {t('activities.activityTrends')} ({new Date().getFullYear()})
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timelineData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} orientation={isRTL ? "top" : "bottom"} reversed={isRTL} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} orientation={isRTL ? "right" : "left"} />
                        <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="count" fill="var(--color-myPrimary)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

             {/* Most Attended — ranked by average turnout, not a generic bar chart */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-900 text-start">{t('activities.mostAttended')}</h3>
                <p className="text-xs text-gray-400 mb-1 text-start">{t('activities.mostAttendedSubtitle')}</p>

                {attendanceData.length === 0 ? (
                    <div className="flex items-center justify-center h-[220px]">
                        <p className="text-sm text-gray-400 italic">{t('activities.noAttendanceData')}</p>
                    </div>
                ) : (
                    <>
                        {topAttended && (
                            <p className="text-xs text-gray-500 mb-4 text-start leading-relaxed">
                                <Trans
                                    i18nKey="activities.mostAttendedCallout"
                                    values={{ type: topAttended.name, avg: topAttended.avg }}
                                    components={{ b: <span className="font-semibold text-gray-900" /> }}
                                />
                            </p>
                        )}

                        <div className="space-y-1">
                            {attendanceData.map((row, index) => {
                                const Icon = TYPE_ICON[row.type as keyof typeof TYPE_ICON];
                                const color = MARK_COLORS[row.type] ?? '#9ca3af';
                                const widthPct = Math.max(6, Math.round((row.avg / maxAvgAttendance) * 100));
                                const isWinner = index === 0;

                                return (
                                    <div
                                        key={row.type}
                                        tabIndex={0}
                                        className="group relative flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-myPrimary)"
                                    >
                                        <div
                                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                                            style={{ backgroundColor: hexToRgba(color, 0.12), color }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-xs font-semibold text-gray-700 truncate inline-flex items-center gap-1">
                                                    {row.name}
                                                    {isWinner && <Crown className="w-3 h-3 text-amber-500 shrink-0" aria-label={t('activities.mostAttended')} />}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{row.avg}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                                                    style={{ width: `${widthPct}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>

                                        {/* Hover/focus tooltip — same info reachable without it (avg is already a direct label) */}
                                        <div
                                            role="tooltip"
                                            className="pointer-events-none absolute -top-8 start-10 z-10 rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                                        >
                                            {t('activities.basedOnActivities', { count: row.count })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            </div>
     
    );
}

