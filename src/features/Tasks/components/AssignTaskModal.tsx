
import { useState, useEffect } from "react";
import { createAndAssignTask, getAllTasks, assignTaskToMember } from "../services/tasks.service";
import type { SubTaskDefinition, Task } from "../types";
import { Plus, X, ListTodo, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

interface AssignTaskModalProps {
    open: boolean;
    onClose: () => void;
    onAssigned: () => void;
    memberId: string;
}

export default function AssignTaskModal({ open, onClose, onAssigned, memberId }: AssignTaskModalProps) {
    const [activeTab, setActiveTab] = useState<'new' | 'existing'>('existing');
    const [loading, setLoading] = useState(false);
    
    // -- Create New State --
    const [title, setTitle] = useState("");
    const [points, setPoints] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [trackingType, setTrackingType] = useState<'manual' | 'subtasks'>('subtasks');
    const [startDate, setStartDate] = useState<string>("");
    const [deadline, setDeadline] = useState<string>("");
    const [complexity, setComplexity] = useState<'lead' | 'major' | 'minor'>('minor');
    
    const handleTrackingTypeChange = (type: 'manual' | 'subtasks') => {
        setTrackingType(type);
        if (type === 'manual') setSubtasks([]);
    };

    const [subtasks, setSubtasks] = useState<SubTaskDefinition[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState("");

    // -- Existing Tasks State --
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [loadingTasks, setLoadingTasks] = useState(false);

    useEffect(() => {
        if (open && activeTab === 'existing') {
            loadTasks();
        }
    }, [open, activeTab]);

    const loadTasks = async () => {
        setLoadingTasks(true);
        try {
            const data = await getAllTasks();
            setAvailableTasks(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleAddSubtask = () => {
        if (!newSubtaskText.trim()) return;
        setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText.trim() }]);
        setNewSubtaskText("");
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (trackingType === 'subtasks' && subtasks.length === 0) {
           toast.error("Please add at least one subtask or switch to Manual tracking");
           return;
        }

        try {
            setLoading(true);
            await createAndAssignTask(memberId, {
                title,
                points,
                description,
                status: 'todo',
                start_date: startDate || undefined,
                deadline: deadline || undefined,
                complexity,
                subtasks: trackingType === 'subtasks' ? subtasks : []
            }, trackingType);
            
            toast.success("Task created and assigned");
            successClose();
        } catch (error) {
            toast.error("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const handleExistingSubmit = async () => {
        if (!selectedTaskId) return;

        try {
            setLoading(true);
            // Default to manual for now for existing tasks assignment? 
            // Ideally we check if task has subtasks defined.
            // Let's Find the task to check
            const task = availableTasks.find(t => t.id === selectedTaskId);
            const type = (task?.subtasks && task.subtasks.length > 0) ? 'subtasks' : 'manual';

            await assignTaskToMember(memberId, selectedTaskId, type);
            
            toast.success("Task assigned successfully");
            successClose();
        } catch (error) {
            toast.error("Failed to assign task");
        } finally {
            setLoading(false);
        }
    };

    const successClose = () => {
        onAssigned();
        onClose();
        // Reset
        setTitle("");
        setPoints(0);
        setDescription("");
        setSubtasks([]);
        setTrackingType('subtasks');
        setSelectedTaskId(null);
        setStartDate("");
        setDeadline("");
        setComplexity('minor');
    };

    const filteredTasks = availableTasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.team?.name && t.team.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex bg-gray-50 border-b p-1">
                    <button 
                        onClick={() => setActiveTab('existing')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'existing' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Existing Tasks
                    </button>
                    <button 
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'new' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Create New Task
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'existing' ? (
                        <div className="p-4 space-y-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search tasks..." 
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {loadingTasks ? (
                                <div className="text-center py-8 text-gray-400">Loading tasks...</div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No tasks found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredTasks.map(task => {
                                        const isSelected = selectedTaskId === task.id;
                                        return (
                                            <div 
                                                key={task.id}
                                                onClick={() => setSelectedTaskId(task.id)}
                                                className={cn(
                                                    "border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-50",
                                                    isSelected ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "border-gray-200"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {task.team && (
                                                                <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 whitespace-nowrap">
                                                                    Team: {task.team.name}
                                                                </span>
                                                            )}
                                                            {task.complexity && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${
                                                                    task.complexity === 'lead' ? 'bg-indigo-100 text-indigo-700' :
                                                                    task.complexity === 'major' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {task.complexity}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {task.points > 0 && <span className="text-xs font-bold text-gray-500">{task.points} pts</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Create New Form
                        <form id="create-task-form" onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., Organize Charity Event"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points Value</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., 50"
                                    value={points}
                                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complexity (JPS Multiplier)</label>
                                <select 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={complexity}
                                    onChange={(e) => setComplexity(e.target.value as any)}
                                >
                                    <option value="lead">Lead Role (15x)</option>
                                    <option value="major">Major Task (10x)</option>
                                    <option value="minor">Minor Task (4x)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24"
                                    placeholder="Add details about this task..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-1 font-bold text-xs uppercase tracking-wider">Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-1 font-bold text-xs uppercase tracking-wider">Deadline</label>
                                    <input 
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-red-600 font-bold"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleTrackingTypeChange('subtasks')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${trackingType === 'subtasks' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <ListTodo className="w-4 h-4" />
                                        Subtasks Checklist
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTrackingTypeChange('manual')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${trackingType === 'manual' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <Plus className="w-4 h-4 rotate-45" />
                                        Manual Percentage
                                    </button>
                                </div>
                            </div>

                            {trackingType === 'subtasks' && (
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Checklist Items</label>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Add a subtask..."
                                            value={newSubtaskText}
                                            onChange={(e) => setNewSubtaskText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleAddSubtask}
                                            className="px-3 py-2 bg-(--color-myAccent) text-white rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <ul className="space-y-2 mt-2">
                                        {subtasks.map((st) => (
                                            <li key={st.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-sm group">
                                                <span className="text-gray-700">{st.text}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => removeSubtask(st.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                        {subtasks.length === 0 && (
                                            <li className="text-center text-gray-400 text-sm py-2 italic">No subtasks added yet</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-4 border-t">
                     <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {activeTab === 'existing' ? (
                        <button 
                            onClick={handleExistingSubmit}
                            disabled={loading || !selectedTaskId}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Assigning...' : 'Assign Selected'}
                        </button>
                    ) : (
                        <button 
                            type="submit"
                            form="create-task-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Assigning...' : 'Assign Task'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
