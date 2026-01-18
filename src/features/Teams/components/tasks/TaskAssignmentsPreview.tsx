
import { useEffect, useState } from "react";
import { getTaskAssignments } from "../../services/teams.service";
import { updateMemberTask } from "../../../Tasks/services/tasks.service";
import type { Task } from "../../../Tasks/types";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface TaskAssignmentsPreviewProps {
    taskId: string;
    task: Task;
    currentUserId?: string;
    onUpdate: () => void;
}

export const TaskAssignmentsPreview = ({ taskId, task, currentUserId, onUpdate }: TaskAssignmentsPreviewProps) => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [updating, setUpdating] = useState(false);
    
    useEffect(() => {
        getTaskAssignments(taskId).then(setAssignments);
    }, [taskId]);

    const myAssignment = assignments.find(a => a.member_id === currentUserId);

    const handleManualProgress = async (val: number) => {
        if (!myAssignment) return;
        try {
            setUpdating(true);
            const status = val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'todo';
            await updateMemberTask(myAssignment.id, { progress_percentage: val, status });
            setAssignments(prev => prev.map(a => a.id === myAssignment.id ? { ...a, progress_percentage: val, status } : a));
            if (val === 100) toast.success("My part is done!");
        } catch (error) {
            toast.error("Failed to update progress");
        } finally {
            setUpdating(false);
            onUpdate();
        }
    };

    const toggleSubtask = async (subtaskId: string) => {
        if (!myAssignment) return;
        try {
            setUpdating(true);
            const currentIds = myAssignment.completed_subtask_ids || [];
            const newIds = currentIds.includes(subtaskId) 
                ? currentIds.filter((id: string) => id !== subtaskId)
                : [...currentIds, subtaskId];
            
            const totalSubtasks = task.subtasks?.length || 1;
            const progress = Math.round((newIds.length / totalSubtasks) * 100);
            const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'todo';

            await updateMemberTask(myAssignment.id, { 
                completed_subtask_ids: newIds, 
                progress_percentage: progress,
                status
            });

            setAssignments(prev => prev.map(a => a.id === myAssignment.id ? { 
                ...a, 
                completed_subtask_ids: newIds, 
                progress_percentage: progress,
                status
            } : a));
            
            if (progress === 100) toast.success("My part is done!");
        } catch (error) {
            toast.error("Failed to update subtask");
        } finally {
            setUpdating(false);
            onUpdate();
        }
    };

    if (assignments.length === 0) return <span className="text-xs text-gray-400 font-medium">Unassigned</span>;
    
    // Calculate aggregate progress (average of all members' progress)
    const aggregateProgress = assignments.length > 0 
        ? Math.round(assignments.reduce((acc, curr) => acc + (curr.progress_percentage || 0), 0) / assignments.length)
        : 0;

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Aggregate Progress Bar */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Team Progress</span>
                        <span className="text-[10px] font-black text-(--color-myPrimary)">{aggregateProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50/50">
                        <div 
                            className="h-full bg-linear-to-r from-(--color-myPrimary) to-blue-400 transition-all duration-500 ease-out rounded-full shadow-sm"
                            style={{ width: `${aggregateProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex -space-x-1.5 overflow-hidden pt-1">
                {assignments.slice(0, 5).map((a) => (
                    <div 
                        key={a.id} 
                        className="relative w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] overflow-hidden shadow-sm shrink-0" 
                        title={`${a.member?.fullname} (${a.progress_percentage}%)`}
                    >
                        {a.member?.avatar_url ? (
                            <img src={a.member.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-gray-600">{a.member?.fullname?.substring(0,1)}</span>
                        )}
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-300">
                             <div className="h-full bg-blue-500" style={{ width: `${a.progress_percentage}%` }} />
                        </div>
                    </div>
                ))}
                {assignments.length > 5 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 shadow-sm shrink-0">
                        +{assignments.length - 5}
                    </div>
                )}
            </div>

            {myAssignment && (
                <div className="bg-blue-50/40 rounded-md p-2 border border-blue-100/50">
                    {myAssignment.tracking_type === 'manual' ? (
                        <div className="flex items-center gap-2">
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="10"
                                value={myAssignment.progress_percentage || 0}
                                onChange={(e) => handleManualProgress(parseInt(e.target.value))}
                                disabled={updating}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-[10px] font-bold text-blue-700 min-w-[24px]">{myAssignment.progress_percentage}%</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {task.subtasks?.slice(0, 2).map(st => {
                                const isDone = myAssignment.completed_subtask_ids?.includes(st.id);
                                return (
                                    <div 
                                        key={st.id} 
                                        className="flex items-center gap-1.5 cursor-pointer group/st" 
                                        onClick={() => !updating && toggleSubtask(st.id)}
                                    >
                                        <div className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-colors ${isDone ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                            {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                                        </div>
                                        <span className={`text-[10px] truncate ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{st.text}</span>
                                    </div>
                                );
                            })}
                            {(task.subtasks?.length || 0) > 2 && (
                                <p className="text-[9px] text-gray-400 italic">+{task.subtasks!.length - 2} more subtasks</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
