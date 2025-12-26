import type { Member, PointsHistoryEntry, Poste } from "../types";
import supabase from "../../../utils/supabase";
import { ROLE_MANAGERS } from "../../../utils/roles";



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
            roles(name),
            birth_date,
            job_title,
            specialties,
            availability_days,
            availability_time,
            astrological_sign,
            preferred_social_media,
            social_media_link,
            preferred_committee,
            preferred_activity_type,
            preferred_meal,
            cotisation_status,
            strengths,
            weaknesses,
            personality_type,
            estimated_volunteering_hours,
            advisor_id,
            advisor:advisor_id(id, fullname, avatar_url),
            poste:poste_id(id, role_id, name)
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
        cotisation_status: item.cotisation_status || [false, false],
        is_validated: item.is_validated || false,
        points: item.points || 0,
        strengths: item.strengths || [],
        weaknesses: item.weaknesses || [],
        preferred_categories: item.preferred_categories || [],
        complaints: item.complaints || [],
        advisor: Array.isArray(item.advisor) ? item.advisor[0] : item.advisor,
        poste: Array.isArray(item.poste) ? item.poste[0] : item.poste
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
            ),
            job_title,
            specialties,
            availability_days,
            availability_time,
            astrological_sign,
            preferred_social_media,
            social_media_link,
            preferred_committee,
            preferred_activity_type,
            preferred_meal,
            personality_type,
            estimated_volunteering_hours,
            advisor_id,
            advisor:advisor_id(id, fullname, avatar_url),
            advisees:profiles!advisor_id(id, fullname, avatar_url),
            poste:poste_id(id, role_id, name)
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
        cotisation_status: data.cotisation_status || [false, false],
        is_validated: data.is_validated || false,
        points: data.points || 0,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        created_at: data.created_at,
        birth_date: data.birth_date,
        complaints: data.complaints || [], // Supabase returns relations as arrays
        job_title: data.job_title,
        specialties: data.specialties || [],
        availability_days: data.availability_days || [],
        availability_time: data.availability_time || 'matinal',
        astrological_sign: data.astrological_sign,
        preferred_social_media: data.preferred_social_media,
        social_media_link: data.social_media_link,
        preferred_committee: data.preferred_committee,
        preferred_activity_type: data.preferred_activity_type,
        preferred_meal: data.preferred_meal,
        personality_type: data.personality_type,
        estimated_volunteering_hours: data.estimated_volunteering_hours,
        advisor_id: data.advisor_id,
        advisor: (Array.isArray(data.advisor) ? data.advisor[0] : data.advisor) as Partial<Member>,
        advisees: (Array.isArray(data.advisees) ? data.advisees : (data.advisees ? [data.advisees] : [])) as Partial<Member>[],
        poste: (Array.isArray(data.poste) ? data.poste[0] : data.poste) as Poste
    };
};

export const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
        console.log('UpdateMember called with:', { id, updates });
        // 1. Get Current User & Permissions
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('roles(name)')
            .eq('id', user.id)
            .single();

        const rawRole = (currentUserProfile?.roles as any);
        const currentUserRole = (Array.isArray(rawRole) ? rawRole[0]?.name : rawRole?.name)?.toLowerCase() || 'member';
        
        const isHighLevel = ROLE_MANAGERS.includes(currentUserRole);
        const isEditingSelf = user.id === id;

        // Debug Log (Development only)
        console.log(`Update Attempt [Self: ${isEditingSelf}, Manager: ${isHighLevel}, Role: ${currentUserRole}]`);

        if (!isEditingSelf && !isHighLevel) {
            throw new Error('Unauthorized: You do not have permission to edit this profile');
        }

        // 2. Build Whitelisted Payload
        // We only allow these specific database columns to be sent
        const finalPayload: any = {};
        
        // Fields anybody can update on their OWN profile
        const selfFields = [
            'fullname', 'phone', 'birth_date', 'description', 'avatar_url', 
            'strengths', 'weaknesses', 'job_title', 'specialties', 
            'availability_days', 'availability_time', 'estimated_volunteering_hours',
            'astrological_sign', 'preferred_social_media', 'social_media_link',
            'preferred_committee', 'preferred_activity_type', 'preferred_meal', 'personality_type',
            'advisor_id', 'poste_id'
        ];
        
        // Fields ONLY high-level users can update
        const adminFields = ['points', 'is_validated', 'cotisation_status', 'is_banned'];

        // Process keys from the updates object
        Object.keys(updates).forEach(key => {
            const val = (updates as any)[key];
            
            if (isHighLevel) {
                // High level users can update almost anything (except meta fields like 'role')
                if ([...selfFields, ...adminFields].includes(key)) {
                    finalPayload[key] = val;
                }
            } else if (isEditingSelf) {
                // Regular users can only update their 'self' fields
                if (selfFields.includes(key)) {
                    finalPayload[key] = val;
                } else if (adminFields.includes(key)) {
                    console.warn(`Permission Denied: Role "${currentUserRole}" cannot update restricted field "${key}"`);
                }
            }
        });

        // 3. Special Case: Role Update
        if (updates.role && isHighLevel) {
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', updates.role)
                .single();
            if (roleData) finalPayload.role_id = roleData.id;
        }

        if (Object.keys(finalPayload).length === 0) {
            console.warn('Update Aborted: No valid changes provided for your permission level.');
            return null;
        }

        // 4. Points History Pre-check
        let oldPoints = 0;
        const pointsChanged = 'points' in finalPayload;
        if (pointsChanged) {
            const { data: current } = await supabase.from('profiles').select('points').eq('id', id).single();
            oldPoints = current?.points || 0;
        }

        // 5. Execute Database Update
        console.log('Executing update with payload:', finalPayload);
        const { data, error } = await supabase
            .from('profiles')
            .update(finalPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database Update Error:', error);
            throw new Error(`Cloud Update Failed: ${error.message}`);
        }

        // 6. Post-Update Tasks (Background)
        
        // Update Auth Metadata if editing self
        if (isEditingSelf && (finalPayload.fullname || finalPayload.avatar_url)) {
            supabase.auth.updateUser({
                data: {
                    fullname: finalPayload.fullname || user.user_metadata?.fullname,
                    avatar_url: finalPayload.avatar_url || user.user_metadata?.avatar_url
                }
            });
        }

        // Log Points History
        if (pointsChanged && data) {
            const diff = (data.points || 0) - oldPoints;
            if (diff !== 0) {
                supabase.from('points_history').insert({
                    member_id: id,
                    points: diff,
                    source_type: 'manual',
                    description: 'Manual adjustment via dashboard'
                }).then(({ error: hErr }) => {
                    if (hErr) console.error('History Log Error:', hErr);
                });
            }
        }

        return data;
    } catch (err: any) {
        console.error(`Update Service Failure [ID: ${id}]:`, err.message);
        throw err;
    }
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
 * Delete a category globally from the categories table
 */
export const deleteGlobalCategory = async (id: number): Promise<boolean> => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
    return true;
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
            member:profiles(fullname, avatar_url, roles(name), postes(name))
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
    // If data is null, the complaint didn't exist – we simply exit without throwing.
    // This prevents "Complaint not found" errors when the row is not returned due to policy.
    // No further action needed.

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

/**
 * Fetch all available postes for a specific role name
 */
export const getPostesByRole = async (roleName: string): Promise<Poste[]> => {
    // First get the role ID
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
