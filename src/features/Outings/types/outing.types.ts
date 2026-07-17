export const OUTING_CATEGORIES = [
  'study',
  'fun',
  'knowing_each_other',
  'cultural',
  'sport',
  'other',
] as const;

export type OutingCategory = (typeof OUTING_CATEGORIES)[number];

export type InvitationStatus = 'pending' | 'accepted' | 'rejected'

export interface Outing {
  id: string
  title: string
  description: string
  category: OutingCategory
  cover_image?: string
  date: string
  start_time: string
  end_time: string
  latitude: number
  longitude: number
  address: string
  max_participants: number
  created_by: string
  created_at: string
  updated_at: string
  profiles?: { id: string; fullname: string; avatar_url?: string }
  outing_members?: { count: number }[]
  user_joined?: boolean
  participant_count?: number
}

export interface OutingMember {
  id: string
  outing_id: string
  user_id: string
  joined_at: string
  profiles?: { id: string; fullname: string; avatar_url?: string }
}

export interface OutingInvitation {
  id: string
  outing_id: string
  inviter_id: string
  invitee_id: string
  status: InvitationStatus
  created_at: string
  updated_at: string
  outings?: Outing
  inviter?: { id: string; fullname: string; avatar_url?: string }
  invitee?: { id: string; fullname: string; avatar_url?: string }
}

export interface CreateOutingDTO {
  title: string
  description: string
  category: OutingCategory
  cover_image?: string
  date: string
  start_time: string
  end_time: string
  latitude: number
  longitude: number
  address: string
  max_participants: number
}

export type UpdateOutingDTO = Partial<CreateOutingDTO>

export interface OutingFilters {
  search?: string
  category?: OutingCategory | 'all'
  dateFilter?: 'all' | 'upcoming' | 'past'
  sortBy?: 'nearest' | 'newest' | 'oldest'
  page?: number
  pageSize?: number
}
