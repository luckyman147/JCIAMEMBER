
import { useEffect, useState } from "react";
import { getTeamTasks } from "../services/teams.service";
import { deleteTask, updateTask, completeAllTaskAssignments } from "../../Tasks/services/tasks.service";
import type { Task } from "../../Tasks/types";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../Authentication/auth.context";
import EditTaskModal from "./modals/EditTaskModal";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./tasks/KanbanColumn";
import { ViewToggle } from "./tasks/ViewToggle";
import { TaskCard } from "./tasks/TaskCard";

interface TeamTasksListProps {
    teamId: string;
    refreshTrigger?: number;
    isAdmin?: boolean;
}

export default function TeamTasksList({ teamId, refreshTrigger, isAdmin }: TeamTasksListProps) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [view, setView] = useState<'list' | 'kanban'>('kanban');

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

    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No tasks yet</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">Create tasks to start tracking your team's progress on this project.</p>
            </div>
        );
    }

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

            {view === 'list' ? (
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
                        />
                    ))}
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
                                onUpdate={loadTasks}
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
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
}
