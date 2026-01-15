import supabase from "../../../utils/supabase";
import type { Poste } from "../types";

/**
 * Fetch all available roles
 */
export const getRoles = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('roles')
        .select('name');
    
    if (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
    return data.map((r: any) => r.name);
};

/**
 * Fetch all available roles with full details
 */
export const getAllRoles = async () => {
    const { data, error } = await supabase
        .from('roles')
        .select('id, name');
    
    if (error) {
        console.error('Error fetching detailed roles:', error);
        return [];
    }
    return data;
};

/**
 * Fetch all available postes for a specific role name
 */
export const getPostesByRole = async (roleName: string): Promise<Poste[]> => {
    const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();
    
    if (!roleData) return [];

    const { data, error } = await supabase
        .from('postes')
        .select('id, role_id, name')
        .eq('role_id', roleData.id)
        .order('name');
    
    if (error) {
        console.error(`Error fetching postes for role ${roleName}:`, error);
        return [];
    }
    return data || [];
};
/**
 * Create a new poste
 */
export const createPoste = async (name: string, roleId: string): Promise<Poste> => {
    const { data, error } = await supabase
        .from('postes')
        .insert({ name, role_id: roleId })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating poste:', error);
        throw error;
    }
    return data;
};

/**
 * Update an existing poste
 */
export const updatePoste = async (id: string, name: string): Promise<Poste> => {
    const { data, error } = await supabase
        .from('postes')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating poste:', error);
        throw error;
    }
    return data;
};

/**
 * Delete a poste and nullify it for all members
 */
export const deletePoste = async (id: string): Promise<void> => {
    // 1. Nullify poste_id for all members associated with this poste
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ poste_id: null })
        .eq('poste_id', id);

    if (updateError) {
        console.error('Error nullifying member postes:', updateError);
        throw updateError;
    }

    // 2. Delete the poste
    const { error: deleteError } = await supabase
        .from('postes')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('Error deleting poste:', deleteError);
        throw deleteError;
    }
};
