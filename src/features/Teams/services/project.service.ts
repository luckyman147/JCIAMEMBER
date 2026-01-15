import supabase from "../../../utils/supabase";
import type { Project } from "../types";

export const getProjects = async (): Promise<Project[]> => {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            teams (*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data;
};

export const createProject = async (project: { name: string, description?: string, leader_id?: string, teams?: string[] }): Promise<Project | null> => {
    const { name, description, leader_id, teams: teamNames } = project;
    
    const { data: newProject, error } = await supabase
        .from('projects')
        .insert({ name, description, leader_id })
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }

    if (newProject) {
        // 1. Add creator to project_members as admin
        if (leader_id) {
            const { error: memberError } = await supabase
                .from('project_members')
                .insert({
                    project_id: newProject.id,
                    member_id: leader_id,
                    role: 'admin'
                });
            
            if (memberError) {
                console.error('Error adding creator to project members:', memberError);
            }
        }

        // 2. Create custom or default teams
        const teamsToCreate = teamNames && teamNames.length > 0 
            ? teamNames 
            : ['Media', 'Sponsoring', 'Programme', 'Logistics'];

        const teamInserts = teamsToCreate.map(name => ({
            name,
            description: `${name} team for ${newProject.name}`,
            project_id: newProject.id,
            created_by: leader_id,
            is_public: false
        }));

        const { error: teamError } = await supabase
            .from('teams')
            .insert(teamInserts);
        
        if (teamError) {
             console.error('Error creating teams:', teamError);
        }
    }

    return newProject;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw error;
    }
    return data;
};

export const deleteProject = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
    return true;
};

export const getProjectMembers = async (projectId: string) => {
    const { data, error } = await supabase
        .from('project_members')
        .select(`
            *,
            member:profiles (*)
        `)
        .eq('project_id', projectId);
    
    if (error) {
        console.error('Error fetching project members:', error);
        return [];
    }

    // Flatten structure to match Member interface partially or return as ProjectMember
    return data.map((pm: any) => ({
        ...pm.member, // Member details
        project_role: pm.role, // Project specific role
        project_joined_at: pm.joined_at
    })); 
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            teams (
                *,
                team_members (count)
            )
        `)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    // Fetch members separately to avoid join issues
    const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
            *,
            member:profiles (*)
        `)
        .eq('project_id', id);

    if (membersError) {
         console.error('Error fetching project members:', membersError);
    }

    // Map team member counts
    const teams = data.teams.map((t: any) => ({
        ...t,
        member_count: t.team_members?.[0]?.count || 0
    }));

    return { ...data, teams, members: membersData || [] };
};

export const addProjectMember = async (projectId: string, memberId: string, role: 'member' | 'admin' = 'member'): Promise<boolean> => {
    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            member_id: memberId,
            role
        });

    if (error) {
        console.error('Error adding project member:', error);
        throw error;
    }
    return true;
};

export const removeProjectMember = async (projectId: string, memberId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('member_id', memberId);

    if (error) {
        console.error('Error removing project member:', error);
        throw error;
    }
    return true;
};
