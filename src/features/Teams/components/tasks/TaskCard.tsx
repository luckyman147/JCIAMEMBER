import type { Task } from "../../../Tasks/types";
import { Edit2, Trash2, GripVertical, Calendar, Clock } from "lucide-react";
import { TaskAssignmentsPreview } from "./TaskAssignmentsPreview";

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
        now.setHours(0, 0, 0, 0); // Start of today
        return d > new Date(0) && d < now;
    } catch (e) {
        return false;
    }
};

interface TaskCardProps {
    task: Task;
    isKanban: boolean;
    isAdmin?: boolean;
    currentUserId?: string;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onUpdate: () => void;
    onClickDetail?: (task: Task) => void;
    provided?: any;
    canDrag?: boolean;
}

export const TaskCard = ({ 
    task, 
    isKanban, 
    isAdmin, 
    currentUserId, 
    onEdit, 
    onDelete, 
    onUpdate,
    onClickDetail,
    provided,
    canDrag = true 
}: TaskCardProps) => (
    <div 
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        onClick={() => onClickDetail?.(task)}
        className={`
            bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer
            ${isKanban ? 'mb-3' : 'mb-3'}
            ${!canDrag ? 'cursor-default' : ''}
        `}
    >
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate text-sm">{task.title}</h4>
                    {task.points > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                            {task.points} pts
                        </span>
                    )}
                    {task.status && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                            {task.status}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{task.description}</p>
                
                <div className="flex flex-wrap gap-3 items-center">
                    {task.start_date && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(task.start_date)}</span>
                        </div>
                    )}
                    {task.deadline && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            task.status !== 'completed' && isExpired(task.deadline)
                                ? 'bg-red-50 text-red-600 ring-1 ring-red-100' 
                                : 'text-gray-400'
                        }`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(task.deadline)}</span>
                            {task.status !== 'completed' && isExpired(task.deadline) && (
                                <span className="ml-1 bg-red-600 text-white px-1 rounded text-[8px] uppercase tracking-tighter shadow-sm">Expired</span>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50">
                    <TaskAssignmentsPreview 
                        taskId={task.id} 
                        task={task} 
                        currentUserId={currentUserId} 
                        onUpdate={onUpdate} 
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(isAdmin || task.assignments?.some(a => a.member_id === currentUserId)) && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
                {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
                {isKanban && canDrag && (
                    <div className="mt-2 text-gray-300">
                        <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                    </div>
                )}
            </div>
        </div>
    </div>
);
