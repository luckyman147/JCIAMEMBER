export type OfficerRole = 'treasurer' | 'general_secretary' | 'event_chef'

export interface EventOfficers {
  treasurer_id: string | null
  general_secretary_id: string | null
  event_chef_id: string | null
}

export const OFFICER_LABELS: Record<OfficerRole, string> = {
  treasurer: 'Trésorier',
  general_secretary: 'Secrétaire Général',
  event_chef: 'Chef d\'Événement',
}

export const OFFICER_ICONS: Record<OfficerRole, string> = {
  treasurer: 'Landmark',
  general_secretary: 'FileText',
  event_chef: 'Star',
}

export type CommitteeName = 'sponsoring' | 'media' | 'program' | 'logistic'

export const COMMITTEES: CommitteeName[] = ['sponsoring', 'media', 'program', 'logistic']

export const COMMITTEE_LABELS: Record<CommitteeName, string> = {
  sponsoring: 'Sponsoring',
  media: 'Media',
  program: 'Program',
  logistic: 'Logistic',
}

export const DEFAULT_COMMITTEE_STATE: Record<CommitteeName, CommitteeFormState> = {
  sponsoring: { chef_id: null, member_ids: [] },
  media: { chef_id: null, member_ids: [] },
  program: { chef_id: null, member_ids: [] },
  logistic: { chef_id: null, member_ids: [] },
}

export interface CommitteeFormState {
  chef_id: string | null
  member_ids: string[]
}

export interface ActivityCommitteeMember {
  id: string
  activity_committee_id: string
  member_id: string
  role: 'lead' | 'member'
  custom_title?: string
  member?: {
    id: string
    fullname: string
    avatar_url?: string
  }
}

export interface ActivityCommittee {
  id: string
  activity_id: string
  name: string
  project_id?: string
  members?: ActivityCommitteeMember[]
  chef?: ActivityCommitteeMember
}
