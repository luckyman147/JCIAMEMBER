import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Star, CheckCircle2, XCircle } from 'lucide-react';
import type { Member } from '../types';
import { getRankColor, getValidationStatusColor } from '../utils';

interface MembersListProps {
    members: Member[];
    loading: boolean;
}

export default function MembersList({ members, loading }: MembersListProps) {
    const navigate = useNavigate();
    const table_classe = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";

    const groupedMembers = React.useMemo(() => {
        const groups: Record<string, Member[]> = {};
        
        // First sort by points globally (or per group later)
        const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0));

        sorted.forEach(member => {
            const role = member.role || 'Member';
            if (!groups[role]) {
                groups[role] = [];
            }
            groups[role].push(member);
        });

        // Return as array of [role, members] sorted by some criteria? 
        return Object.entries(groups)
            .filter(([role]) => !['admin'].includes(role.toLowerCase()))
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [members]);

    if (loading) {
        return (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading members...</p>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No members found matching your criteria.</p>
            </div>
        );
    }

    const renderCotisationIndicator = (semester1: boolean, semester2: boolean) => (
        <div className="flex gap-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${semester1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {semester1 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                S1
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${semester2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {semester2 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                S2
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {groupedMembers.map(([role, roleMembers]) => (
                <div key={role} className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 pl-1 border-l-4 border-blue-500">
                        {role.replace(/-/g, ' ').toUpperCase()} 
                        <span className="text-sm font-normal text-gray-500">({roleMembers.length})</span>
                    </h3>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={table_classe}>Position</th>
                                    <th className={table_classe}>Member</th>
                                    <th className={table_classe}>Status</th>
                                    <th className={table_classe}>Role</th>
                                    <th className={table_classe}>Points</th>
                                    <th className={table_classe}>Cotisation</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {roleMembers.map((member, index) => {
                                    const rank = index + 1;
                                    const [s1, s2] = member.cotisation_status || [false, false];
                                    return (
                                        <tr 
                                            key={member.id} 
                                            onClick={() => navigate(`/members/${member.id}`)}
                                            className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                                #{rank}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-14 w-14 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                        {member.avatar_url ? (
                                                            <img className="h-full w-full object-cover" src={member.avatar_url} alt="" />
                                                        ) : (
                                                            <span className="text-gray-500 font-bold text-lg">{member.fullname.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {member.fullname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getValidationStatusColor(member.is_validated)}`}>
                                                    {member.is_validated ? 'Validated' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`px-2 py-0.5 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full border ${getRankColor(member.role)}`}>
                                                    <Shield className="w-3 h-3" />
                                                    {member.role}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    {member.points}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderCotisationIndicator(s1, s2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-4">
                        {roleMembers.map((member, index) => {
                            const rank = index + 1;
                            const [s1, s2] = member.cotisation_status || [false, false];
                            return (
                                <div 
                                    key={member.id} 
                                    onClick={() => navigate(`/members/${member.id}`)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 active:bg-gray-50 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                    {member.avatar_url ? (
                                                        <img className="h-full w-full object-cover" src={member.avatar_url} alt="" />
                                                    ) : (
                                                        <span className="text-gray-500 font-bold text-xl">{member.fullname.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-white font-bold">
                                                    #{rank}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{member.fullname}</h3>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-50 mb-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Role & Status</span>
                                            <div className="flex flex-wrap gap-2">
                                                <div className={`px-2 py-0.5 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full border ${getRankColor(member.role)}`}>
                                                    {member.role}
                                                </div>
                                                <span className={`px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full ${getValidationStatusColor(member.is_validated)}`}>
                                                    {member.is_validated ? 'Validated' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end text-right">
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Points</span>
                                            <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                {member.points}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cotisation Fee</span>
                                        {renderCotisationIndicator(s1, s2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
