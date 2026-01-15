
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Task } from "../../../Tasks/types";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
    column: { id: string; title: string; color: string };
    tasks: Task[];
    isAdmin?: boolean;
    currentUserId?: string;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onAddNew: (status: any) => void;
    onUpdate: () => void;
    onClickDetail?: (task: Task) => void;
}

export const KanbanColumn = ({ 
    column, 
    tasks, 
    isAdmin, 
    currentUserId, 
    onEdit, 
    onDelete, 
    onAddNew,
    onUpdate,
    onClickDetail
}: KanbanColumnProps) => {
    const columnTasks = tasks.filter(t => (t.status || 'todo') === column.id);

    return (
        <div className="w-full lg:min-w-[320px] bg-gray-50/50 rounded-2xl flex flex-col border border-gray-100">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${column.color}`}>
                        {column.title}
                    </h3>
                    <span className="text-xs font-bold text-gray-400">
                        {columnTasks.length}
                    </span>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => onAddNew(column.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <Droppable droppableId={column.id}>
                {(provided) => (
                    <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 overflow-y-auto p-3 space-y-3"
                    >
                        {columnTasks.map((task, index) => {
                            const canDrag = isAdmin || task.assignments?.some(a => a.member_id === currentUserId);
                            
                            return (
                                <Draggable 
                                    key={task.id} 
                                    draggableId={task.id} 
                                    index={index}
                                    isDragDisabled={!canDrag}
                                >
                                    {(draggableProvided) => (
                                        <TaskCard 
                                            task={task} 
                                            isKanban={true} 
                                            isAdmin={isAdmin}
                                            currentUserId={currentUserId}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onUpdate={onUpdate}
                                            onClickDetail={onClickDetail}
                                            provided={draggableProvided}
                                            canDrag={canDrag}
                                        />
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
