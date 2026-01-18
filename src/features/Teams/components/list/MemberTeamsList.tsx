import { useEffect, useState } from "react";
import { getMemberTeams } from "../../services/teams.service";
import type { Team } from "../../types";
import { Users, Shield, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AssignTeamModal from "../modals/AssignTeamModal";
import { useAuth } from "../../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../../utils/roles";
import { useTranslation } from "react-i18next";

export default function MemberTeamsList({ memberId }: { memberId: string }) {
    const { t } = useTranslation();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const navigate = useNavigate();
    const { role, user } = useAuth();
    const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');
    const isOwnProfile = user?.id === memberId;

    const isAdmin = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');

    useEffect(() => {
        loadTeams();
    }, [memberId]);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const data = await getMemberTeams(memberId);
            setTeams(data);
        } catch (error) {
            console.error("Failed to load member teams", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-(--color-myPrimary)" />
                    {t('profile.teamsAndSquads')}
                </h2>
                {isAdmin && (
                    <button 
                        onClick={() => setIsAssignModalOpen(true)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-colors"
                        title={t('profile.assignToTeam')}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg" />)}
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">{t('profile.notPartOfAnyTeam')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teams
                        .filter(t => t.is_public || isExecutive || isOwnProfile)
                        .map(team => (
                        <div 
                            key={team.id}
                            onClick={() => navigate(`/teams/${team.id}`)}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer group"
                        >
                            <div className="text-start">
                                <h3 className="font-medium text-gray-900 group-hover:text-(--color-myPrimary)">{team.name}</h3>
                                <h2 className="font-light text-gray-500">{team.description}</h2>
                                {team.my_role && team.my_role !== 'member' && (
                                    <span className="text-xs font-semibold text-blue-600 uppercase flex items-center gap-1 mt-0.5">
                                        <Shield className="w-3 h-3" /> {t(`profile.${team.my_role}`)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AssignTeamModal 
                open={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                memberId={memberId}
                existingTeamIds={teams.map(t => t.id)}
                onAssigned={loadTeams}
            />
        </div>
    );
}
