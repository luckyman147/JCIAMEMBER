import { useState, useEffect } from "react";
import type { Task, SubTaskDefinition } from "../../../Tasks/types";
import { updateTask, completeAllTaskAssignments, assignTaskToMember, unassignTaskFromMember } from "../../../Tasks/services/tasks.service";
import { getTaskAssignments } from "../../services/teams.service";
import { X, ListTodo, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

interface TeamMemberOption {
    id: string; // member_id
    fullname: string;
    avatar_url?: string;
}

interface EditTaskModalProps {
    open: boolean;
    onClose: () => void;
    task: Task;
    onUpdated: () => void;
    teamMembers?: TeamMemberOption[];
}

export default function EditTaskModal({ open, onClose, task, onUpdated, teamMembers = [] }: EditTaskModalProps) {
    const [loading, setLoading] = useState(false);
    
    // Editable state
    const [title, setTitle] = useState(task.title);
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>(task.status || 'todo');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    
    // Read-only / Immutable state
    const [points, setPoints] = useState(task.points);
    const [description, setDescription] = useState(task.description || "");
    const [trackingType, setTrackingType] = useState<'manual' | 'subtasks'>(task.subtasks && task.subtasks.length > 0 ? 'subtasks' : 'manual');
    const [subtasks, setSubtasks] = useState<SubTaskDefinition[]>(task.subtasks || []);

    useEffect(() => {
        if (open) {
            setTitle(task.title);
            setStatus(task.status || 'todo');
            setPoints(task.points);
            setDescription(task.description || "");
            const initialType = task.subtasks && task.subtasks.length > 0 ? 'subtasks' : 'manual';
            setTrackingType(initialType);
            setSubtasks(task.subtasks || []);
            
            // Fetch assignments to sync selection
            loadAssignments();
        }
    }, [open, task]);

    const loadAssignments = async () => {
        try {
            const data = await getTaskAssignments(task.id);
            setAssigneeIds(data.map((a: any) => a.member_id));
        } catch (error) {
            console.error("Failed to load assignments", error);
        }
    };

    const toggleAssignee = (id: string) => {
        setAssigneeIds(prev => 
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // 1. Update core task fields (Name/Title and Status)
            await updateTask(task.id, {
                title,
                status
            });

            // 2. Reconcile Assignments
            const currentAssignments = await getTaskAssignments(task.id);
            const currentIds = currentAssignments.map((a: any) => a.member_id);
            
            const toAdd = assigneeIds.filter(id => !currentIds.includes(id));
            const toRemove = currentIds.filter(id => !assigneeIds.includes(id));

            await Promise.all([
                ...toAdd.map(id => assignTaskToMember(id, task.id, trackingType)),
                ...toRemove.map(id => unassignTaskFromMember(id, task.id))
            ]);

            // 3. Status specific Logic
            if (status === 'completed') {
                await completeAllTaskAssignments(task.id, subtasks);
            }

            toast.success("Task updated");
            onUpdated();
            onClose();
        } catch (error) {
            toast.error("Failed to update task");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                        <p className="text-[10px] text-gray-500 font-medium">Locked fields: Points, Description, Tracking Method.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row max-h-[85vh]">
                    {/* Left: Metadata & Status */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Task Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Status</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Points (Fixed)</label>
                                <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-500 font-medium">
                                    {points} pts
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Method (Fixed)</label>
                                <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-500 font-medium capitalize">
                                    {trackingType}
                                </div>
                            </div>
                        </div>

                        {description && (
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Description (Fixed)</label>
                                <div className="p-3 bg-gray-50 border rounded-lg text-xs text-gray-500 leading-relaxed italic">
                                    {description}
                                </div>
                            </div>
                        )}

                        {trackingType === 'subtasks' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Subtasks (Fixed)</label>
                                <div className="space-y-1">
                                    {subtasks.map(st => (
                                        <div key={st.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 text-[11px] text-gray-600">
                                            <ListTodo className="w-3 h-3" />
                                            {st.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Assignments */}
                    <div className="w-full md:w-72 bg-gray-50 border-l flex flex-col">
                        <div className="p-4 border-b bg-white">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <UserPlus className="w-3 h-3" /> Assign To
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {teamMembers.map(m => {
                                const isSelected = assigneeIds.includes(m.id);
                                return (
                                    <div 
                                        key={m.id}
                                        onClick={() => toggleAssignee(m.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden">
                                            {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.fullname.substring(0,2).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 flex-grow truncate">{m.fullname}</span>
                                        {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t bg-white sticky bottom-0 flex flex-col gap-2">
                             <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-md"
                            >
                                {loading ? 'Saving...' : 'Update Task'}
                            </button>
                            <button type="button" onClick={onClose} className="w-full py-2 text-sm text-gray-500 font-medium hover:text-gray-700">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
