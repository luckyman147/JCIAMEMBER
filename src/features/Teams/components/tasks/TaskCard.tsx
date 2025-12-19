
import type { Task } from "../../../Tasks/types";
import { Edit2, Trash2, GripVertical } from "lucide-react";
import { TaskAssignmentsPreview } from "./TaskAssignmentsPreview";

interface TaskCardProps {
    task: Task;
    isKanban: boolean;
    isAdmin?: boolean;
    currentUserId?: string;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onUpdate: () => void;
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
    provided,
    canDrag = true 
}: TaskCardProps) => (
    <div 
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={`
            bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group
            ${isKanban ? 'mb-3' : 'mb-0'}
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
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{task.description}</p>
                
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
                    <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
                {isAdmin && (
                    <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
