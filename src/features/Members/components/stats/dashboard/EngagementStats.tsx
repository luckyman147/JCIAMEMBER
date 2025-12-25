import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Trophy, Target } from 'lucide-react';
import type { Member } from '../../../types';
import type { MemberTask } from '../../../../Tasks/types';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Props {
    members: Member[];
    tasks: MemberTask[];
}

export function EngagementStats({ members, tasks }: Props) {
    const { t } = useTranslation();

    const pointsData = useMemo(() => {
        const ranges = [
            { name: '0', min: 0, max: 0, count: 0 },
            { name: '1-50', min: 1, max: 50, count: 0 },
            { name: '51-100', min: 51, max: 100, count: 0 },
            { name: '100+', min: 101, max: Infinity, count: 0 },
        ];
        members.forEach(m => {
            const p = m.points || 0;
            const range = ranges.find(r => p >= r.min && p <= r.max);
            if (range) range.count++;
        });
        return ranges.map(r => ({ name: r.name, value: r.count }));
    }, [members]);

    const taskStats = useMemo(() => {
        const memberCompletionCount: Record<string, number> = {};
        members.forEach(m => { memberCompletionCount[m.id] = 0; });
        let totalCompleted = 0;
        tasks.forEach(task => {
            if (task.status === 'completed' && memberCompletionCount[task.member_id] !== undefined) {
                memberCompletionCount[task.member_id]++;
                totalCompleted++;
            }
        });

        const distribution = [
            { name: '0', count: 0 }, { name: '1', count: 0 }, { name: '2', count: 0 },
            { name: '3', count: 0 }, { name: '4', count: 0 }, { name: '5+', count: 0 },
        ];
        Object.values(memberCompletionCount).forEach(count => {
            const idx = Math.min(count, 5);
            distribution[idx].count++;
        });

        return {
            distribution: distribution.map(d => ({ name: d.name, value: d.count })),
            mean: members.length > 0 ? (totalCompleted / members.length).toFixed(1) : '0',
            totalCompleted
        };
    }, [members, tasks]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Points Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('members.pointsDistribution', 'Points Distribution')}</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={pointsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                            <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                            <Bar name={t('common.members')} dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30}>
                                {pointsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Task Performance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-6">{t('members.taskPerformance', 'Task Performance')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100/50">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('members.totalDone', 'Total Done')}</span>
                            </div>
                            <p className="text-2xl font-black text-emerald-900">{taskStats.totalCompleted}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Trophy className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('members.meanPerMember', 'Mean / Mem.')}</span>
                            </div>
                            <p className="text-2xl font-black text-blue-900">{taskStats.mean}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('members.teamProductivity', 'Team Productivity')}</p>
                        <p className="text-xs text-gray-600 font-medium">{t('members.teamProductivityDesc', 'Average completion rate')}</p>
                    </div>
                </div>
            </div>

            {/* Task Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">{t('members.tasksPerMember', 'Tasks per Member')}</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={taskStats.distribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                            <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.4)'}} formatter={(value: number) => [`${value} ${t('common.members')}`, t('common.members')]} />
                            <Bar name={t('common.members')} dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30}>
                                {taskStats.distribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
