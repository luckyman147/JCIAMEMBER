
import { useEffect, useState } from "react";
import { getTeamTasks } from "../services/teams.service";
import { deleteTask, updateTask, completeAllTaskAssignments } from "../../Tasks/services/tasks.service";
import type { Task } from "../../Tasks/types";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../Authentication/auth.context";
import EditTaskModal from "./modals/EditTaskModal";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./tasks/KanbanColumn";
import { ViewToggle } from "./tasks/ViewToggle";
import { TaskCard } from "./tasks/TaskCard";
import CreateTeamTaskModal from "./modals/CreateTeamTaskModal";
import { TaskDetailsSidebar } from "../../Tasks";

interface TeamMemberOption {
    id: string; // member_id
    fullname: string;
    avatar_url?: string;
}

interface TeamTasksListProps {
    teamId: string;
    refreshTrigger?: number;
    isAdmin?: boolean;
    teamMembers?: TeamMemberOption[];
}

export default function TeamTasksList({ teamId, refreshTrigger, isAdmin, teamMembers = [] }: TeamTasksListProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [view, setView] = useState<'list' | 'kanban' | 'table'>('kanban');
    const [creationStatus, setCreationStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');

    useEffect(() => {
        loadTasks();
    }, [teamId, refreshTrigger]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await getTeamTasks(teamId);
            setTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as 'todo' | 'in_progress' | 'completed';
        const taskToUpdate = tasks.find(t => t.id === draggableId);
        
        // Optimistic update
        const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await updateTask(draggableId, { status: newStatus });
            
            // If moved to COMPLETED, auto-complete all individual assignments
            if (newStatus === 'completed' && taskToUpdate) {
                await completeAllTaskAssignments(draggableId, taskToUpdate.subtasks || []);
            }

            toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
        } catch (error) {
            toast.error("Failed to update task status");
            loadTasks(); // Rollback
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteTask(taskId);
            toast.success("Task deleted");
            loadTasks();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Loading tasks...
    </div>;

    const COLUMNS = [
        { id: 'todo', title: 'To Do', color: 'bg-slate-100 text-slate-700' },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 text-(--color-myPrimary)' },
        { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-700' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <ViewToggle view={view} onViewChange={setView} />
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No tasks yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">Create tasks to start tracking your team's progress on this project.</p>
                </div>
            ) : view === 'list' ? (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <TaskCard 
                            key={task.id}
                            task={task} 
                            isKanban={false} 
                            isAdmin={isAdmin}
                            currentUserId={user?.id}
                            onEdit={setEditingTask}
                            onDelete={handleDelete}
                            onUpdate={loadTasks}
                            onClickDetail={setSelectedTaskForDetail}
                        />
                    ))}
                </div>
            ) : view === 'table' ? (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Task</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Points</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tasks.map(task => {
                                    const isExpired = task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));
                                    return (
                                        <tr key={task.id} 
                                            onClick={() => setSelectedTaskForDetail(task)}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{task.title}</div>
                                                    <div className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">{task.description}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-slate-50 text-slate-600'
                                                }`}>
                                                    {task.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                                {task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-xs font-bold ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                                                    </span>
                                                    {isExpired && (
                                                        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter w-fit shadow-sm">Expired</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-amber-600 font-bold text-sm">{task.points}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    {isAdmin && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-col lg:flex-row gap-6 h-[700px] overflow-x-auto pb-4">
                        {COLUMNS.map(column => (
                            <KanbanColumn 
                                key={column.id}
                                column={column}
                                tasks={tasks}
                                isAdmin={isAdmin}
                                currentUserId={user?.id}
                                onEdit={setEditingTask}
                                onDelete={handleDelete}
                                onAddNew={(status) => {
                                    setCreationStatus(status);
                                    setIsCreateTaskOpen(true);
                                }}
                                onUpdate={loadTasks}
                                onClickDetail={setSelectedTaskForDetail}
                            />
                        ))}
                    </div>
                </DragDropContext>
            )}

            {editingTask && (
                <EditTaskModal 
                    open={!!editingTask} 
                    onClose={() => setEditingTask(null)} 
                    task={editingTask} 
                    onUpdated={loadTasks} 
                    teamMembers={teamMembers}
                />
            )}

            {isCreateTaskOpen && (
                <CreateTeamTaskModal
                    open={isCreateTaskOpen}
                    onClose={() => setIsCreateTaskOpen(false)}
                    teamId={teamId}
                    teamMembers={teamMembers}
                    onCreated={loadTasks}
                    initialStatus={creationStatus}
                />
            )}

            <TaskDetailsSidebar 
                task={selectedTaskForDetail}
                isOpen={!!selectedTaskForDetail}
                onClose={() => setSelectedTaskForDetail(null)}
            />
        </div>
    );
}
