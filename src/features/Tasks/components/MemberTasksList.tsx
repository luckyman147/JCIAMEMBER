import { useState } from "react";
import TaskItem from "./TaskItem";
import AssignTaskModal from "./AssignTaskModal";
import { Plus, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useMemberTasks, useUpdateMemberTask } from "../hooks/useTasks";
import type { MemberTask } from "../types";
import { useTranslation } from "react-i18next";

interface MemberTasksListProps {
    memberId: string;
    isAdmin?: boolean;
}

export default function MemberTasksList({ memberId, isAdmin = false }: MemberTasksListProps) {
    const { t } = useTranslation();
    const { data: tasks = [], isLoading: loading, refetch } = useMemberTasks(memberId);
    const updateMutation = useUpdateMemberTask();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const handleTaskUpdate = async (id: string, updates: Partial<MemberTask>) => {
        try {
            await updateMutation.mutateAsync({ id, updates });
        } catch (error) {
            toast.error(t('profile.updateFailed'));
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-blue-600" />
                        {t('profile.assignedTasks')}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t('profile.trackMemberProgress')}</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-(--color-myPrimary) text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('profile.giveTask')}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ListChecks className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">{t('profile.noTasksAssigned')}</h3>
                    <p className="text-gray-500 text-sm">{t('profile.assignTaskPrompt')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            assignment={task} 
                            onUpdate={handleTaskUpdate}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}

            <AssignTaskModal 
                open={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)}
                onAssigned={() => refetch()}
                memberId={memberId}
            />
        </div>
    );
}
