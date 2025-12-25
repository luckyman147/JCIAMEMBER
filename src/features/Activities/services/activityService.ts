import supabase from '../../../utils/supabase'
import type { Activity, ActivityType, EventActivity, FormationActivity, MeetingActivity } from '../models/Activity'
import type { ActivityFilterDTO, CreateActivityDTO, UpdateActivityDTO } from '../dto/ActivityDTOs'

export const activityService = {
  /**
   * Fetch activities with optional filters
   */
  getActivities: async (filters?: ActivityFilterDTO) => {
    let query = supabase
      .from('activities')
      .select('*, activity_participants(count)')
      .order('activity_begin_date', { ascending: true })

    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.is_online !== undefined) {
        query = query.eq('is_online', filters.is_online)
      }
      if (filters.is_paid !== undefined) {
        query = query.eq('is_paid', filters.is_paid)
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }
      if (filters.startDate) {
        query = query.gte('activity_begin_date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('activity_end_date', filters.endDate)
      }
    }

    const { data, error } = await query
    
    if (error) throw error
    return data as Activity[]
  },

  /**
   * Fetch a single activity by ID
   */
  getActivityById: async (id: string): Promise<Activity> => {
    console.log('[activityService] Fetching activity with ID:', id);

    // 1. Fetch parent (base activity fields)
    const { data: parent, error: parentErr } = await supabase
      .from('activities')
      .select('*, activity_participants(count)')
      .eq('id', id)
      .maybeSingle()

    if (parentErr) {
        console.error('[activityService] Parent fetch error:', parentErr);
        throw parentErr;
    }

    if (!parent) {
      console.warn('[activityService] Activity not found for ID:', id);
      throw new Error(`Activity not found: ${id}`);
    }

    const type: ActivityType = parent.type;

    // 2. Detect correct child table
    const childTable =
      type === 'event' ? 'events' :
      type === 'meeting' ? 'meetings' :
      'formations';

    // 3. Fetch child table row
    const { data: child, error: childErr } = await supabase
      .from(childTable)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (childErr) {
        console.error('[activityService] Child fetch error:', childErr);
        throw childErr;
    }

    // 4. Merge parent + child into final typed object
    // If child is missing (shouldn't happen but let's be safe), use empty object
    const merged = { ...parent, ...(child || {}) };

    // 5. Cast to correct TypeScript type using discriminated union
    if (type === 'event') {
      return merged as EventActivity;
    }
    if (type === 'meeting') {
      return merged as MeetingActivity;
    }
    return merged as FormationActivity;
  },
  /**
   * Create a new activity
   */
  createActivity: async (activity: CreateActivityDTO) => {
    // 1) Prepare base activity data (exclude child-specific fields)
    const baseActivity = {
      name: activity.name,
      description: activity.description,
      type: activity.type,
      activity_address: activity.activity_address,
      is_online: activity.is_online,
      online_link: activity.online_link,
      activity_begin_date: activity.activity_begin_date,
      activity_end_date: activity.activity_end_date,
      activity_points: activity.activity_points,
      is_paid: activity.is_paid,
      price: activity.price,
      is_public: activity.is_public,
      image_url: activity.image_url,
      recap_images: activity.recap_images,
      leader_id: activity.leader_id,
    }

    // 2) Insert parent
    const { data: parent, error: parentErr } = await supabase
      .from('activities')
      .insert(baseActivity)
      .select()
      .single()

    if (parentErr) throw parentErr
    console.log(parent)
    console.log(activity.type)

    // 3) Insert child record based on type
    switch (activity.type) {
      case 'event': {
        const { error: eventErr } = await supabase.from('events').insert({
          id: parent.id,
          ...(activity.registration_deadline !== undefined && {
            registration_deadline: activity.registration_deadline,
          }),
        })
        if (eventErr) {
          console.error('Error inserting event:', eventErr)
          throw new Error(`Failed to create event: ${eventErr.message}`)
        }
        break
      }

      case 'meeting': {
        const { error: meetingErr } = await supabase.from('meetings').insert({
          id: parent.id,
          meeting_plan: activity.meeting_plan ?? null,
          pv_attachments: activity.pv_attachments ?? null,
        })
        if (meetingErr) {
          console.error('Error inserting meeting:', meetingErr)
          throw new Error(`Failed to create meeting: ${meetingErr.message}`)
        }
        break
      }

      case 'formation': {
        const { error: formationErr } = await supabase.from('formations').insert({
          id: parent.id,
          trainer_name: activity.trainer_name ?? null,
          course_attachment: activity.course_attachment ?? null,
          registration_deadline: activity.registration_deadline ?? null,
        })
        if (formationErr) {
          console.error('Error inserting formation:', formationErr)
          throw new Error(`Failed to create formation: ${formationErr.message}`)
        }
        break
      }
    }

    return parent as Activity
  },

  /**
   * Update an activity
   */
  updateActivity: async (id: string, updates: UpdateActivityDTO) => {
    // 1) Prepare base activity updates (exclude child-specific fields)
    const baseUpdates: any = {}
    const baseFields = [
      'name', 'description', 'type', 'activity_address', 'is_online', 'online_link',
      'activity_begin_date', 'activity_end_date', 'activity_points', 'is_paid',
      'price', 'is_public', 'image_url', 'recap_images', 'leader_id'
    ]

    for (const key of baseFields) {
      if (key in updates && (updates as any)[key] !== undefined) {
        baseUpdates[key] = (updates as any)[key]
      }
    }

    // 2) Update parent if there are base updates
    let parent = null
    if (Object.keys(baseUpdates).length > 0) {
      const { data, error: parentErr } = await supabase
        .from('activities')
        .update(baseUpdates)
        .eq('id', id)
        .select()
        .single()

      if (parentErr) throw parentErr
      parent = data
    }

    // 3) Update child record based on type
    if (updates.type === 'event' || (!updates.type && parent?.type === 'event')) {
      // Extract event-specific fields
      const eventUpdates: any = {}
      if ('registration_deadline' in updates && updates.registration_deadline !== undefined) {
        eventUpdates.registration_deadline = updates.registration_deadline
      }
      if (Object.keys(eventUpdates).length > 0) {
        await supabase.from('events').update(eventUpdates).eq('id', id)
      }
    } else if (updates.type === 'meeting' || (!updates.type && parent?.type === 'meeting')) {
      // Extract meeting-specific fields
      const meetingUpdates: any = {}
      if ('meeting_plan' in updates && updates.meeting_plan !== undefined) {
        meetingUpdates.meeting_plan = updates.meeting_plan
      }
      if ('pv_attachments' in updates && updates.pv_attachments !== undefined) {
        meetingUpdates.pv_attachments = updates.pv_attachments
      }
      if (Object.keys(meetingUpdates).length > 0) {
        await supabase.from('meetings').update(meetingUpdates).eq('id', id)
      }
    } else if (updates.type === 'formation' || (!updates.type && parent?.type === 'formation')) {
      // Extract formation-specific fields
      const formationUpdates: any = {}
      if ('trainer_name' in updates && updates.trainer_name !== undefined) {
        formationUpdates.trainer_name = updates.trainer_name
      }
      if ('course_attachment' in updates && updates.course_attachment !== undefined) {
        formationUpdates.course_attachment = updates.course_attachment
      }
      if ('registration_deadline' in updates && updates.registration_deadline !== undefined) {
        formationUpdates.registration_deadline = updates.registration_deadline
      }
      if (Object.keys(formationUpdates).length > 0) {
        await supabase.from('formations').update(formationUpdates).eq('id', id)
      }
    }

    // Return the full updated activity
    return activityService.getActivityById(id)
  },

  /**
   * Delete an activity
   */
  deleteActivity: async (id: string) => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Activity Participants
   */
  getParticipations: async (activityId: string) => {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        *,
        member:profiles(id, fullname, points)
      `)
      .eq('activity_id', activityId)
      .order('registered_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  addParticipation: async (
    participation: { 
      activity_id: string
      user_id: string
      is_temp?: boolean
      rate?: number
      notes?: string
      is_interested?: boolean
    }
  ) => {
    // Insert participation
    const { data, error } = await supabase
      .from('activity_participants')
      .insert({
        activity_id: participation.activity_id,
        user_id: participation.user_id,
        is_temp: participation.is_temp || false,
        rate: participation.rate || null,
        notes: participation.notes || null,
        is_interested: participation.is_interested || false
      })
      .select(`
        *,
        member:profiles(id, fullname, points)
      `)
      .single()

    if (error) throw error

    // Update member points if activity has points
 

    return data
  },

  updateParticipation: async (
    id: string,
    updates: { rate?: number | null; notes?: string | null; is_interested?: boolean | null }
  ) => {
    const { data, error } = await supabase
      .from('activity_participants')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        member:profiles(id, fullname, points)
      `)
      .single()

    if (error) throw error
    return data
  },

  deleteParticipation: async (id: string, userId: string, activityPoints: number = 0) => {
    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Subtract points from member (only if activity has points)
    if (activityPoints > 0) {
      const { data: member } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single()
      
      if (member) {
        const newPoints = Math.max(0, (member.points || 0) - activityPoints)
        await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', userId)
      }
    }

    return true
  },

  /**
   * Get member's participated activities with rate and notes
   */
  getMemberParticipations: async (memberId: string) => {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        id,
        rate,
        notes,
        is_interested,
        registered_at,
        activity:activities(
          id,
          name,
          type,
          activity_points,
          activity_begin_date,
          image_url,
          activity_participants(count)
        )
      `)
      .eq('user_id', memberId)
      .order('registered_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Helpers
   */
  getMembers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, fullname')
      .order('fullname')

    if (error) throw error
    return data
  },

  // ==================== ACTIVITY CATEGORIES ====================

  /**
   * Fetch all available categories
   */
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (error) throw error
    return data || []
  },

  /**
   * Fetch categories for a specific activity via junction table
   */
  getActivityCategories: async (activityId: string) => {
    const { data, error } = await supabase
      .from('activity_categories')
      .select(`
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('activity_id', activityId)

    if (error) throw error
    return data?.map((item: any) => item.categories).filter(Boolean) || []
  },

  /**
   * Set categories for an activity (replaces existing categories)
   */
  setActivityCategories: async (activityId: string, categoryIds: number[]) => {
    // First, delete all existing category links
    const { error: deleteError } = await supabase
      .from('activity_categories')
      .delete()
      .eq('activity_id', activityId)

    if (deleteError) throw deleteError

    // If no categories to add, we're done
    if (categoryIds.length === 0) return true

    // Insert new category links
    const inserts = categoryIds.map(categoryId => ({
      activity_id: activityId,
      category_id: categoryId
    }))

    const { error: insertError } = await supabase
      .from('activity_categories')
      .insert(inserts)

    if (insertError) throw insertError
    return true
  },

  /**
   * Add a single category to an activity
   */
  addActivityCategory: async (activityId: string, categoryId: number) => {
    const { error } = await supabase
      .from('activity_categories')
      .insert({
        activity_id: activityId,
        category_id: categoryId
      })

    if (error) {
      if (error.code === '23505') {
        // Already exists, ignore
        return true
      }
      throw error
    }
    return true
  },

  /**
   * Remove a category from an activity
   */
  removeActivityCategory: async (activityId: string, categoryId: number) => {
    const { error } = await supabase
      .from('activity_categories')
      .delete()
      .eq('activity_id', activityId)
      .eq('category_id', categoryId)

    if (error) throw error
    return true
  }
}
