import supabase from "../../../utils/supabase";
import type { PointsHistoryEntry } from "../types";

/**
 * Fetch points history for a specific member
 */
export const getPointsHistory = async (memberId: string): Promise<PointsHistoryEntry[]> => {
    const { data, error } = await supabase
        .from('points_history')
        .select('id, points, source_type, description, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching points history:', error);
        return [];
    }
    return data;
};

/**
 * Fetch points history for ALL members (for administrative use)
 */
export const getAllPointsHistory = async () => {
    const { data, error } = await supabase
        .from('points_history')
        .select(`
            id, 
            points, 
            created_at, 
            member_id,
            member:profiles(fullname, avatar_url, roles(name), postes(name))
        `)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching all points history:', error);
        return [];
    }
    return data;
};
