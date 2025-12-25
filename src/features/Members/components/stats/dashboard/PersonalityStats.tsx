import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';
import { Brain } from 'lucide-react';

interface Props {
    members: Member[];
}

const PERSONALITY_COLORS: Record<string, string> = {
    'Dominant': '#ef4444',     // Red
    'Influence': '#facc15',    // Yellow
    'Steadiness': '#22c55e',    // Green
    'Conscientious': '#3b82f6', // Blue
    'Unknown': '#94a3b8'        // Slate
};

export function PersonalityStats({ members }: Props) {
    const { t } = useTranslation();

    const data = useMemo(() => {
        const counts: Record<string, number> = {
            'Dominant': 0,
            'Influence': 0,
            'Steadiness': 0,
            'Conscientious': 0
        };

        members.forEach(m => {
            if (m.personality_type && counts[m.personality_type] !== undefined) {
                counts[m.personality_type]++;
            }
        });

        return Object.entries(counts)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ 
                name, 
                value,
                fill: PERSONALITY_COLORS[name]
            }));
    }, [members]);

    const filledCount = members.filter(m => m.personality_type).length;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Brain className=" text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('members.personalityDistribution')}</h3>
                        <p className="text-[10px] text-gray-500 font-medium">{t('members.personalitySubtitle')}</p>
                    </div>
                </div>
                <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {filledCount} / {members.length} {t('members.assessed')}
                </div>
            </div>

            <div className="flex-1 w-full text-xs">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-4 gap-2">
                {Object.entries(PERSONALITY_COLORS).filter(([k]) => k !== 'Unknown').map(([type, color]) => (
                    <div key={type} className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-1`} style={{ backgroundColor: color }} />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{type[0]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
