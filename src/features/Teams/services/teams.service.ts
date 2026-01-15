
import supabase from "../../../utils/supabase";
import type { Team } from "../types";

// --- Team CRUD ---

export const getTeams = async (userId?: string): Promise<Team[]> => {
    // Fetch teams. If userId provided, we could verify membership, but for now let's just get all
    // and let UI map "isJoined" status if complex query needed. 
    // Ideally, we start with simple fetch.
    
    const { data, error } = await supabase
        .from('teams')
        .select(`
            *,
            team_members!left (member_id)
        `)
        .is('project_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching teams:', error);
        return [];
    }

    return data.map((team: any) => ({
        ...team,
        member_count: team.team_members?.length || 0,
        is_member: userId ? team.team_members.some((tm: any) => tm.member_id === userId) : false
    }));
};

export const getTeamById = async (id: string): Promise<Team | null> => {
    const { data, error } = await supabase
        .from('teams')
        .select(`
            *,
            members:team_members (
                *,
                member:profiles (*)
            )
        `)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error(`Error fetching team ${id}:`, error);
        return null;
    }
    
    return data;
};

export const updateTeam = async (id: string, updates: Partial<Team>): Promise<Team | null> => {
    if (!id) {
        console.error("updateTeam: No ID provided");
        throw new Error("Team ID is required for updating");
    }

    const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        console.error(`Error updating team ${id}:`, error);
        throw error;
    }

    if (!data || data.length === 0) {
        throw new Error("Update failed: No rows affected. Check your permissions (RLS) or verify the Team ID.");
    }

    return data[0];
};

export const createTeam = async (team: Partial<Team>): Promise<Team | null> => {
    // 1. Create Team
    const { data: newTeam, error } = await supabase
        .from('teams')
        .insert(team)
        .select()
        .single();

    if (error) {
        console.error('Error creating team:', error);
        throw error;
    }

    // 2. Add creator as Admin
    if (newTeam && newTeam.created_by) {
        await addTeamMember(newTeam.id, newTeam.created_by, 'admin');
    }

    return newTeam;
};

// --- Membership ---

export const addTeamMember = async (
    teamId: string, 
    memberId: string, 
    role: 'member' | 'admin' | 'lead' = 'member',
    options?: { custom_title?: string, permissions?: string[] }
): Promise<boolean> => {
    const { error } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            member_id: memberId,
            role,
            custom_title: options?.custom_title,
            permissions: options?.permissions
        });

    if (error) {
        console.error('Error adding team member:', error);
        throw error;
    }
    return true;
};

export const updateTeamMember = async (
    teamId: string, 
    memberId: string, 
    updates: { role?: 'member' | 'admin' | 'lead', custom_title?: string, permissions?: string[] }
): Promise<boolean> => {
    const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('team_id', teamId)
        .eq('member_id', memberId);

    if (error) {
        console.error('Error updating team member:', error);
        throw error;
    }
    return true;
};

export const joinTeam = async (teamId: string, memberId: string): Promise<boolean> => {
    // This relies on RLS policy "Join public teams..."
    return addTeamMember(teamId, memberId, 'member');
};

export const leaveTeam = async (teamId: string, memberId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('member_id', memberId);

    if (error) {
        console.error('Error leaving team:', error);
        throw error;
    }
    return true;
};

export const deleteTeam = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting team ${id}:`, error);
        throw error;
    }
};

// --- Team Tasks ---

// Fetch tasks associated with a team (defined at team level)
export const getTeamTasks = async (teamId: string) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching team tasks:', error);
        return [];
    }
    return data;
};

// Fetch assignments of a specific task within the team
export const getTaskAssignments = async (taskId: string) => {
     const { data, error } = await supabase
        .from('member_tasks')
        .select(`
            *,
            member:profiles(fullname, avatar_url)
        `)
        .eq('task_id', taskId);
    
    if (error) throw error;
    return data;
};

// Fetch teams that a specific member belongs to
export const getMemberTeams = async (memberId: string): Promise<Team[]> => {
    const { data, error } = await supabase
        .from('team_members')
        .select(`
            team_id,
            role,
            team:teams (*)
        `)
        .eq('member_id', memberId);

    if (error) {
        console.error('Error fetching member teams:', error);
        return [];
    }

    // Flatten structure
    return data.map((item: any) => ({
        ...item.team,
        my_role: item.role,
        is_member: true
    }));
};
