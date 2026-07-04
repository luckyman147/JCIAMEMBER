import supabase from '../../../utils/supabase'
import { createProject } from '../../Teams/services/project.service'
import { createTeam, addTeamMember, updateTeamMember, leaveTeam } from '../../Teams/services/teams.service'
import type { CommitteeName, CommitteeFormState, ActivityCommittee, ActivityCommitteeMember } from '../models/Committee'
import { COMMITTEES } from '../models/Committee'

interface SavedCommittees {
  projectId: string | null
  committees: ActivityCommittee[]
}

export interface MemberCommitteeStats {
  totalCommittees: number
  sponsoring: number
  media: number
  program: number
  logistic: number
}

export const committeeService = {

  async getActivityCommittees(activityId: string): Promise<ActivityCommittee[]> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        members:team_members (
          *,
          member:profiles (id, fullname, avatar_url)
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at')

    if (error) {
      console.error('Error fetching activity committees:', error)
      return []
    }

    return teams.map((team: any) => {
      const members: ActivityCommitteeMember[] = (team.members || []).map((tm: any) => ({
        id: tm.id,
        activity_committee_id: tm.team_id,
        member_id: tm.member_id,
        role: tm.role,
        custom_title: tm.custom_title,
        member: tm.member,
      }))

      const chef = members.find(m => m.role === 'lead')
      return {
        id: team.id,
        activity_id: team.activity_id,
        name: team.name,
        project_id: team.project_id,
        members,
        chef,
      }
    })
  },

  async ensureActivityProject(activityId: string, activityName: string, userId: string): Promise<string | null> {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('activity_id', activityId)
      .maybeSingle()

    if (existing) return existing.id

    try {
      const project = await createProject({
        name: `${activityName} - Project`,
        leader_id: userId,
      })
      if (!project) throw new Error('Failed to create project')

      const { error: linkErr } = await supabase
        .from('projects')
        .update({ activity_id: activityId })
        .eq('id', project.id)

      if (linkErr) throw linkErr
      return project.id
    } catch (err) {
      console.error('Error creating project for activity:', err)
      return null
    }
  },

  async saveActivityCommittees(
    activityId: string,
    committees: Record<CommitteeName, CommitteeFormState>,
    userId: string,
    projectId?: string | null
  ): Promise<SavedCommittees> {
    const results: ActivityCommittee[] = []

    for (const name of COMMITTEES) {
      const data = committees[name]

      const team = await this._ensureTeam(name, activityId, userId, projectId || undefined)

      const { data: existingRows } = await supabase
        .from('team_members')
        .select('id, member_id, role')
        .eq('team_id', team.id)

      const existingMembers = existingRows || []
      const newLeadId = data.chef_id
      const newMemberIds = data.member_ids.filter(id => id !== newLeadId)

      const oldLead = existingMembers.find(m => m.role === 'lead')
      if (oldLead && oldLead.member_id !== newLeadId) {
        if (newMemberIds.includes(oldLead.member_id)) {
          await updateTeamMember(team.id, oldLead.member_id, { role: 'member' })
        } else {
          await leaveTeam(team.id, oldLead.member_id)
        }
      }

      if (newLeadId) {
        const existingLeadEntry = existingMembers.find(m => m.member_id === newLeadId)
        if (existingLeadEntry) {
          if (existingLeadEntry.role !== 'lead') {
            await updateTeamMember(team.id, newLeadId, { role: 'lead' })
          }
        } else {
          await addTeamMember(team.id, newLeadId, 'lead')
        }
      }

      const currentMemberIds = existingMembers.map(m => m.member_id)
      const finalMemberIds = new Set(currentMemberIds)

      if (newLeadId) finalMemberIds.add(newLeadId)
      for (const mid of newMemberIds) finalMemberIds.add(mid)

      for (const existing of existingMembers) {
        const shouldKeep =
          (existing.role === 'lead' && existing.member_id === newLeadId) ||
          (existing.role === 'lead' && !newLeadId)

        if (!shouldKeep && !newMemberIds.includes(existing.member_id) && existing.member_id !== newLeadId) {
          await leaveTeam(team.id, existing.member_id)
        }
      }

      for (const mid of newMemberIds) {
        const alreadyExists = existingMembers.some(e => e.member_id === mid)
        if (!alreadyExists) {
          await addTeamMember(team.id, mid, 'member')
        }
      }

      const members = await this._getTeamMembers(team.id)
      const chef = members.find(m => m.role === 'lead')
      results.push({ ...team, members, chef })
    }

    return { projectId: projectId || null, committees: results }
  },

  async getMembersCommitteeStats(): Promise<Record<string, MemberCommitteeStats>> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('name, members:team_members(member_id)')
      .not('activity_id', 'is', null)

    if (error) {
      console.error('Error fetching committee stats:', error)
      return {}
    }

    const stats: Record<string, MemberCommitteeStats> = {}

    for (const team of teams || []) {
      const committeeName = team.name as string
      for (const tm of team.members || []) {
        const mid = tm.member_id
        if (!stats[mid]) {
          stats[mid] = { totalCommittees: 0, sponsoring: 0, media: 0, program: 0, logistic: 0 }
        }
        stats[mid].totalCommittees++
        if (committeeName === 'sponsoring') stats[mid].sponsoring++
        else if (committeeName === 'media') stats[mid].media++
        else if (committeeName === 'program') stats[mid].program++
        else if (committeeName === 'logistic') stats[mid].logistic++
      }
    }

    return stats
  },

  async deleteActivityCommittees(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('activity_id', activityId)

    if (error) {
      console.error('Error deleting activity committees:', error)
    }
  },

  async _ensureTeam(
    name: string,
    activityId: string,
    userId: string,
    projectId?: string
  ): Promise<{ id: string; name: string; activity_id: string; project_id?: string }> {
    const { data: existing } = await supabase
      .from('teams')
      .select('id, project_id')
      .eq('activity_id', activityId)
      .eq('name', name)
      .maybeSingle()

    if (existing) {
      if (projectId && existing.project_id !== projectId) {
        await supabase.from('teams').update({ project_id: projectId }).eq('id', existing.id)
      }
      return { id: existing.id, name, activity_id: activityId, project_id: projectId }
    }

    const team = await createTeam({
      name,
      activity_id: activityId,
      project_id: projectId,
      created_by: userId,
      is_public: false,
    })

    if (!team) throw new Error(`Failed to create team: ${name}`)

    // Remove auto-added creator — committee teams start empty
    await leaveTeam(team.id, userId)

    return { id: team.id, name, activity_id: activityId, project_id: projectId }
  },

  async _getTeamMembers(teamId: string): Promise<ActivityCommitteeMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        member:profiles (id, fullname, avatar_url)
      `)
      .eq('team_id', teamId)

    if (error) return []
    return (data || []).map((tm: any) => ({
      id: tm.id,
      activity_committee_id: tm.team_id,
      member_id: tm.member_id,
      role: tm.role,
      custom_title: tm.custom_title,
      member: tm.member,
    }))
  },
}
