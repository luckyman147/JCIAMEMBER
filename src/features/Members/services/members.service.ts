import type { Member, PointsHistoryEntry } from "../types";
import supabase from "../../../utils/supabase";



export const getMembers = async (): Promise<Member[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, 
            fullname, 
            avatar_url, 
            email, 
            phone,
            is_validated,
            points,
            roles!inner(name)
        `);
        // We filter by role 'member' ideally, but here we fetch all and can filter in frontend or query
        // Assuming roles relation is set up. 

    if (error) {
        console.error('Error fetching members:', error);
        throw error;
    }

    // Map data to Member type (handling role nested object)
    return data.map((item: any) => ({
        ...item,
        role: item.roles?.name || 'member',
        // Ensure defaults
        cotisation_status: item.cotisation_status || { semester1: false, semester2: false },
        is_validated: item.is_validated || false,
        points: item.points || 0,
        preferred_categories: item.preferred_categories || [],
        complaints: item.complaints || []
    }));
};

export const getMemberById = async (id: string): Promise<Member | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, 
            fullname, 
            avatar_url, 
            email, 
            phone,
            roles(name),
            cotisation_status,
            is_validated,
            points,
            description,
            strengths,
            weaknesses,
            created_at,
            birth_date,
       
            complaints (
                id,
                member_id,
                content,
                status,
                created_at
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching member ${id}:`, error);
        return null;
    }

    return {
        ...data,
        role: (data.roles as any)?.name || 'member',
        cotisation_status: data.cotisation_status || { semester1: false, semester2: false },
        is_validated: data.is_validated || false,
        points: data.points || 0,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        created_at: data.created_at,
        birth_date: data.birth_date,
        complaints: data.complaints || [] // Supabase returns relations as arrays
    };
};

