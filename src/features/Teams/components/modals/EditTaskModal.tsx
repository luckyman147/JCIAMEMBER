import { useState, useEffect } from "react";
import type { Task, SubTaskDefinition } from "../../../Tasks/types";
import { updateTask, completeAllTaskAssignments, assignTaskToMember, unassignTaskFromMember } from "../../../Tasks/services/tasks.service";
import { getTaskAssignments } from "../../services/teams.service";
import { X, UserPlus, Check, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "../../../Activities/components";

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
    const [complexity, setComplexity] = useState<'lead' | 'major' | 'minor'>(task.complexity || 'minor');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(task.start_date || "");
    const [deadline, setDeadline] = useState(task.deadline || "");
    const [starRating, setStarRating] = useState<number>(task.star_rating || 3);
    const [headerColor, setHeaderColor] = useState(task.header_color || "");
    const [attachments, setAttachments] = useState<{name: string, url: string}[]>(task.attachments || []);
    const [uploading, setUploading] = useState(false);
    
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
            setComplexity(task.complexity || 'minor');
            setDescription(task.description || "");
            const initialType = task.subtasks && task.subtasks.length > 0 ? 'subtasks' : 'manual';
            setTrackingType(initialType);
            setSubtasks(task.subtasks || []);
            setStartDate(task.start_date || "");
            setDeadline(task.deadline || "");
            setHeaderColor(task.header_color || "");
            setAttachments(task.attachments || []);
            setStarRating(task.star_rating || 3);
            
            // Fetch assignments to sync selection
            loadAssignments();
        }
    }, [open, task]);

    const loadAssignments = async () => {
        try {
            const data = await getTaskAssignments(task.id);
            setAssigneeIds(data.map((a: any) => a.member_id));
            // Sync rating from assignments if task is completed
            const firstRated = data.find((a: any) => a.star_rating);
            if (firstRated) setStarRating(firstRated.star_rating);
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
            
            await updateTask(task.id, {
                title,
                status,
                complexity,
                start_date: startDate || undefined,
                deadline: deadline || undefined,
                star_rating: starRating,
                header_color: headerColor,
                attachments: attachments,
                subtasks: subtasks
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
                await completeAllTaskAssignments(task.id, subtasks, starRating);
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
                            <h2 className="text-xl font-black text-gray-900 leading-none">Edit Mission</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Refine Strategic Objectives
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row max-h-[85vh]">
                    {/* Left: Metadata & Status */}
                     <div className="flex-1 p-6 space-y-4 overflow-y-auto">
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

                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Task Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
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

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Complexity (JPS Multiplier)</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                value={complexity}
                                onChange={(e) => setComplexity(e.target.value as any)}
                            >
                                <option value="lead">Lead Role (15x)</option>
                                <option value="major">Major Task (10x)</option>
                                <option value="minor">Minor Task (4x)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Start Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Deadline</label>
                                <input 
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-red-600 font-bold"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-amber-700">Performance Rating</label>
                            <div className="flex items-center gap-4">
                                <StarRating 
                                    value={starRating} 
                                    onChange={(val: number) => setStarRating(val)} 
                                />
                                <span className="text-[10px] text-amber-600 font-bold italic">Global quality assessment for this objective.</span>
                            </div>
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

                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Activity Checklist</label>
                                <button 
                                    type="button" 
                                    onClick={() => setSubtasks([...subtasks, { id: crypto.randomUUID(), text: "New Action" }])}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                                >
                                    + Add Item
                                </button>
                             </div>
                            <div className="space-y-2">
                                {subtasks.map((st, idx) => (
                                    <div key={st.id} className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={st.text}
                                            onChange={(e) => {
                                                const newSub = [...subtasks];
                                                newSub[idx].text = e.target.value;
                                                setSubtasks(newSub);
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setSubtasks(subtasks.filter(s => s.id !== st.id))}
                                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {subtasks.length === 0 && <p className="text-[10px] text-gray-400 italic">No checklist items defined.</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Mission Resources</label>
                            
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    id="edit-task-file-upload-new"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                setUploading(true);
                                                const { uploadTaskAttachment } = await import("../../../Tasks/services/tasks.service");
                                                const url = await uploadTaskAttachment(file);
                                                setAttachments([...attachments, { name: file.name, url }]);
                                                toast.success("Resource added");
                                            } catch (err) {
                                                toast.error("Upload failed");
                                            } finally {
                                                setUploading(false);
                                            }
                                        }
                                    }}
                                />
                                <label 
                                    htmlFor="edit-task-file-upload-new"
                                    className={`flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500">
                                        {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-6 h-6" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-blue-500 transition-colors">
                                        {uploading ? 'Processing...' : 'Add Attachment'}
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {attachments.map((att, idx) => {
                                    const isImg = att.url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || att.url.includes('image');
                                    return (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group hover:ring-2 hover:ring-blue-400 transition-all scale-in duration-200">
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
                                                <div className="flex gap-2 font-black">
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
                                        <span className="text-xs font-medium text-gray-700 grow truncate">{m.fullname}</span>
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
