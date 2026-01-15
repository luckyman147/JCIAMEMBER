
import type { Task } from "../Tasks/types";
import type { Member } from "../Members/types";

// Project definition
export interface Project {
    id: string;
    name: string;
    description?: string;
    leader_id?: string;
    created_at: string;
    teams?: Team[];
    members?: ProjectMember[];
    is_member?: boolean;
}

export interface ProjectMember {
    id: string;
    project_id: string;
    member_id: string;
    role: 'member' | 'admin';
    joined_at: string;
    member?: Member;
}

export interface TeamResource {
    title: string;
    url: string;
    type: 'link' | 'file';
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    is_public: boolean;
    created_by: string;
    activity_id?: string;
    project_id?: string;
    strategy?: string;
    resources?: TeamResource[];
    created_at: string;
    
    // UI/Joined helpers
    member_count?: number; 
    members?: TeamMember[];
    is_member?: boolean; // Current user is member?
    my_role?: 'member' | 'admin' | 'lead';
}

export interface TeamMember {
    id: string;
    team_id: string;
    member_id: string;
    role: 'member' | 'admin' | 'lead';
    joined_at: string;
    
    // Extended permissions and titles
    custom_title?: string;
    permissions?: string[];

    // Joined profile
    member?: Member; 
}

// Helper to extend Task with team info if needed
export type TeamTask = Task & {
    team_id?: string;
}
