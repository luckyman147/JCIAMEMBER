import type { Member, Poste } from "../types";
import supabase from "../../../utils/supabase";
import { ROLE_MANAGERS } from "../../../utils/roles";
import { pointsService } from "./pointsService";

// Export sub-services for easier access
export * from "./categories.service";
export * from "./complaints.service";
export * from "./roles.service";
export * from "./points_history.service";

/**
 * Helper to extract the latest JPS snapshot data
 */
const getLatestJpsInfo = (snapshots: any[] = []) => {
    if (!snapshots || snapshots.length === 0) return { score: 0, category: 'Observer' };
    
    const latest = [...snapshots].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    })[0];

    return {
        score: latest?.score || 0,
        category: latest?.category || 'Observer'
    };
};

/**
 * Fetch all member profiles with computed JPS scores
 */
export const getMembers = async (): Promise<Member[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, fullname, avatar_url, email, phone, is_validated, points,
            roles(name), birth_date, job_title, specialties,
            availability_days, availability_time, astrological_sign,
            preferred_social_media, social_media_link, preferred_committee,
            preferred_activity_type, preferred_meal, cotisation_status,
            strengths, weaknesses, personality_type, estimated_volunteering_hours,
            advisor_id, advisor:advisor_id(id, fullname, avatar_url),
            poste:poste_id(id, role_id, name),
            jps_snapshots(score, category, month, year)
        `);

    if (error) {
        console.error('Error fetching members:', error);
        throw error;
    }

    return data.map((item: any) => {
        const jpsInfo = getLatestJpsInfo(item.jps_snapshots);
        return {
            ...item,
            role: item.roles?.name || 'member',
            cotisation_status: item.cotisation_status || [false, false],
            is_validated: item.is_validated || false,
            points: item.points || 0,
            strengths: item.strengths || [],
            weaknesses: item.weaknesses || [],
            advisor: Array.isArray(item.advisor) ? item.advisor[0] : item.advisor,
            poste: Array.isArray(item.poste) ? item.poste[0] : item.poste,
            jps_score: jpsInfo.score,
            jps_category: jpsInfo.category
        };
    });
};

/**
 * Fetch a single member by ID with full details
 */
export const getMemberById = async (id: string): Promise<Member | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, fullname, avatar_url, email, phone, roles(name),
            cotisation_status, is_validated, points, description,
            strengths, weaknesses, created_at, birth_date,
            complaints (id, content, status, created_at,member_id),
            job_title, specialties, availability_days, availability_time,
            astrological_sign, preferred_social_media, social_media_link,
            preferred_committee, preferred_activity_type, preferred_meal,
            personality_type, estimated_volunteering_hours, advisor_id,
            advisor:advisor_id(id, fullname, avatar_url),
            advisees:profiles!advisor_id(id, fullname, avatar_url),
            poste:poste_id(id, role_id, name),
            jps_snapshots(score, category, month, year)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching member ${id}:`, error);
        return null;
    }

    const jpsInfo = getLatestJpsInfo(data.jps_snapshots);

    return {
        ...data,
        role: (data.roles as any)?.name || 'member',
        cotisation_status: data.cotisation_status || [false, false],
        is_validated: data.is_validated || false,
        points: data.points || 0,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        complaints: data.complaints || [],
        specialties: data.specialties || [],
        availability_days: data.availability_days || [],
        availability_time: data.availability_time || 'matinal',
        advisor: (Array.isArray(data.advisor) ? data.advisor[0] : data.advisor) as Partial<Member>,
        advisees: (Array.isArray(data.advisees) ? data.advisees : (data.advisees ? [data.advisees] : [])) as Partial<Member>[],
        poste: (Array.isArray(data.poste) ? data.poste[0] : data.poste) as Poste,
        jps_score: jpsInfo.score,
        jps_category: jpsInfo.category
    };
};

/**
 * Update member profile with role-based validation
 */
export const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
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

        if (!isEditingSelf && !isHighLevel) {
            throw new Error('Unauthorized: You do not have permission to edit this profile');
        }

        const finalPayload: any = {};
        const selfFields = [
            'fullname', 'phone', 'birth_date', 'description', 'avatar_url', 
            'strengths', 'weaknesses', 'job_title', 'specialties', 
            'availability_days', 'availability_time', 'estimated_volunteering_hours',
            'astrological_sign', 'preferred_social_media', 'social_media_link',
            'preferred_committee', 'preferred_activity_type', 'preferred_meal', 'personality_type',
            'advisor_id', 'poste_id'
        ];
        const adminFields = ['is_validated', 'cotisation_status', 'is_banned'];

        let newPointsValue: number | undefined = undefined;
        
        Object.keys(updates).forEach(key => {
            const val = (updates as any)[key];
            if (isHighLevel) {
                if (key === 'points') {
                    newPointsValue = val;
                } else if ([...selfFields, ...adminFields].includes(key)) {
                    finalPayload[key] = val;
                }
            } else if (isEditingSelf && selfFields.includes(key)) {
                finalPayload[key] = val;
            }
        });

        // Special case: Role update requires finding role_id
        if (updates.role && isHighLevel) {
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', updates.role)
                .single();
            if (roleData) finalPayload.role_id = roleData.id;
        }

        // Points update via helper service to ensure history log
        if (newPointsValue !== undefined && isHighLevel) {
            const { data: current } = await supabase.from('profiles').select('points').eq('id', id).single();
            const diff = newPointsValue - (current?.points || 0);
            if (diff !== 0) {
                await pointsService.triggerPointsHistory(id, diff, 'Manual adjustment via service', 'manual');
            }
        }

        // If no non-points fields to update, just return the member
        if (Object.keys(finalPayload).length === 0) {
            const { data } = await supabase.from('profiles').select().eq('id', id).single();
            return data;
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(finalPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Update failed: ${error.message}`);

        // Update auth metadata if changing own details
        if (isEditingSelf && (finalPayload.fullname || finalPayload.avatar_url)) {
            supabase.auth.updateUser({
                data: {
                    fullname: finalPayload.fullname || user.user_metadata?.fullname,
                    avatar_url: finalPayload.avatar_url || user.user_metadata?.avatar_url
                }
            });
        }

        return data;
    } catch (err: any) {
        console.error(`Update Service Failure [ID: ${id}]:`, err.message);
        throw err;
    }
};

/**
 * Calculate member rank position
 */
export const getMemberRank = async (points: number): Promise<number> => {
    const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('points', points);

    if (error) return 0;
    return (count || 0) + 1;
};

/**
 * Delete a profile
 */
export const deleteMember = async (memberId: string): Promise<void> => {
    const { error } = await supabase.from('profiles').delete().eq('id', memberId);
    if (error) throw error;
};