export const updateMember = async (id: string, updates: Partial<Member>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, complaints, ...updateData } = updates; // Exclude relation fields
    
    const finalUpdates: any = { ...updateData };

    // Get current user and their role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Fetch current user's role
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single();

    const currentUserRole = (currentUserProfile?.roles as any)?.name?.toLowerCase();
    const isPresident = currentUserRole === 'president';
    const isAdmin = currentUserRole === 'admin';
    const isHighLevel = isPresident || isAdmin;
    const isEditingSelf = user.id === id;

    // Define admin-only fields
    const adminFields = ['role_id', 'cotisation_status', 'is_validated', 'points'];

    // Filter updates based on permissions
    if (isEditingSelf && !isHighLevel) {
        // Regular user editing their own profile
        // Remove admin fields from updates
        adminFields.forEach(field => {
            if (field in finalUpdates) {
                delete finalUpdates[field];
                console.warn(`User attempted to update restricted field: ${field}`);
            }
        });
        
        // Also remove role from updates (it's handled separately)
        if (role) {
            console.warn('User attempted to update their own role');
        }
    } else if (isHighLevel && !isEditingSelf) {
        // High level user editing another user's profile
        // Only allow admin fields
        Object.keys(finalUpdates).forEach(field => {
            if (!adminFields.includes(field)) {
                delete finalUpdates[field];
            }
        });
    } else if (isHighLevel && isEditingSelf) {
        // High level user editing their own profile - allow all fields
        // No restrictions
    } else {
        // User trying to edit someone else's profile (not high level)
        throw new Error('Unauthorized: You can only edit your own profile');
    }

    // Handle birthday specifically: ensure it's mapped correctly
    if (updates.birth_date && (isEditingSelf || isHighLevel)) {
        finalUpdates.birth_date = updates.birth_date;
    }

    // Update Auth Metadata if this is the current user's profile
    if (user && user.id === id) {
        await supabase.auth.updateUser({
            data: {
                fullname: updates.fullname || user.user_metadata?.fullname,
                avatar_url: updates.avatar_url || user.user_metadata?.avatar_url
            }
        });
    }

    // Handle role updates (only for high level users)
    if (role && isHighLevel) {
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', role)
            .single();
        
        if (roleError) {
            console.error('Error resolving role:', roleError);
        } else if (roleData) {
            finalUpdates.role_id = roleData.id;
        }
    }
    
    // Check if we are updating points to handle history logging
    let oldPoints = 0;
    const pointsChanged = Object.prototype.hasOwnProperty.call(finalUpdates, 'points');

    if (pointsChanged) {
        // Fetch current points before update
        const { data: currentMember } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', id)
            .single();
        
        if (currentMember) {
            oldPoints = currentMember.points || 0;
        }
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating member ${id}:`, error);
        throw error;
    }

    // Log points change if applicable
    if (pointsChanged && data) {
        const newPoints = data.points || 0;
        const diff = newPoints - oldPoints;

        if (diff !== 0) {
            const { error: historyError } = await supabase
                .from('points_history')
                .insert({
                    member_id: id,
                    points: diff,
                    source_type: 'manual',
                    source_id: null,
                    description: 'Manual adjustment by administrator'
                });
            
            if (historyError) {
                console.error('Error logging points history:', historyError);
            }
        }
    }

    return data;
};

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

export const getMemberRank = async (points: number): Promise<number> => {
    // Count members with strictly more points
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('points', points);

    if (error) {
        console.error('Error calculating rank:', error);
        return 0;
    }

    // Rank is count + 1 (e.g., if 0 people have more points, you are 1st)
    return (count || 0) + 1;
};

export const addComplaint = async (memberId: string, content: string) => {
    const { data, error } = await supabase
        .from('complaints')
        .insert({
            member_id: memberId,
            content: content,
            status: 'pending' // default
        })
        .select()
        .single();
    
    if (error) {
        throw error;
    }
    return data;
}

// ==================== CATEGORY FUNCTIONS ====================

export interface Category {
    id: number;
    name: string;
}

/**
 * Fetch all available categories from the categories table
 */
export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
    
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data || [];
};

/**
 * Fetch categories for a specific profile via the junction table
 */
export const getProfileCategories = async (profileId: string): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('profile_categories')
        .select(`
            category_id,
            categories (
                id,
                name
            )
        `)
        .eq('profile_id', profileId);
    
    if (error) {
        console.error('Error fetching profile categories:', error);
        return [];
    }
    
    // Extract the category objects from the nested response
    return data?.map((item: any) => item.categories).filter(Boolean) || [];
};

/**
 * Add a category to a profile (insert into junction table)
 */
export const addProfileCategory = async (profileId: string, categoryId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('profile_categories')
        .insert({
            profile_id: profileId,
            category_id: categoryId
        });
    
    if (error) {
        // Ignore duplicate key errors (category already added)
        if (error.code === '23505') {
            console.warn('Category already added to profile');
            return true;
        }
        console.error('Error adding category to profile:', error);
        throw error;
    }
    return true;
};

/**
 * Remove a category from a profile (delete from junction table)
 */
export const removeProfileCategory = async (profileId: string, categoryId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('profile_categories')
        .delete()
        .eq('profile_id', profileId)
        .eq('category_id', categoryId);
    
    if (error) {
        console.error('Error removing category from profile:', error);
        throw error;
    }
    return true;
};

/**
 * Create a new category in the categories table
 */
export const createCategory = async (name: string): Promise<Category | null> => {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name: name.trim() })
        .select('id, name')
        .single();
    
    if (error) {
        // Handle duplicate name error
        if (error.code === '23505') {
            console.warn('Category with this name already exists');
            throw new Error('Category already exists');
        }
        console.error('Error creating category:', error);
        throw error;
    }
    return data;
};

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
 * Fetch points history for ALL members
 */
export const getAllPointsHistory = async () => {
    const { data, error } = await supabase
        .from('points_history')
        .select(`
            id, 
            points, 
            created_at, 
            member_id,
            member:profiles(fullname, avatar_url)
        `)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching all points history:', error);
        return [];
    }
    return data;
};

/**
 * Delete a member profile
 */
export const deleteMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error(`Error deleting member ${memberId}:`, error);
        throw error;
    }
};

