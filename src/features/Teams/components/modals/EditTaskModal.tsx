
import { useState, useEffect } from "react";
import type { Task, SubTaskDefinition } from "../../../Tasks/types";
import { updateTask, completeAllTaskAssignments } from "../../../Tasks/services/tasks.service";
import { X, Plus, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface EditTaskModalProps {
    open: boolean;
    onClose: () => void;
    task: Task;
    onUpdated: () => void;
    isAdmin?: boolean;
}

export default function EditTaskModal({ open, onClose, task, onUpdated, isAdmin }: EditTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [points, setPoints] = useState(task.points);
    const [description, setDescription] = useState(task.description || "");
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>(task.status || 'todo');
    const [trackingType, setTrackingType] = useState<'manual' | 'subtasks'>(task.subtasks && task.subtasks.length > 0 ? 'subtasks' : 'manual');
    const [subtasks, setSubtasks] = useState<SubTaskDefinition[]>(task.subtasks || []);
    const [newSubtaskText, setNewSubtaskText] = useState("");

    const isRestricted = !isAdmin;

    const handleTrackingTypeChange = (type: 'manual' | 'subtasks') => {
        if (isRestricted) return;
        setTrackingType(type);
        if (type === 'manual') setSubtasks([]);
    };

    useEffect(() => {
        if (open) {
            setTitle(task.title);
            setPoints(task.points);
            setDescription(task.description || "");
            setStatus(task.status || 'todo');
            const initialType = task.subtasks && task.subtasks.length > 0 ? 'subtasks' : 'manual';
            setTrackingType(initialType);
            setSubtasks(task.subtasks || []);
        }
    }, [open, task]);

    const handleAddSubtask = () => {
        if (isRestricted || !newSubtaskText.trim()) return;
        setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText.trim() }]);
        setNewSubtaskText("");
    };

    const removeSubtask = (id: string) => {
        if (isRestricted) return;
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // If restricted, only status can be updated via this modal for convenience
            // But usually the user just wants to move the task status.
            await updateTask(task.id, {
                title: isRestricted ? task.title : title,
                points: isRestricted ? task.points : points,
                description: isRestricted ? task.description : description,
                status,
                subtasks: isRestricted ? task.subtasks : (trackingType === 'subtasks' ? subtasks : [])
            });

            // If marked as completed, auto-complete ALL assignments
            if (status === 'completed') {
                await completeAllTaskAssignments(task.id, trackingType === 'subtasks' ? (isRestricted ? task.subtasks || [] : subtasks) : []);
            }

            toast.success("Task updated");
            onUpdated();
            onClose();
        } catch (error) {
            toast.error("Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                        {isRestricted && <p className="text-[10px] text-amber-600 font-medium">Limited access: Only status can be modified.</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input 
                            type="text" 
                            disabled={isRestricted}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                        <input 
                            type="number" 
                            disabled={isRestricted}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                            value={points}
                            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            disabled={isRestricted}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none disabled:bg-gray-50 disabled:text-gray-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                        >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Method</label>
                        <div className={`flex bg-gray-100 p-1 rounded-lg ${isRestricted ? 'opacity-50' : ''}`}>
                            <button type="button" onClick={() => handleTrackingTypeChange('subtasks')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${trackingType === 'subtasks' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Subtasks</button>
                            <button type="button" onClick={() => handleTrackingTypeChange('manual')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${trackingType === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Manual %</button>
                        </div>
                    </div>

                    {trackingType === 'subtasks' && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label className="block text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                 <ListTodo className="w-3 h-3" /> Subtasks
                            </label>
                            {!isRestricted && (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        placeholder="Add item..."
                                        value={newSubtaskText}
                                        onChange={(e) => setNewSubtaskText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                    />
                                    <button type="button" onClick={handleAddSubtask} className="bg-gray-900 text-white px-3 rounded-lg">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <ul className="space-y-2">
                                {subtasks.map(st => (
                                    <li key={st.id} className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                                        <span>{st.text}</span>
                                        {!isRestricted && (
                                            <button type="button" onClick={() => removeSubtask(st.id)} className="text-red-400 hover:text-red-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
