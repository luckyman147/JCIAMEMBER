import { useState, useEffect } from "react";
import { Users, Zap, Pencil, Check, X } from "lucide-react";
import type { Member } from "../../types";
import { useTranslation } from "react-i18next";

interface Props {
    member: Member;
    onUpdate?: (updates: Partial<Member>) => void;
    readOnly?: boolean;
}

export default function MemberEngagementPrefs({ member, onUpdate, readOnly = true }: Props) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [committee, setCommittee] = useState(member.preferred_committee || '');
    const [activityType, setActivityType] = useState(member.preferred_activity_type || '');

    useEffect(() => {
        setCommittee(member.preferred_committee || '');
        setActivityType(member.preferred_activity_type || '');
    }, [member]);

    const handleSave = () => {
        onUpdate?.({ preferred_committee: committee, preferred_activity_type: activityType });
        setIsEditing(false);
    };

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('profile.engagementTitle')}</h3>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.preferredCommittee')}</span>
                    </div>
                    {isEditing ? (
                        <select
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                            value={committee}
                            onChange={(e) => setCommittee(e.target.value)}
                        >
                            <option value="">{t('common.select')}</option>
                            {['media', 'sponsoring', 'programme', 'logistique', 'hr'].map(c => (
                                <option key={c} value={c}>{t(`profile.committees.${c}`)}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm font-bold text-gray-900 border-l-2 border-blue-100 pl-3 py-1">
                            {member.preferred_committee ? t(`profile.committees.${member.preferred_committee}`) : <span className="text-gray-300 italic">{t('profile.notSpecified')}</span>}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.preferredActivityType')}</span>
                    </div>
                    {isEditing ? (
                        <select
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-amber-500"
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                        >
                            <option value="">{t('common.select')}</option>
                            {['team_building', 'event', 'meeting', 'training'].map(t_pref => (
                                <option key={t_pref} value={t_pref}>{t(`profile.activityTypes.${t_pref}`)}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm font-bold text-gray-900 border-l-2 border-amber-100 pl-3 py-1">
                            {member.preferred_activity_type ? t(`profile.activityTypes.${member.preferred_activity_type}`) : <span className="text-gray-300 italic">{t('profile.notSpecified')}</span>}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
