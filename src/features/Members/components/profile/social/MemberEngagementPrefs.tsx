import { useState, useEffect } from "react";
import { Users, Zap } from "lucide-react";
import type { Member } from "../../../types";
import { useTranslation } from "react-i18next";
import { ProfileCard } from "../shared";

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
        <ProfileCard
            title={t('profile.engagement')}
            icon={Users}
            iconColorClass="text-amber-600"
            iconBgClass="bg-amber-50"
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            readOnly={readOnly}
            activeBorderClass="border-amber-400 ring-4 ring-amber-50"
        >
            <div className="space-y-6">
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
        </ProfileCard>
    );
}
