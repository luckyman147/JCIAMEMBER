import { Award, Star } from 'lucide-react';
import type { Member } from '../../types';
import { getRankColor } from '../../utils';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

interface TopPerformersByRoleProps {
    members: Member[];
}

export default function TopPerformersByRole({ members }: TopPerformersByRoleProps) {
    const topPerformers = useMemo(() => {
        const grouped: Record<string, Member> = {};
        
        members.forEach(member => {
            const role = member.role || 'Member'; // fallback
            // If no member for this role yet, or this member has more points
            if (!grouped[role] || (member.points || 0) > (grouped[role].points || 0)) {
                grouped[role] = member;
            }
        });

        // Convert to array and sort by points descending
        return Object.entries(grouped)
            .filter(([role]) => role.toLowerCase() !== 'president')
            .map(([role, member]) => ({ role, member }))
            .sort((a, b) => (b.member.points || 0) - (a.member.points || 0));
    }, [members]);

    if (topPerformers.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Top Performers by Role
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topPerformers.map(({ role, member }) => (
                     <Link to={`/members/${member.id}`} key={role} className="block group">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Award className="w-16 h-16 text-amber-500" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.fullname} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                        {member.fullname.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 truncate pr-4">{member.fullname}</h3>
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRankColor(role)}`}>
                                    {role}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Top Score</span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star className="w-4 h-4 fill-current" />
                                {member.points}
                            </div>
                        </div>
                    </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
