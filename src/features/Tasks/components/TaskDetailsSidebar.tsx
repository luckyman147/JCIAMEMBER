
import { X, Calendar, Clock, Trophy, CheckCircle2, Circle } from 'lucide-react';
import type { Task } from '../types';

interface TaskDetailsSidebarProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailsSidebar = ({ task, isOpen, onClose }: TaskDetailsSidebarProps) => {
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
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[60] transform transition-transform duration-500 ease-out border-l border-gray-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                            'bg-slate-50 text-slate-500'
                        }`}>
                            {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Detail</span>
                            <h2 className="text-sm font-bold text-gray-900 line-clamp-1">{task.title}</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
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
                        {task.points > 0 && (
                            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1.5">
                                <Trophy className="w-3 h-3" />
                                {task.points} Points
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
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center justify-between">
                                <span>Objectives ({task.subtasks.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {task.subtasks.map((sub, idx) => (
                                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-colors group">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium">{sub.text}</span>
                                    </div>
                                ))}
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
        </>
    );
};
