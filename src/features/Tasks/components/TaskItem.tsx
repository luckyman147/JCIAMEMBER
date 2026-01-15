
import { useState } from "react";
import type { MemberTask } from "../types";
import { Check, Calendar, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import StarRating from "../../Activities/components/common/StarRating";

const formatDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    } catch (e) {
        return dateStr;
    }
};

const isExpired = (deadline: string) => {
    try {
        const d = new Date(deadline);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return d > new Date(0) && d < now;
    } catch (e) {
        return false;
    }
};

interface TaskItemProps {
    assignment: MemberTask;
    onUpdate: (id: string, updates: Partial<MemberTask>) => Promise<void>;
    isAdmin?: boolean;
}

export default function TaskItem({ assignment, onUpdate, isAdmin = false }: TaskItemProps) {
    const { t } = useTranslation();
    const [updating, setUpdating] = useState(false);
    
    const task = assignment.task;
    if (!task) return null;
    
    // Lock if completed or not admin
    const isLocked = assignment.status === 'completed';
    const canEditProgress = !isLocked;

    const isSubtaskTracking = assignment.tracking_type === 'subtasks';
    
    // Handler for Manual Progress
    const handleManualProgressChange = async (newProgress: number) => {
        if (updating || !canEditProgress) return;
        setUpdating(true);
        try {
            await onUpdate(assignment.id, { 
                progress_percentage: newProgress,
                status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'todo'
            });
        } finally {
            setUpdating(false);
        }
    };

    // Handler for Subtasks
    const handleSubtaskToggle = async (subtaskId: string) => {
        if (updating || !canEditProgress) return;
        setUpdating(true);
        try {
            const currentCompleted = assignment.completed_subtask_ids || [];
            const isCompleted = currentCompleted.includes(subtaskId);
            
            let newCompleted;
            if (isCompleted) {
                newCompleted = currentCompleted.filter(id => id !== subtaskId);
            } else {
                newCompleted = [...currentCompleted, subtaskId];
            }
            
            // Calculate new progress
            const totalSubtasks = task.subtasks?.length || 0;
            const progress = totalSubtasks > 0 ? Math.round((newCompleted.length / totalSubtasks) * 100) : 0;
            
            await onUpdate(assignment.id, {
                completed_subtask_ids: newCompleted,
                progress_percentage: progress,
                status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'todo'
            });
        } finally {
            setUpdating(false);
        }
    };


    return (
        <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                        {task.points > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                {task.points} pts
                            </span>
                        )}
                        {task.complexity && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                                task.complexity === 'lead' ? 'bg-indigo-100 text-indigo-700' :
                                task.complexity === 'major' ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {task.complexity}
                            </span>
                        )}
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                        {task.start_date && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(task.start_date)}</span>
                            </div>
                        )}
                        {task.deadline && (
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                                assignment.status !== 'completed' && isExpired(task.deadline)
                                    ? 'bg-red-50 text-red-600 ring-1 ring-red-100' 
                                    : 'text-gray-400'
                            }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatDate(task.deadline)}</span>
                                {assignment.status !== 'completed' && isExpired(task.deadline) && (
                                    <span className="ml-1 bg-red-600 text-white px-1.5 rounded text-[8px] uppercase tracking-tighter shadow-sm">Expired</span>
                                )}
                            </div>
                        )}
                    </div>

                    {task.team && (
                        <div className="mt-2">
                             <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                {t('profile.team')}: {task.team.name}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {assignment.status?.replace('_', ' ')}
                    </span>
                    {assignment.star_rating && !isAdmin && (
                        <div className="mt-2 flex items-center gap-1">
                            <StarRating value={assignment.star_rating} disabled size="sm" />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{t('profile.progress')}</span>
                    <span className="font-semibold">{assignment.progress_percentage}%</span>
                </div>
                
                {/* Progress Bar Visual */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 ${assignment.progress_percentage === 100 ? 'bg-green-500' : 'bg-(--color-myPrimary)'}`}
                        style={{ width: `${assignment.progress_percentage}%` }}
                    />
                </div>

                {isSubtaskTracking && task.subtasks && task.subtasks.length > 0 ? (
                    <div className="space-y-2 mt-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('profile.checklist')}</p>
                        {task.subtasks.map((subtask) => {
                            const isDone = assignment.completed_subtask_ids?.includes(subtask.id);
                            return (
                                <button
                                    key={subtask.id}
                                    onClick={() => handleSubtaskToggle(subtask.id)}
                                    disabled={updating || !canEditProgress}
                                    className={`flex items-start gap-3 w-full text-left p-2 rounded-lg transition-colors group ${!canEditProgress ? 'cursor-not-allowed opacity-75' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                        {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {subtask.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    // Manual Tracking Slider
                    <div className="mt-4">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">{t('profile.updateProgress')}</label>
                        <input 
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={assignment.progress_percentage}
                            onChange={(e) => handleManualProgressChange(parseInt(e.target.value))}
                            disabled={updating || !canEditProgress}
                            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${!canEditProgress ? 'cursor-not-allowed opacity-50 accent-gray-400' : 'accent-blue-600'}`}
                        />
                         <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                )}
                
                {isAdmin && (
                    <div className="mt-6 flex flex-col gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-700">{t('profile.qualityScore')} (Admin Only)</label>
                        <StarRating 
                            value={assignment.star_rating || 0} 
                            onChange={(val) => onUpdate(assignment.id, { star_rating: val })}
                        />
                        <p className="text-[10px] text-amber-600 italic">This rating influences the member's JPS score for this task.</p>
                    </div>
                )}

                {canEditProgress && (
                    <div className="mt-4">
                        <button
                            onClick={async () => {
                                if (isSubtaskTracking) {
                                    await onUpdate(assignment.id, {
                                        status: 'completed',
                                        progress_percentage: 100,
                                        completed_subtask_ids: task.subtasks?.map(s => s.id) || []
                                    });
                                } else {
                                    await onUpdate(assignment.id, {
                                        status: 'completed',
                                        progress_percentage: 100
                                    });
                                }
                            }}
                            disabled={updating}
                            className="w-full py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-3.5 h-3.5" />
                            {t('profile.markAsComplete')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
