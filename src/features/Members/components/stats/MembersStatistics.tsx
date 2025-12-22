import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Member } from '../../types';

interface MembersStatisticsProps {
    members: Member[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MembersStatistics({ members }: MembersStatisticsProps) {
    
    // 1. Roles Distribution
    const roleData = useMemo(() => {
        const counts: Record<string, number> = {};
        members.forEach(m => {
            const role = m.role || 'Unknown';
            counts[role] = (counts[role] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    // 2. Validation Status
    const statusData = useMemo(() => {
        const validated = members.filter(m => m.is_validated).length;
        const pending = members.length - validated;
        return [
            { name: 'Validated', value: validated, color: '#10b981' }, // green-500
            { name: 'Pending', value: pending, color: '#f59e0b' } // amber-500
        ];
    }, [members]);

    // 3. Activity Level (Points Range) - Simple Histogram
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

    // 4. Age Distribution
    const ageData = useMemo(() => {
        const ranges = [
            { name: '<20', min: 0, max: 19, count: 0 },
            { name: '20-25', min: 20, max: 25, count: 0 },
            { name: '26-30', min: 26, max: 30, count: 0 },
            { name: '31-35', min: 31, max: 35, count: 0 },
            { name: '36-40', min: 36, max: 40, count: 0 },
            { name: '40+', min: 41, max: Infinity, count: 0 },
        ];

        members.forEach(m => {
            if (!m.birth_date) return;
            const birthDate = new Date(m.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m_diff = today.getMonth() - birthDate.getMonth();
            if (m_diff < 0 || (m_diff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            const range = ranges.find(r => age >= r.min && age <= r.max);
            if (range) range.count++;
        });

        return ranges.filter(r => r.count > 0).map(r => ({ name: r.name, value: r.count }));
    }, [members]);

    // 5. Availability Distribution
    const availabilityData = useMemo(() => {
        const counts: Record<string, number> = {
            'Matinal': 0,
            'Afternoon': 0,
            'Full Day': 0
        };
        members.forEach(m => {
            const time = m.availability_time;
            if (time === 'matinal') counts['Matinal']++;
            else if (time === 'afternoon') counts['Afternoon']++;
            else if (time === 'full_day') counts['Full Day']++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    // 6. Occupations Distribution
    const occupationData = useMemo(() => {
        const counts: Record<string, number> = {};
        members.forEach(m => {
            const job = m.job_title || 'Other';
            counts[job] = (counts[job] || 0) + 1;
        });
        // Sort and take top 5, group rest into 'Other'
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name, value }));
        const otherCount = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
        
        if (otherCount > 0) {
            top5.push({ name: 'Other Occupations', value: otherCount });
        }
        return top5;
    }, [members]);

    if (members.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
            {/* Role Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Member Roles</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={roleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {roleData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Validation Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Membership Status</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Points Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Points Distribution</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pointsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize: 10}} />
                            <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30}>
                                {pointsData.map((_, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Age Distribution</h3>
                <div className="h-[200px] w-full text-xs">
                    {ageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 10}} />
                                <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30}>
                                    {ageData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                            No age data available
                        </div>
                    )}
                </div>
            </div>

            {/* Occupation Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Professional Breakdown</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={occupationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {occupationData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Availability Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Availability Overview</h3>
                <div className="h-[200px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={availabilityData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" tick={{fontSize: 10}} hide />
                            <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={70} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                {availabilityData.map((_, index) => (
                                     <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
