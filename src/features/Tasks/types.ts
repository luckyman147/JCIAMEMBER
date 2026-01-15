
export interface SubTaskDefinition {
    id: string;
    text: string;
}

export interface Task {
    id: string;
    title: string;
    points: number;
    team_id?: string; // Optional link to a team
    team?: { name: string }; // Joined team data
    description?: string;
    complexity?: 'lead' | 'major' | 'minor';
    subtasks?: SubTaskDefinition[]; // The defined points/subtasks
    status: 'todo' | 'in_progress' | 'completed';
    created_at: string;
    start_date?: string;
    deadline?: string;
    star_rating?: number;
    header_color?: string;
    attachments?: { name: string; url: string }[];
    assignments?: { member_id: string }[];
}

// The assignment of a task to a member
export interface MemberTask {
    id: string;
    task_id: string;
    member_id: string;
    
    // Denormalized/Joined task data for convenience
    task?: Task;
    
    status: 'todo' | 'in_progress' | 'completed';
    
    // Tracking method can be 'manual' or 'subtasks'
    tracking_type: 'manual' | 'subtasks';
    
    // For manual tracking
    progress_percentage: number;
    
    // For subtask tracking
    completed_subtask_ids: string[];
    star_rating?: number;
    
    assigned_at: string;
    updated_at: string;
}
