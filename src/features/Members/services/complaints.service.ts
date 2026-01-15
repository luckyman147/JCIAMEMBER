import supabase from "../../../utils/supabase";

/**
 * Add a new complaint for a member
 */
export const addComplaint = async (memberId: string, content: string) => {
    const { data, error } = await supabase
        .from('complaints')
        .insert({
            member_id: memberId,
            content: content,
            status: 'pending'
        })
        .select()
        .single();
    
    if (error) {
        throw error;
    }
    return data;
};

/**
 * Fetch ALL complaints from all members
 */
export const getAllComplaints = async (): Promise<any[]> => {
    const { data, error } = await supabase
        .from('complaints')
        .select(`
            id,
            content,
            status,
            created_at,
            member_id,
            profiles(fullname, avatar_url)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all complaints:', error);
        throw error;
    }
    return data || [];
};

/**
 * Update the status of a complaint
 */
export const updateComplaintStatus = async (id: string, status: 'pending' | 'resolved'): Promise<void> => {
    const { error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error updating complaint status:', error);
        throw error;
    }
};

/**
 * Delete a complaint
 */
export const deleteComplaint = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting complaint:', error);
        throw error;
    }
};
