import { X, Calendar, Clock, Trophy, CheckCircle2, Circle, Star, Paperclip, Download, Eye, FileText, ImageIcon, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../types';

interface TaskDetailsSidebarProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (task: Task) => void;
    isAdmin?: boolean;
    currentUserId?: string;
}

export const TaskDetailsSidebar = ({ task, isOpen, onClose, onEdit, isAdmin, currentUserId }: TaskDetailsSidebarProps) => {
    const [previewItem, setPreviewItem] = useState<{name: string, url: string} | null>(null);

    if (!task) return null;

    const isExpired = task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0));

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-60 transform transition-transform duration-500 ease-out border-l border-gray-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div 
                    className="p-6 border-b flex items-center justify-between sticky top-0 z-10"
                    style={{ backgroundColor: task.header_color || '#ffffff' }}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/90 shadow-sm ${
                            task.status === 'completed' ? 'text-emerald-600' :
                            task.status === 'in_progress' ? 'text-blue-600' :
                            'text-slate-500'
                        }`}>
                            {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${task.header_color ? 'text-white/80' : 'text-gray-400'}`}>Task Detail</span>
                            <h2 className={`text-sm font-black line-clamp-1 ${task.header_color ? 'text-white' : 'text-gray-900'}`}>{task.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(isAdmin || task.assignments?.some(a => a.member_id === currentUserId)) && onEdit && (
                            <button 
                                onClick={() => {
                                    onEdit(task);
                                    onClose();
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                    task.header_color 
                                        ? 'bg-white/20 text-white hover:bg-white/30 border border-white/20' 
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                                }`}
                            >
                                <Pencil className="w-3.5 h-3.5" /> Modify
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-colors ${task.header_color ? 'text-white/80 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                    {/* Status & Priority Ribbon */}
                    <div className="flex flex-wrap gap-2">
                         <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                            {task.status?.replace('_', ' ')}
                        </span>
                        {task.star_rating && (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {task.star_rating} Quality
                            </span>
                        )}
                        {task.points > 0 && (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1.5">
                                <Trophy className="w-3 h-3" />
                                {task.points} Points
                            </span>
                        )}
                        {task.complexity && (
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                task.complexity === 'lead' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                task.complexity === 'major' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                                {task.complexity}
                            </span>
                        )}
                        {isExpired && (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                                Overdue
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                             Description
                        </h3>
                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {task.description || "No description provided for this task."}
                            </p>
                        </div>
                    </section>

                    {/* Dates */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-gray-100 bg-white">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Start Date</span>
                            </div>
                            <span className="text-sm font-bold text-gray-700">
                                {task.start_date ? new Date(task.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
                            </span>
                        </div>
                        <div className={`p-4 rounded-2xl border ${isExpired ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                            <div className={`flex items-center gap-2 ${isExpired ? 'text-red-400' : 'text-gray-400'} mb-1`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Deadline</span>
                            </div>
                            <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                                {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
                            </span>
                        </div>
                    </section>

                    {/* Subtasks / Objectives */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                                Objectives ({task.subtasks.length})
                            </h3>
                            <div className="space-y-2">
                                {task.subtasks.map((sub, idx) => (
                                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/20 hover:border-gray-100 transition-colors group">
                                        <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-blue-600 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm text-gray-600 font-bold">{sub.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <Paperclip className="w-3.5 h-3.5" />
                                Resources ({task.attachments.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {task.attachments.map((att, idx) => {
                                    const isImage = att.url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || att.url.includes('image');
                                    return (
                                        <div 
                                            key={idx} 
                                            className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                                                    {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate pr-4">{att.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{isImage ? 'Image Asset' : 'Document'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setPreviewItem(att)}
                                                    className="p-2 bg-white text-gray-600 rounded-lg shadow-sm border border-gray-100 hover:text-blue-600 hover:border-blue-200 transition-all"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <a 
                                                    href={att.url} 
                                                    download={att.name}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white text-gray-600 rounded-lg shadow-sm border border-gray-100 hover:text-green-600 hover:border-green-200 transition-all"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Team Info if available */}
                    {task.team && (
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Project / Team</h3>
                            <div className="flex items-center gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                                    {task.team.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{task.team.name}</p>
                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Internal Project</p>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                    <div className="flex gap-3">
                        <button 
                            className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            onClick={onClose}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                    {previewItem.url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || previewItem.url.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-tight">{previewItem.name}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Resource Preview</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setPreviewItem(null)} 
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-0 bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
                            {previewItem.url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || previewItem.url.includes('image') ? (
                                <img 
                                    src={previewItem.url} 
                                    alt={previewItem.name} 
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-6 p-12 text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-gray-300">
                                        <FileText className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">File Preview Unavailable</h3>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            Direct preview for this file type is restricted. Download the file to view its contents.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t flex justify-end gap-3">
                            <button 
                                onClick={() => setPreviewItem(null)}
                                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <a 
                                href={previewItem.url}
                                download={previewItem.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/10 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download Resource
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
