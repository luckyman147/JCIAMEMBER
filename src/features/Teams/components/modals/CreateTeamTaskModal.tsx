
import { useState, useEffect } from "react";
import type { SubTaskDefinition } from "../../../Tasks/types";
import { Plus, X, Check, Paperclip } from "lucide-react";
import { toast } from "sonner";
import StarRating from "../../../Activities/components/common/StarRating";

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
    const [startDate, setStartDate] = useState<string>("");
    const [deadline, setDeadline] = useState<string>("");
    const [complexity, setComplexity] = useState<'lead' | 'major' | 'minor'>('minor');
    const [starRating, setStarRating] = useState<number>(3);
    const [headerColor, setHeaderColor] = useState("");
    const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);
    const [uploading, setUploading] = useState(false);
    
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

        if (subtasks.length === 0) {
           toast.error("Please add at least one task objective");
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
                complexity,
                star_rating: starRating,
                header_color: headerColor,
                attachments: attachments,
                subtasks: subtasks
            });

            if (!newTask) throw new Error("Failed to create task");

            if (status === 'completed') {
                const { completeAllTaskAssignments } = await import("../../../Tasks/services/tasks.service");
                await completeAllTaskAssignments(newTask.id, subtasks, starRating);
            } else {
                await Promise.all(assigneeIds.map(mid => 
                    assignTaskToMember(mid, newTask.id, 'subtasks')
                ));
            }
            
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
            setComplexity('minor');
            setStarRating(3);
            setHeaderColor("");
            setAttachments([]);

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
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-10 h-10 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center relative overflow-hidden transition-all hover:scale-105 active:scale-95"
                            style={{ backgroundColor: headerColor || '#f3f4f6' }}
                        >
                            <input 
                                type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                                value={headerColor || '#f3f4f6'}
                                onChange={(e) => setHeaderColor(e.target.value)}
                            />
                            {!headerColor && <Plus className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 leading-none">Assign Team Task</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Strategic Mission Briefing
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left: Task Details */}
                    <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r space-y-4 overflow-y-auto">
                         <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Theme Palette</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                    { name: 'Blue', hex: '#3b82f6' },
                                    { name: 'Indigo', hex: '#6366f1' },
                                    { name: 'Violet', hex: '#8b5cf6' },
                                    { name: 'Emerald', hex: '#10b981' },
                                    { name: 'Rose', hex: '#f43f5e' },
                                    { name: 'Amber', hex: '#f59e0b' },
                                    { name: 'Slate', hex: '#64748b' }
                                ].map((c) => (
                                    <button
                                        key={c.hex}
                                        type="button"
                                        onClick={() => setHeaderColor(c.hex)}
                                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${headerColor === c.hex ? 'border-gray-900 scale-110 shadow-sm' : 'border-white shadow-inner'}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                                <div className="relative w-6 h-6 rounded-full border-2 border-white shadow-inner overflow-hidden group">
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 group-hover:bg-gray-100 cursor-pointer">+</div>
                                    <input 
                                        type="color" 
                                        className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                                        value={headerColor || '#3b82f6'}
                                        onChange={(e) => setHeaderColor(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title..."
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complexity (JPS Multiplier)</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
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
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-1 text-sm">Initial Status</label>
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

                        {status === 'completed' && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-amber-700">Performance Rating (Impacts JPS)</label>
                                <div className="flex items-center gap-4">
                                    <StarRating 
                                        value={starRating} 
                                        onChange={(val: number) => setStarRating(val)} 
                                    />
                                    <span className="text-xs text-amber-600 font-medium italic">This rating will be applied to all assigned members.</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 mb-1 text-[10px] uppercase tracking-wider font-bold">Start Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-1 text-[10px] uppercase tracking-wider font-bold">Deadline</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs text-red-600 font-bold"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>

                         <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Activity Checklist</label>
                            </div>
                             <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Add an item..."
                                        value={newSubtaskText}
                                        onChange={(e) => setNewSubtaskText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                    />
                                    <button onClick={handleAddSubtask} type="button" className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {subtasks.map(st => (
                                        <div key={st.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-[11px] text-gray-600 font-medium">
                                            <span>{st.text}</span>
                                            <button onClick={() => removeSubtask(st.id)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Mission Resources</label>
                            
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    id="task-file-upload-new"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                setUploading(true);
                                                const { uploadTaskAttachment } = await import("../../../Tasks/services/tasks.service");
                                                const url = await uploadTaskAttachment(file);
                                                setAttachments([...attachments, { name: file.name, url }]);
                                                toast.success("Resource uploaded");
                                            } catch (err) {
                                                toast.error("Upload failed");
                                            } finally {
                                                setUploading(false);
                                            }
                                        }
                                    }}
                                />
                                <label 
                                    htmlFor="task-file-upload-new"
                                    className={`flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                                        {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-6 h-6" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-blue-500 transition-colors">
                                        {uploading ? 'Processing...' : 'Upload Attachment'}
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {attachments.map((att, idx) => {
                                    const isImg = att.url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || att.url.includes('image');
                                    return (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group hover:ring-2 hover:ring-blue-400 transition-all">
                                            {isImg ? (
                                                <img src={att.url} className="w-full h-full object-cover" alt={att.name} />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                    <Paperclip className="w-6 h-6 text-gray-300" />
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 px-2 text-center truncate w-full">{att.name}</span>
                                                </div>
                                            )}
                                            
                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <div className="flex gap-2">
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white text-gray-900 rounded-lg shadow-lg hover:scale-110 transition-transform">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                        className="p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-[8px] font-black text-white uppercase tracking-widest px-2 text-center truncate w-full">{att.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
                                         <span className="text-sm font-medium text-gray-700 grow truncate">{m.fullname}</span>
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
