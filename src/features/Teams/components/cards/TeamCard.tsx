
import { useNavigate } from "react-router-dom";
import type { Team } from "../../types";
import { Users, Lock, Globe, ArrowRight, Trash2 } from "lucide-react";
import { useAuth } from "../../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../../utils/roles";
import { useDeleteTeam } from "../../hooks/useTeams";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface TeamCardProps {
    team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { role } = useAuth();
    const deleteMutation = useDeleteTeam();
    const isGlobalAdmin = role?.toLowerCase() === 'admin';
    const hasExecutiveRole = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');
    const canDelete = isGlobalAdmin || hasExecutiveRole;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't navigate
        if (!confirm(t('teams.deleteConfirm', { name: team.name }))) return;
        try {
            await deleteMutation.mutateAsync(team.id);
            toast.success(t('teams.deleted'));
        } catch (error) {
            toast.error(t('teams.deleteFailed'));
        }
    };

    return (
        <div 
            onClick={() => navigate(`/teams/${team.id}`)}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer p-6 flex flex-col h-full relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${team.is_public ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {team.is_public ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                
                {canDelete && (
                    <button 
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title={t('teams.deleteTeam')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 group-hover:text-(--color-myPrimary) transition-colors mb-2">
                {team.name}
            </h3>
            
            <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow text-start">
                {team.description || t('activities.noDescription')}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-400 mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{t('teams.membersCount', { count: team.member_count })}</span>
                </div>
                <div className={`flex items-center gap-1 transition-transform ${i18n.dir() === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                    <span className="font-medium text-(--color-myPrimary)">{t('common.view')}</span>
                    <ArrowRight className={`w-4 h-4 text-(--color-myPrimary) ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                </div>
            </div>
        </div>
    );
}
