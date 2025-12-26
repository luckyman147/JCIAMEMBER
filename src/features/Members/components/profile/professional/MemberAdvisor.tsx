import { useState, useEffect } from 'react';
import { UserCircle, Users, ChevronRight, UserPlus, X } from 'lucide-react';
import type { Member } from "../../../types";
import { useTranslation } from "react-i18next";
import { getMembers } from "../../../services/members.service";

interface MemberAdvisorProps {
    member: Member;
    onUpdate: (updates: Partial<Member>) => void;
    canEdit?: boolean;
}

export default function MemberAdvisor({ member, onUpdate, canEdit }: MemberAdvisorProps) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing && allMembers.length === 0) {
            setLoading(true);
            getMembers().then(members => {
                // Filter out the member themselves
                setAllMembers(members.filter(m => m.id !== member.id));
                setLoading(false);
            });
        }
    }, [isEditing, allMembers.length, member.id]);

    const handleSelectAdvisor = async (advisorId: string) => {
        setLoading(true);
        try {
            await onUpdate({ advisor_id: advisorId || null as any });
            setIsEditing(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center justify-between"> 
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <UserCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('profile.advisor')}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{t('profile.membershipStatus')}</p>
                    </div>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-indigo-600"
                    >
                        {isEditing ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative">
                        <select 
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                            value={member.advisor_id || ""}
                            onChange={(e) => handleSelectAdvisor(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">{t('profile.selectAdvisor')}</option>
                            {allMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.fullname}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                    </div>
                    {loading && <p className="text-[10px] text-gray-400 animate-pulse font-bold uppercase text-center">{t('common.loading')}</p>}
                </div>
            ) : (
                <div className="flex flex-row flex-wrap items-center gap-8">
                    {/* Advisor Section */}
                    <div className="flex-1 min-w-[180px]">
                        {member.advisor ? (
                            <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50 transition-all hover:border-indigo-100">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                    {member.advisor.avatar_url ? (
                                        <img src={member.advisor.avatar_url} alt={member.advisor.fullname} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            {member.advisor.fullname?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate">{member.advisor.fullname}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{member.advisor.role || 'Member'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium italic px-2">{t('profile.noAdvisor')}</p>
                        )}
                    </div>

                    {/* Advisees Section */}
                    <div className="flex flex-col gap-2 flex-grow min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profile.advisees')}</h4>
                        </div>
                        
                        {member.advisees && member.advisees.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {member.advisees.map(advisee => (
                                    <div 
                                        key={advisee.id} 
                                        className="group relative"
                                        title={advisee.fullname}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform cursor-pointer">
                                            {advisee.avatar_url ? (
                                                <img src={advisee.avatar_url} alt={advisee.fullname} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-black">
                                                    {advisee.fullname?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] text-gray-400 font-medium italic px-2">{t('profile.noAdvisees')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
