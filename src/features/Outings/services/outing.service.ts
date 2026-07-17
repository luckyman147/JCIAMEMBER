import supabase from '../../../utils/supabase'
import type { OutingMember, OutingInvitation, OutingFilters, CreateOutingDTO, UpdateOutingDTO } from '../types/outing.types'

export const outingService = {
  async getOutings(filters?: OutingFilters) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('outings')
      .select(`
        *,
        profiles!created_by(id, fullname, avatar_url),
        outing_members(count),
        user_joined:outing_members!inner(user_id)
      `, { count: 'exact' })

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    const now = new Date().toISOString().split('T')[0]
    if (filters?.dateFilter === 'upcoming') {
      query = query.gte('date', now)
    } else if (filters?.dateFilter === 'past') {
      query = query.lt('date', now)
    }

    if (filters?.sortBy === 'nearest') {
      query = query.order('date', { ascending: true }).order('start_time', { ascending: true })
    } else if (filters?.sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (filters?.page && filters?.pageSize) {
      const from = (filters.page - 1) * filters.pageSize
      const to = from + filters.pageSize - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) throw error

    const outings = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      user_joined: (item.user_joined as Array<Record<string, string>>)?.some((j) => j.user_id === user.id) ?? false,
      participant_count: (item.outing_members as Array<{ count: number }>)?.[0]?.count ?? 0,
    }))

    return { data: outings, count }
  },

  async getOutingById(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('outings')
      .select(`
        *,
        profiles!created_by(id, fullname, avatar_url),
        outing_members(count)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const { data: membership } = await supabase
      .from('outing_members')
      .select('id')
      .eq('outing_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    return {
      ...data,
      user_joined: !!membership,
      participant_count: data.outing_members?.[0]?.count ?? 0,
    }
  },

  async createOuting(data: CreateOutingDTO) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: outing, error } = await supabase
      .from('outings')
      .insert({ ...data, created_by: user.id })
      .select()
      .single()

    if (error) throw error

    await supabase.from('outing_members').insert({
      outing_id: outing.id,
      user_id: user.id,
    })

    return outing
  },

  async updateOuting(id: string, data: UpdateOutingDTO) {
    const { data: outing, error } = await supabase
      .from('outings')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return outing
  },

  async deleteOuting(id: string) {
    const { data: outing } = await supabase
      .from('outings')
      .select('cover_image')
      .eq('id', id)
      .single()

    if (outing?.cover_image) {
      await supabase.storage.from('outing-images').remove([outing.cover_image])
    }

    const { error } = await supabase.from('outings').delete().eq('id', id)
    if (error) throw error
  },

  async joinOuting(outingId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: outing } = await supabase
      .from('outings')
      .select('max_participants')
      .eq('id', outingId)
      .single()

    const { count } = await supabase
      .from('outing_members')
      .select('id', { count: 'exact', head: true })
      .eq('outing_id', outingId)

    if (count && outing && count >= outing.max_participants) {
      throw new Error('outingFull')
    }

    const { error } = await supabase.from('outing_members').insert({
      outing_id: outingId,
      user_id: (await supabase.auth.getUser()).data.user!.id,
    })

    if (error) {
      if (error.code === '23505') throw new Error('alreadyJoined')
      throw error
    }
  },

  async leaveOuting(outingId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('outing_members')
      .delete()
      .eq('outing_id', outingId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async getOutingMembers(outingId: string) {
    const { data, error } = await supabase
      .from('outing_members')
      .select('*, profiles!user_id(id, fullname, avatar_url)')
      .eq('outing_id', outingId)
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data as OutingMember[]
  },

  async inviteMembers(outingId: string, inviteeIds: string[]) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const invitations = inviteeIds.map(inviteeId => ({
      outing_id: outingId,
      inviter_id: user.id,
      invitee_id: inviteeId,
    }))

    const { data, error } = await supabase
      .from('outing_invitations')
      .insert(invitations)
      .select()

    if (error) throw error

    const notifications = inviteeIds.map(inviteeId => ({
      user_id: inviteeId,
      title: 'outings.invitationTitle',
      message: 'outings.invitationMessage',
    }))

    await supabase.from('notifications').insert(notifications)

    return data
  },

  async respondToInvitation(invitationId: string, status: 'accepted' | 'rejected') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: invitation } = await supabase
      .from('outing_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (!invitation) throw new Error('Invitation not found')
    if (invitation.invitee_id !== user.id) throw new Error('Not your invitation')

    const { error } = await supabase
      .from('outing_invitations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invitationId)

    if (error) throw error

    if (status === 'accepted') {
      const joinError = await supabase.from('outing_members').insert({
        outing_id: invitation.outing_id,
        user_id: user.id,
      })
      if (joinError.error && joinError.error.code !== '23505') throw joinError.error
    }

    return { ...invitation, status }
  },

  async getPendingInvitations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('outing_invitations')
      .select('*, outings!outing_id(id, title, date, address), inviter:inviter_id(id, fullname, avatar_url)')
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as OutingInvitation[]
  },
}
