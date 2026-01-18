
import { useState, useEffect, type FormEvent } from "react";
import type { SubTaskDefinition } from "../../../Tasks/types";
import { Plus, X, Check, Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import StarRating from "../../../Activities/components/common/StarRating";
import { deleteStorageFile } from "../../../../utils/uploadHelpers";
import { createTask, assignTaskToMember, completeAllTaskAssignments, uploadTaskAttachment } from "../../../Tasks/services/tasks.service";

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

const THEME_COLORS = [
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Slate', hex: '#64748b' }
];

export default function CreateTeamTaskModal({ 
    open, 
    onClose, 
    teamId, 
    teamMembers, 
    onCreated,
    initialStatus = 'todo' 
}: CreateTeamTaskModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Form States
    const [form, setForm] = useState({
        title: "",
        points: 0,
        description: "",
        status: initialStatus as 'todo' | 'in_progress' | 'completed',
        start_date: "",
        deadline: "",
        complexity: 'minor' as 'lead' | 'major' | 'minor',
        star_rating: 3,
        header_color: "",
    });

    const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);
    const [subtasks, setSubtasks] = useState<SubTaskDefinition[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState("");
    const [pendingUploads, setPendingUploads] = useState<string[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setForm(prev => ({ ...prev, status: initialStatus }));
        }
    }, [open, initialStatus]);

    const handleClose = async () => {
        if (pendingUploads.length > 0) {
            await Promise.all(pendingUploads.map(url => deleteStorageFile(url, 'task-attachments')));
        }
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setForm({
            title: "",
            points: 0,
            description: "",
            status: initialStatus,
            start_date: "",
            deadline: "",
            complexity: 'minor',
            star_rating: 3,
            header_color: "",
        });
        setAttachments([]);
        setSubtasks([]);
        setAssigneeIds([]);
        setPendingUploads([]);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            setUploading(true);
            const newAtts = [...attachments];
            const newPends = [...pendingUploads];
            
            for (const file of files) {
                const url = await uploadTaskAttachment(file);
                newAtts.push({ name: file.name, url });
                newPends.push(url);
            }
            
            setAttachments(newAtts);
            setPendingUploads(newPends);
            toast.success(`${files.length} file(s) uploaded`);
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Title is required");
        if (assigneeIds.length === 0) return toast.error("Select at least one member");

        try {
            setLoading(true);
            const newTask = await createTask({
                ...form,
                team_id: teamId,
                start_date: form.start_date || undefined,
                deadline: form.deadline || undefined,
                attachments,
                subtasks
            });

            if (!newTask) throw new Error("Creation failed");

            if (form.status === 'completed') {
                await completeAllTaskAssignments(newTask.id, subtasks, form.star_rating);
            } else {
                await Promise.all(assigneeIds.map(mid => assignTaskToMember(mid, newTask.id, 'subtasks')));
            }
            
            setPendingUploads([]); // Clear to prevent cleanup on close
            toast.success("Mission strategy deployed!");
            onCreated();
            handleClose();
        } catch (error) {
            toast.error("Failed to assign task");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500" onClick={handleClose} />
            
            <div className="relative w-full sm:max-w-5xl bg-white h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2.5rem] shadow-2xl z-10 overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border-2 border-white shadow-lg flex items-center justify-center relative overflow-hidden transition-all hover:scale-105"
                            style={{ backgroundColor: form.header_color || '#f3f4f6' }}
                        >
                            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" value={form.header_color || '#f3f4f6'} onChange={(e) => setForm({...form, header_color: e.target.value})} />
                            {!form.header_color && <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-none">Assign Team Task</h2>
                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 sm:mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Strategic Mission Briefing
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-red-500">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                    {/* Left side Form */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 md:flex-1 md:overflow-y-auto md:border-r border-gray-100">
                        {/* Task Primary Details */}
                        <section className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {THEME_COLORS.map(c => (
                                    <button key={c.hex} onClick={() => setForm({...form, header_color: c.hex})} className={`w-6 h-6 rounded-full border-2 transition-all ${form.header_color === c.hex ? 'border-gray-900 scale-110 shadow-sm' : 'border-white shadow-inner'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                                ))}
                            </div>
                            
                            <input 
                                type="text" 
                                className="w-full text-xl sm:text-2xl font-black text-gray-900 placeholder:text-gray-200 border-none focus:ring-0 p-0"
                                placeholder="Task Title..."
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                            />

                            <textarea 
                                className="w-full text-xs sm:text-sm text-gray-600 placeholder:text-gray-300 border-none focus:ring-0 p-0 resize-none h-20 sm:h-24"
                                placeholder="Describe the mission objectives..."
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                            />
                        </section>

                        {/* Task Meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div>
                                <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Points & Complexity</label>
                                <div className="flex gap-2">
                                    <input type="number" className="w-16 sm:w-20 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={form.points} onChange={e => setForm({...form, points: parseInt(e.target.value) || 0})} />
                                    <select className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={form.complexity} onChange={e => setForm({...form, complexity: e.target.value as any})}>
                                        <option value="lead">Lead (15x)</option>
                                        <option value="major">Major (10x)</option>
                                        <option value="minor">Minor (4x)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status & Timeline</label>
                                <div className="flex gap-2">
                                    <select className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <input type="date" className="w-28 sm:w-32 px-2 py-1.5 bg-white border border-gray-200 rounded-xl text-[9px] sm:text-[10px] font-bold outline-none" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {form.status === 'completed' && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center lg:flex-row flex-col gap-4">
                                <StarRating value={form.star_rating} onChange={val => setForm({...form, star_rating: val})} />
                                <p className="text-[9px] sm:text-[10px] text-amber-700 font-bold uppercase tracking-tight text-center lg:text-left">Group Performance Rating</p>
                            </div>
                        )}

                        {/* Checklist */}
                        <section className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Check className="w-4 h-4" /> Checklist ({subtasks.length})
                            </label>
                            <div className="flex gap-2">
                                <input type="text" className="flex-1 px-3 sm:px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Task item..." value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText }]), setNewSubtaskText(""))} />
                                <button type="button" onClick={() => (setSubtasks([...subtasks, { id: crypto.randomUUID(), text: newSubtaskText }]), setNewSubtaskText(""))} className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"><Plus className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {subtasks.map(s => (
                                    <div key={s.id} className="group flex items-center justify-between p-2 sm:p-2.5 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                        <span className="text-[11px] sm:text-xs font-medium text-gray-600">{s.text}</span>
                                        <button type="button" onClick={() => setSubtasks(subtasks.filter(st => st.id !== s.id))} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Attachments */}
                        <section className="space-y-3 pb-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Paperclip className="w-4 h-4" /> Resources ({attachments.length})
                            </label>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
                                <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                                    {uploading ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : <Plus className="w-6 h-6 text-gray-400" />}
                                </label>
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                                        {att.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <img src={att.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center"><Paperclip className="w-6 h-6 text-gray-300" /></div>}
                                        <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right side Assignment */}
                    <div className="w-full md:w-80 bg-gray-50/50 flex flex-col shrink-0 md:h-full border-t md:border-t-0">
                        <div className="p-4 sm:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 md:relative z-10">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Squad Assignment</h3>
                            <div className="flex justify-between items-end">
                                <p className="text-xl sm:text-2xl font-black text-gray-900">{assigneeIds.length}<span className="text-sm font-bold text-gray-400 ml-1">/{teamMembers.length}</span></p>
                                <button onClick={() => setAssigneeIds(assigneeIds.length === teamMembers.length ? [] : teamMembers.map(m => m.id))} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">{assigneeIds.length === teamMembers.length ? 'Clear Squad' : 'Deploy All'}</button>
                            </div>
                        </div>

                        <div className="flex-1 md:overflow-y-auto p-3 sm:p-4 space-y-2">
                             {teamMembers.map(m => {
                                 const isSelected = assigneeIds.includes(m.id);
                                 return (
                                     <button 
                                        key={m.id}
                                        onClick={() => setAssigneeIds(isSelected ? assigneeIds.filter(id => id !== m.id) : [...assigneeIds, m.id])}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${isSelected ? 'bg-white border-blue-200 shadow-sm ring-2 ring-blue-500/5' : 'bg-transparent border-transparent hover:bg-gray-100'}`}
                                     >
                                         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-gray-400 overflow-hidden shrink-0 border border-gray-100">
                                             {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : m.fullname.substring(0,2).toUpperCase()}
                                         </div>
                                         <span className={`text-sm font-bold truncate grow text-left ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{m.fullname}</span>
                                         <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                                             {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                         </div>
                                     </button>
                                 );
                             })}
                        </div>

                        <div className="p-4 sm:p-6 bg-white border-t space-y-3 shrink-0 sticky bottom-0 md:relative">
                            <button 
                                onClick={handleSubmit}
                                disabled={loading || assigneeIds.length === 0}
                                className="w-full py-3 sm:py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-900/10 transition-all flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Deploying...' : 'Deploy Mission'}
                            </button>
                            <button type="button" onClick={handleClose} className="w-full py-1 sm:py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-all">
                                Abort Mission
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
