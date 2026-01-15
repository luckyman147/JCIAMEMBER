import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, ChevronRight, LayoutGrid, Pencil, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "../../../Global_Components/navBar";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { getProjects, createProject, updateProject, deleteProject } from "../services/project.service";
import type { Project } from "../types";
import { toast } from "sonner";
import { FormInput, FormSection } from "../../../components";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Inline Modal Component since generic UI modal is missing
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    );
};

const projectSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  teamsInput: z.string().optional(), // For comma separated teams
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
    const { t, i18n } = useTranslation();
    const { role, user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    
    const canManage = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema)
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingProject(null);
        reset({ name: '', description: '', teamsInput: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingProject(project);
        reset({
            name: project.name,
            description: project.description || '',
            teamsInput: '' // Don't allow editing teams from here for now as they are separate entities
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm(t('teams.confirmDeleteProject', 'Are you sure you want to delete this project? This will delete all associated teams and tasks.'))) {
            return;
        }

        try {
            await deleteProject(id);
            toast.success("Project deleted successfully");
            loadProjects();
        } catch (error) {
            toast.error("Failed to delete project");
        }
    }

    const onSubmit = async (data: ProjectFormValues) => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        try {
            if (editingProject) {
                await updateProject(editingProject.id, {
                    name: data.name,
                    description: data.description
                });
                toast.success("Project updated successfully");
            } else {
                const teamNames = data.teamsInput 
                    ? data.teamsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
                    : [];
                
                await createProject({ 
                    name: data.name, 
                    description: data.description, 
                    leader_id: user.id,
                    teams: teamNames
                });
                toast.success("Project created successfully");
            }
            setIsModalOpen(false);
            reset();
            loadProjects();
        } catch (error) {
            console.error(error);
            toast.error(editingProject ? "Failed to update project" : "Failed to create project");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="md:ms-64 pt-16 md:pt-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="text-start">
                            <h1 className="text-3xl font-bold text-gray-900">{t('teams.projects', 'Projects')}</h1>
                            <p className="text-gray-500 mt-1">{t('teams.projectsSubtitle', 'Manage strategic initiatives and their teams')}</p>
                        </div>
                        {canManage && (
                            <button 
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-2 bg-(--color-myPrimary) text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-colors font-medium shadow-sm"
                            >
                                <Plus className="w-5 h-5" /> {t('teams.createProject', 'New Project')}
                            </button>
                        )}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white h-48 rounded-xl animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">{t('teams.noProjects', 'No projects found')}</h3>
                            <p className="text-gray-500 mt-1">{t('teams.startProject', 'Create a project to group teams together')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <div key={project.id} className="relative group">
                                    <Link 
                                        to={`/projects/${project.id}`}
                                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canManage && (
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={(e) => handleOpenEdit(e, project)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title={t('common.edit', 'Edit')}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleDelete(e, project.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title={t('common.delete', 'Delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <ChevronRight className={`w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 text-start">
                                            {project.description || t('common.noDescription', 'No description')}
                                        </p>

                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <LayoutGrid className="w-4 h-4" />
                                                <span>{project.teams?.length || 0} {t('teams.teams', 'Teams')}</span>
                                            </div>
                                            <span className="text-gray-400 text-xs">
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProject ? t('teams.editProject', 'Edit Project') : t('teams.createProject', 'Create New Project')}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <FormSection title={t('teams.projectInfo', 'Project Info')}>
                        <FormInput
                            id="name"
                            label={t('common.name', 'Name')}
                            placeholder={t('teams.projectNamePlaceholder', 'e.g. Strategic Plan 2025')}
                            register={register('name')}
                            error={errors.name}
                        />
                        <FormInput
                            id="description"
                            label={t('common.description', 'Description')}
                            placeholder={t('common.descriptionPlaceholder', 'Describe the project goals...')}
                            register={register('description')}
                            isTextarea
                        />
                        {!editingProject && (
                            <div className="space-y-1">
                                <FormInput
                                    id="teamsInput"
                                    label={t('teams.addTeams', 'Add Teams (optional)')}
                                    placeholder={t('teams.teamsPlaceholder', 'Team 1, Team 2, Team 3...')}
                                    register={register('teamsInput')}
                                />
                                <p className="text-[10px] text-gray-500">
                                    {t('teams.teamsHint', 'Separate team names with commas. If left empty, default teams will be created.')}
                                </p>
                            </div>
                        )}
                    </FormSection>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-(--color-myPrimary) text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 font-bold shadow-md shadow-blue-200"
                        >
                            {isSubmitting 
                                ? (editingProject ? t('common.updating', 'Updating...') : t('common.creating', 'Creating...')) 
                                : (editingProject ? t('common.update', 'Update Project') : t('common.create', 'Create Project'))}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
