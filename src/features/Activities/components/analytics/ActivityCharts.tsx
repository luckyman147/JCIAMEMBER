
import { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useTranslation } from 'react-i18next';
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
            { name: t('activities.events'), avg: typeStats.event.count ? Math.round(typeStats.event.participants / typeStats.event.count) : 0, type: 'event' },
            { name: t('activities.meetings'), avg: typeStats.meeting.count ? Math.round(typeStats.meeting.participants / typeStats.meeting.count) : 0, type: 'meeting' },
            { name: t('activities.formations'), avg: typeStats.formation.count ? Math.round(typeStats.formation.participants / typeStats.formation.count) : 0, type: 'formation' },
            { name: t('activities.generalAssembly'), avg: typeStats.general_assembly.count ? Math.round(typeStats.general_assembly.participants / typeStats.general_assembly.count) : 0, type: 'general_assembly' }
        ];
    }, [activities, t]);

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

             {/* Average Attendance by Type */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-start">{t('activities.avgAttendanceByType')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={attendanceData} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80} 
                            axisLine={false} 
                            tickLine={false} 
                            className="text-xs" 
                            orientation={isRTL ? "right" : "left"}
                        />
                        <RechartsTooltip cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="avg" fill="#8884d8" radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]} barSize={20}>
                             {attendanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.type]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
     
    );
}

