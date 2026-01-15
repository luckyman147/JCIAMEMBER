import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Briefcase, ArrowLeft, Plus, Users, Globe, Lock, ArrowRight, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "../../../Global_Components/navBar";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { getProjectById } from "../services/project.service";
import type { Project } from "../types";
import { toast } from "sonner";
import CreateTeamModal from "../components/modals/CreateTeamModal";
import AddProjectMemberModal from "../components/modals/AddProjectMemberModal";

export default function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const { role } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    
    const hasEditAccess = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');

    useEffect(() => {
        if (id) {
            loadProject(id);
        }
    }, [id]);

    const loadProject = async (projectId: string) => {
        try {
            setLoading(true);
            const data = await getProjectById(projectId);
            setProject(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
                <main className="md:ms-64 pt-16 md:pt-6">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/projects" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 group">
                    <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-1 rotate-180' : 'mr-1'} transition-transform group-hover:${i18n.dir() === 'rtl' ? 'translate-x-1' : '-translate-x-1'}`} />
                    {t('teams.backToProjects', 'Back to Projects')}
                </Link>

                {/* Project Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-start">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {project.description || t('common.noDescription', 'No description')}
                            </p>
                            
                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span>{project.teams?.length || 0} {t('teams.teams', 'Teams')}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span>{t('teams.project', 'Project')}</span>
                                </div>
                            </div>
                        </div>
                        {hasEditAccess && (
                             <button 
                                onClick={() => setIsCreateTeamOpen(true)}
                                className="flex-shrink-0 inline-flex items-center gap-2 bg-(--color-myPrimary) text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-colors font-medium shadow-sm whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" /> {t('teams.addTeam', 'Add Team')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Teams Grid */}
                <div>
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">{t('teams.projectTeams', 'Teams in this Project')}</h2>
                     </div>

                     {project.teams && project.teams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {project.teams.map(team => (
                                <Link 
                                    key={team.id}
                                    to={`/teams/${team.id}`}
                                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all group block text-start"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            {team.is_public ? <Globe className="w-5 h-5 text-gray-500" /> : <Lock className="w-5 h-5 text-gray-500" />}
                                        </div>
                                        {team.member_count !== undefined && (
                                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                {team.member_count} {t('teams.members', 'Members')}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {team.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                        {team.description || t('common.noDescription', 'No description')}
                                    </p>

                                    <div className="flex items-center text-(--color-myPrimary) text-sm font-medium mt-auto group-hover:translate-x-1 transition-transform">
                                        {t('common.viewDetails', 'View Details')} 
                                        <ArrowRight className={`w-4 h-4 ml-1 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                             <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                             <p className="text-gray-500">{t('teams.noTeamsInProject', 'No teams added to this project yet.')}</p>
                             {hasEditAccess && (
                                <button 
                                    onClick={() => setIsCreateTeamOpen(true)}
                                    className="mt-4 text-blue-600 font-medium hover:underline"
                                >
                                    {t('teams.createFirstTeam', 'Create the first team')}
                                </button>
                             )}
                        </div>
                     )}
                </div>
            </div>
            
            {/* Members Section (New) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-gray-500" />
                            {t('teams.projectMembers', 'Project Members')}
                            <span className="text-gray-400 font-normal text-sm">({project.members?.length || 0})</span>
                        </h3>
                        {hasEditAccess && (
                            <button 
                                onClick={() => setIsAddMemberOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <UserPlus className="w-4 h-4" /> {t('teams.addMember', 'Add Member')}
                            </button>
                        )}
                    </div>
                    
                    {project.members && project.members.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {project.members.map((pm) => (
                                <div key={pm.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {pm.member?.avatar_url ? (
                                            <img src={pm.member.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-500">
                                                {pm.member?.fullname?.substring(0, 2).toUpperCase() || "??"}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{pm.member?.fullname || 'Unknown'}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-1.5 py-0.5 rounded">
                                                {pm.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm py-4">{t('teams.noMembersInProject', 'No members added directly to this project.')}</p>
                    )}
                </div>
            </div>

            </main>

            <CreateTeamModal 
                open={isCreateTeamOpen} 
                onClose={() => setIsCreateTeamOpen(false)}
                onCreated={() => id && loadProject(id)}
                projectId={id}
            />
            
            <AddProjectMemberModal
                open={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                projectId={id || ''}
                existingMemberIds={project.members?.map(m => m.member_id) || []}
                onAdded={() => id && loadProject(id)}
            />
        </div>
    );
}
