
import supabase from "../../../utils/supabase";
import type { MemberTask, Task, SubTaskDefinition } from "../types";

export const getTasksForMember = async (memberId: string): Promise<MemberTask[]> => {
    const { data, error } = await supabase
        .from('member_tasks')
        .select(`
            *,
            *,
            task:tasks (
                *,
                team:teams (name)
            )
        `)
        .eq('member_id', memberId)
        // Order by assigned_at desc
        .order('assigned_at', { ascending: false });

    if (error) {
        console.error('Error fetching member tasks:', error);
        return [];
    }

    return data as MemberTask[];
};

export const getAllMemberTasks = async (): Promise<MemberTask[]> => {
    const { data, error } = await supabase
        .from('member_tasks')
        .select(`
            *,
            task:tasks (*)
        `);

    if (error) {
        console.error('Error fetching all member tasks:', error);
        return [];
    }

    return data as MemberTask[];
};

export const getAllTasks = async (): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            team:teams (name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all tasks:', error);
        return [];
    }

    return data as Task[];
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task | null> => {
    const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating task:', error);
        throw error;
    }
    return data;
};

export const assignTaskToMember = async (memberId: string, taskId: string, initialTrackingType: 'manual' | 'subtasks'): Promise<MemberTask | null> => {
    const { data, error } = await supabase
        .from('member_tasks')
        .insert({
            member_id: memberId,
            task_id: taskId,
            status: 'todo',
            progress_percentage: 0,
            completed_subtask_ids: [],
            tracking_type: initialTrackingType
        })
        .select(`
            *,
            task:tasks (*)
        `)
        .single();

    if (error) {
        console.error('Error assigning task:', error);
        throw error;
    }
    return data;
};

export const unassignTaskFromMember = async (memberId: string, taskId: string): Promise<void> => {
    const { error } = await supabase
        .from('member_tasks')
        .delete()
        .eq('member_id', memberId)
        .eq('task_id', taskId);

    if (error) {
        console.error('Error unassigning task:', error);
        throw error;
    }
};

// Convenience: Create Task and Assign in one go
export const createAndAssignTask = async (
    memberId: string, 
    taskData: Omit<Task, 'id' | 'created_at'>,
    trackingType: 'manual' | 'subtasks'
): Promise<MemberTask | null> => {
    // 1. Create Task
    const newTask = await createTask(taskData);
    if (!newTask) return null;

    // 2. Assign
    return assignTaskToMember(memberId, newTask.id, trackingType);
};

export const updateMemberTask = async (id: string, updates: Partial<MemberTask>) => {
    const { data, error } = await supabase
        .from('member_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating member task:', error);
        throw error;
    }
    return data;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        throw error;
    }
    return data;
};

export const deleteTask = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};
export const completeAllTaskAssignments = async (taskId: string, subtasks: SubTaskDefinition[] = []): Promise<void> => {
    // 1. Update all member_tasks for this task
    const subtaskIds = subtasks.map(sh => sh.id);
    
    const { error } = await supabase
        .from('member_tasks')
        .update({
            status: 'completed',
            progress_percentage: 100,
            completed_subtask_ids: subtaskIds
        })
        .eq('task_id', taskId);

    if (error) {
        console.error(`Error completing assignments for task ${taskId}:`, error);
        throw error;
    }
};
