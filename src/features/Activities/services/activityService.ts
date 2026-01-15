import supabase from '../../../utils/supabase'
import type { Activity, ActivityType, EventActivity, FormationActivity, MeetingActivity, GeneralAssemblyActivity } from '../models/Activity'
import type { ActivityFilterDTO, CreateActivityDTO, UpdateActivityDTO } from '../dto/ActivityDTOs'
import { participationService } from './participationService'
import { activityCategoryService } from './activityCategoryService'
import { pointsService } from '../../Members/services/pointsService'

export const activityService = {
  /**
   * Core Activity CRUD
   */
  getActivities: async (filters?: ActivityFilterDTO) => {
    let query = supabase
      .from('activities')
      .select('*, activity_participants(count)')
      .order('activity_begin_date', { ascending: false })

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

  getActivityById: async (id: string): Promise<Activity> => {
    const { data: parent, error: parentErr } = await supabase
      .from('activities')
      .select('*, activity_participants(count)')
      .eq('id', id)
      .maybeSingle()

    if (parentErr) throw parentErr
    if (!parent) throw new Error(`Activity not found: ${id}`)

    const type: ActivityType = parent.type
    const childTable =
      type === 'event' ? 'events' :
      type === 'meeting' ? 'meetings' :
      type === 'formation' ? 'formations' :
      'general_assemblies'

    const { data: child, error: childErr } = await supabase
      .from(childTable)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (childErr) throw childErr

    const merged = { ...parent, ...(child || {}) }

    switch (type) {
      case 'event': return merged as EventActivity
      case 'meeting': return merged as MeetingActivity
      case 'formation': return merged as FormationActivity
      case 'general_assembly': return merged as GeneralAssemblyActivity
      default: return merged as Activity
    }
  },

  createActivity: async (activity: CreateActivityDTO) => {
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

    const { data: parent, error: parentErr } = await supabase
      .from('activities')
      .insert(baseActivity)
      .select()
      .single()

    if (parentErr) throw parentErr

    switch (activity.type) {
      case 'event': {
        await supabase.from('events').insert({
          id: parent.id,
          registration_deadline: activity.registration_deadline ?? null,
        })
        break
      }
      case 'meeting': {
        await supabase.from('meetings').insert({
          id: parent.id,
          meeting_plan: activity.meeting_plan ?? null,
          pv_attachments: activity.pv_attachments ?? null,
          meeting_type: activity.meeting_type ?? null,
        })
        break
      }
      case 'formation': {
        await supabase.from('formations').insert({
          id: parent.id,
          trainer_name: activity.trainer_name ?? null,
          course_attachment: activity.course_attachment ?? null,
          registration_deadline: activity.registration_deadline ?? null,
          training_type: activity.training_type ?? 'just_training',
        })
        break
      }
      case 'general_assembly': {
        await supabase.from('general_assemblies').insert({
          id: parent.id,
          assembly_type: activity.assembly_type ?? null,
        })
        break
      }
    }

    return parent as Activity
  },

  updateActivity: async (id: string, updates: UpdateActivityDTO) => {
    const baseFields = [
      'name', 'description', 'type', 'activity_address', 'is_online', 'online_link',
      'activity_begin_date', 'activity_end_date', 'activity_points', 'is_paid',
      'price', 'is_public', 'image_url', 'recap_images', 'leader_id'
    ]

    const baseUpdates: any = {}
    for (const key of baseFields) {
      if (key in updates && (updates as any)[key] !== undefined) {
        baseUpdates[key] = (updates as any)[key]
      }
    }

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

    const type = updates.type || parent?.type
    if (type === 'event') {
      const { registration_deadline } = updates as any
      if (registration_deadline !== undefined) {
        await supabase.from('events').update({ registration_deadline }).eq('id', id)
      }
    } else if (type === 'meeting') {
      await UpdateMeeting()
    } else if (type === 'formation') {
      await UpdateTrainng()
    } else if (type === 'general_assembly') {
      const { assembly_type } = updates as any
      if (assembly_type !== undefined) {
        await supabase.from('general_assemblies').update({ assembly_type }).eq('id', id)
      }
    }

    return activityService.getActivityById(id)

    async function UpdateTrainng() {
      const { trainer_name, course_attachment, registration_deadline, training_type } = updates as any
      const formationUpdates: any = {}
      if (trainer_name !== undefined) formationUpdates.trainer_name = trainer_name
      if (course_attachment !== undefined) formationUpdates.course_attachment = course_attachment
      if (registration_deadline !== undefined) formationUpdates.registration_deadline = registration_deadline
      if (training_type !== undefined) formationUpdates.training_type = training_type
      if (Object.keys(formationUpdates).length > 0) {
        await supabase.from('formations').update(formationUpdates).eq('id', id)
      }
    }

    async function UpdateMeeting() {
      const { meeting_plan, pv_attachments, meeting_type } = updates as any
      const meetingUpdates: any = {}
      if (meeting_plan !== undefined) meetingUpdates.meeting_plan = meeting_plan
      if (pv_attachments !== undefined) meetingUpdates.pv_attachments = pv_attachments
      if (meeting_type !== undefined) meetingUpdates.meeting_type = meeting_type
      if (Object.keys(meetingUpdates).length > 0) {
        await supabase.from('meetings').update(meetingUpdates).eq('id', id)
      }
    }
  },

  deleteActivity: async (id: string) => {
    // 1. Get the activity type first
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('type')
      .eq('id', id)
      .maybeSingle() 

    if (fetchError) throw fetchError
    if (!activity) return true
    
    // 2. Delete from specific child table first to avoid foreign key violations
    switch (activity.type) {
      case 'event':
        await supabase.from('events').delete().eq('id', id)
        break
      case 'meeting':
        await supabase.from('meetings').delete().eq('id', id)
        break
      case 'formation':
        await supabase.from('formations').delete().eq('id', id)
        break
      case 'general_assembly':
        await supabase.from('general_assemblies').delete().eq('id', id)
        break
    }

    // 3. Finally delete from the parent activities table
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      
    if (deleteError) throw deleteError

    return true
  },

  /**
   * Points History Utility (Delegated to pointsService)
   */
  triggerPointsHistory: pointsService.triggerPointsHistory,

  /**
   * Common Helpers
   */
  getMembers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, fullname')
      .order('fullname')
    if (error) throw error
    return data
  },

  /**
   * Delegated Tasks (Delegating to new services for backward compatibility)
   */
  
  // Participation delegates
  getParticipations: participationService.getParticipations,
  addParticipation: participationService.addParticipation,
  updateParticipation: participationService.updateParticipation,
  deleteParticipation: participationService.deleteParticipation,
  getMemberParticipations: participationService.getMemberParticipations,

  // Category delegates
  getCategories: activityCategoryService.getCategories,
  getActivityCategories: activityCategoryService.getActivityCategories,
  setActivityCategories: activityCategoryService.setActivityCategories,
  addActivityCategory: activityCategoryService.addActivityCategory,
  removeActivityCategory: activityCategoryService.removeActivityCategory
}
