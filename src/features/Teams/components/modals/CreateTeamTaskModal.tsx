
import { useState, useEffect } from "react";
import type { SubTaskDefinition } from "../../../Tasks/types";
import { Plus, X, Check } from "lucide-react";
import { toast } from "sonner";

interface TeamMemberOption {
    id: string; // member_id
    fullname: string;
    avatar_url?: string;
}

interface CreateTeamTaskModalProps {
    open: boolean;
    onClose: () => void;
    teamId: string;
    teamMembers: TeamMemberOption[];
    onCreated: () => void;
    initialStatus?: 'todo' | 'in_progress' | 'completed';
}

export default function CreateTeamTaskModal({ 
    open, 
    onClose, 
    teamId, 
    teamMembers, 
    onCreated,
    initialStatus = 'todo' 
}: CreateTeamTaskModalProps) {
    const [loading, setLoading] = useState(false);
    
    // Task State
    const [title, setTitle] = useState("");
    const [points, setPoints] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>(initialStatus);
    const [trackingType, setTrackingType] = useState<'manual' | 'subtasks'>('subtasks');
    const [startDate, setStartDate] = useState<string>("");
    const [deadline, setDeadline] = useState<string>("");
    
    const handleTrackingTypeChange = (type: 'manual' | 'subtasks') => {
        setTrackingType(type);
        if (type === 'manual') setSubtasks([]);
    };
    const [subtasks, setSubtasks] = useState<SubTaskDefinition[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState("");

    // Sync status with initialStatus when modal opens
    useEffect(() => {
        if (open) {
            setStatus(initialStatus);
        }
    }, [open, initialStatus]);

    // Assignment State
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [assignAll, setAssignAll] = useState(false);

    const handleAddSubtask = () => {
        if (!newSubtaskText.trim()) return;
        setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText.trim() }]);
        setNewSubtaskText("");
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const toggleAssignee = (id: string) => {
        if (assigneeIds.includes(id)) {
            setAssigneeIds(prev => prev.filter(mid => mid !== id));
            setAssignAll(false);
        } else {
            setAssigneeIds(prev => [...prev, id]);
        }
    };

    const handleToggleAll = () => {
        if (assignAll) {
            setAssigneeIds([]);
            setAssignAll(false);
        } else {
            setAssigneeIds(teamMembers.map(m => m.id));
            setAssignAll(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (assigneeIds.length === 0) {
            toast.error("Please select at least one member to assign");
            return;
        }

        if (trackingType === 'subtasks' && subtasks.length === 0) {
           toast.error("Please add subtasks or use Manual tracking");
           return;
        }

        try {
            setLoading(true);

            // We need to create tasks for each assignee. 
            // Ideally, the data model supports one Task + many Assignments (MemberTasks).
            // My current service `createAndAssignTask` creates a NEW Task row for each call.
            // Requirement check: "create tasks and assign the member to that task"
            // If I assign to 5 people, do they share the SAME Task ID? 
            // My schema `member_tasks` links `task_id`.
            // So I should create ONE Task, then create multiple `member_tasks` entries.
            
            // Refactored logic:
            // 1. Create the Task ONCE
            // 2. Assign to multiple members
            
            // I'll implement this logic here manually calling `createTask` then `assignTaskToMember` loop.
            // I need to import them individually.
            
            // Let's just Loop `createAndAssignTask` for now creates DUPLICATE tasks, which is bad if they are supposed to be the "same" task shared.
            // But if they are separate "instances" like "Complete Evaluation", duplicate is fine.
            // However, typical Team Task means "The Team has a Task", and members contribute.
            // Or "Admin assigns 'Do X' to Bob and Alice". Usually separate tracking.
            // Let's assume shared Task definition, individual tracking.
            
            // I will use `createAndAssignTask` but that creates a new task every time. 
            // Wait, proper way: Create 1 Task linked to Team. Then Assign.
            
            const { createTask, assignTaskToMember } = await import("../../../Tasks/services/tasks.service");
            
            // 1. Create Task
            const newTask = await createTask({
                title,
                description,
                points,
                team_id: teamId,
                status: status,
                start_date: startDate || undefined,
                deadline: deadline || undefined,
                subtasks: trackingType === 'subtasks' ? subtasks : []
            });

            if (!newTask) throw new Error("Failed to create task");

            // 2. Assign to all selected
            await Promise.all(assigneeIds.map(mid => 
                assignTaskToMember(mid, newTask.id, trackingType)
            ));
            
            toast.success(`Task assigned to ${assigneeIds.length} members`);
            onCreated();
            onClose();

            // Reset
            setTitle("");
            setDescription("");
            setPoints(0);
            setStatus(initialStatus);
            setSubtasks([]);
            setAssigneeIds([]);
            setAssignAll(false);
            setStartDate("");
            setDeadline("");

        } catch (error) {
            toast.error("Failed to assign task");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Create & Assign Team Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                    {/* Left: Task Details */}
                    <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                            <input 
                                type="number" 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={points}
                                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase tracking-wider font-bold">Start Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-xs uppercase tracking-wider font-bold">Deadline</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-red-600 font-bold"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tracking</label>
                             <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                                <button type="button" onClick={() => handleTrackingTypeChange('subtasks')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${trackingType === 'subtasks' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Subtasks</button>
                                <button type="button" onClick={() => handleTrackingTypeChange('manual')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${trackingType === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Manual %</button>
                            </div>

                             {trackingType === 'subtasks' && (
                                <div className="space-y-2">
                                     <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 px-2 py-1.5 border rounded text-xs"
                                            placeholder="Add item..."
                                            value={newSubtaskText}
                                            onChange={(e) => setNewSubtaskText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        />
                                        <button onClick={handleAddSubtask} type="button" className="bg-gray-900 text-white px-2 rounded hover:bg-gray-700"><Plus className="w-3 h-3" /></button>
                                    </div>
                                    <ul className="space-y-1">
                                        {subtasks.map(st => (
                                            <li key={st.id} className="flex justify-between text-xs bg-gray-50 p-1.5 rounded">
                                                <span>{st.text}</span>
                                                <button onClick={() => removeSubtask(st.id)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Assignees */}
                    <div className="w-full md:w-1/2 flex flex-col bg-gray-50 min-h-[300px] md:min-h-0">
                        <div className="p-4 border-b flex justify-between items-center bg-white">
                            <h3 className="font-semibold text-gray-800 text-sm">Assign To</h3>
                            <button 
                                onClick={handleToggleAll}
                                className="text-xs text-blue-600 hover:underline font-medium"
                            >
                                {assignAll ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                             {teamMembers.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-10">No members in team yet.</p>
                             ) : teamMembers.map(m => {
                                 const isSelected = assigneeIds.includes(m.id);
                                 return (
                                     <div 
                                        key={m.id}
                                        onClick={() => toggleAssignee(m.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}
                                     >
                                         <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                                             {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.fullname.substring(0,2).toUpperCase()}
                                         </div>
                                         <span className="text-sm font-medium text-gray-700 flex-grow truncate">{m.fullname}</span>
                                         {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                     </div>
                                 );
                             })}
                        </div>
                        
                         <div className="p-4 border-t bg-white sticky bottom-0">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <span>{assigneeIds.length} members selected</span>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading || assigneeIds.length === 0}
                                className="w-full py-2 bg-(--color-myPrimary) text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Assigning...' : 'Create & Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
