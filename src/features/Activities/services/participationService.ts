import supabase from '../../../utils/supabase'
import { pointsService } from '../../Members/services/pointsService'

export const participationService = {
  /**
   * Get all participants for a specific activity
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

  /**
   * Add a new participant to an activity
   */
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

    // Fetch activity details for points and logging
    const { data: activity } = await supabase
      .from('activities')
      .select('activity_points, name')
      .eq('id', participation.activity_id)
      .single()

    if (activity) {
      if (activity.activity_points > 0 && !participation.is_temp) {
        // Award points for confirmed participation via pointsService (handles profile update)
        await pointsService.triggerPointsHistory(
          participation.user_id,
          activity.activity_points,
          `Participation in activity: ${activity.name}`,
          'activity'
        )
      } else {
        // Log interest (0 points)
        await pointsService.triggerPointsHistory(
          participation.user_id,
          0,
          `Marked interested in activity: ${activity.name}`,
          'activity'
        )
      }
    }

    return data
  },

  /**
   * Update an existing participation (rate, notes, interest)
   */
  updateParticipation: async (
    id: string,
    updates: { rate?: number | null; notes?: string | null; is_interested?: boolean | null,is_temp?: boolean | null }
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

  /**
   * Delete participation and optionally deduct points
   */
  deleteParticipation: async (id: string, userId: string, activityPoints: number = 0,is_temp=false) => {
    const { error } = await supabase
      .from('activity_participants')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Subtract points via pointsService (only if activity has points and it was NOT temp)
    if (activityPoints > 0 && !is_temp) {
      await pointsService.triggerPointsHistory(
        userId,
        -activityPoints,
        `Cancelled participation in activity (Points deducted)`,
        'activity'
      )
    }

    return true
  },

  /**
   * Get participation counts per member by activity type since a given date
   */
  getParticipationsSince: async (memberIds: string[], sinceDate: string) => {
    if (memberIds.length === 0) return {}

    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        user_id,
        activity:activity_id(type)
      `)
      .in('user_id', memberIds)
      .gte('registered_at', sinceDate)
      .not('is_interested', 'eq', true)

    if (error) throw error

    const counts: Record<string, { events: number; meetings: number; formations: number; assemblies: number }> = {}

    for (const p of data || []) {
      const uid = p.user_id
      if (!counts[uid]) counts[uid] = { events: 0, meetings: 0, formations: 0, assemblies: 0 }

      const activity = p.activity as { type?: string } | null
      const type = activity?.type
      if (type === 'event') counts[uid].events++
      else if (type === 'meeting') counts[uid].meetings++
      else if (type === 'formation') counts[uid].formations++
      else if (type === 'general_assembly') counts[uid].assemblies++
    }

    return counts
  },

  /**
   * Get total activities count by type since a given date
   */
  getActivityTypeCountsSince: async (sinceDate: string): Promise<{ events: number; meetings: number; formations: number; assemblies: number }> => {
    const { data, error } = await supabase
      .from('activities')
      .select('type')
      .gte('activity_begin_date', sinceDate)

    if (error) throw error

    const counts = { events: 0, meetings: 0, formations: 0, assemblies: 0 }
    for (const a of data || []) {
      if (a.type === 'event') counts.events++
      else if (a.type === 'meeting') counts.meetings++
      else if (a.type === 'formation') counts.formations++
      else if (a.type === 'general_assembly') counts.assemblies++
    }
    return counts
  },

  /**
   * Get top N most attended members with their total participation count
   */
  getTopAttendedMembers: async (limit = 3): Promise<{ member_id: string; fullname: string; avatar_url?: string | null; count: number }[]> => {
    const { data, error } = await supabase
      .from('activity_participants')
      .select(`
        user_id,
        member:profiles(fullname, avatar_url)
      `)
      .not('is_interested', 'eq', true)

    if (error) throw error

    const countMap = new Map<string, { fullname: string; avatar_url?: string | null; count: number }>()

    for (const p of data || []) {
      const uid = p.user_id
      const memberData = p.member as { fullname?: string; avatar_url?: string | null } | null
      if (!uid || !memberData?.fullname) continue
      if (!countMap.has(uid)) {
        countMap.set(uid, { fullname: memberData.fullname, avatar_url: memberData.avatar_url, count: 0 })
      }
      countMap.get(uid)!.count++
    }

    return Array.from(countMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([member_id, data]) => ({ member_id, ...data }))
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
  }
}
