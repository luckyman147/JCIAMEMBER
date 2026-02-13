export type ActivityType = 'event' | 'formation' | 'meeting' | 'general_assembly'
export type TrainingType = 'official_session' | 'important_training' | 'just_training' | 'member_to_member'

// Base interface with shared properties
export interface ActivityBase {
  id: string
  name: string
  description?: string
  activity_address?: string
  is_online: boolean
  online_link?: string
  activity_begin_date: string
  activity_end_date: string
  leader_id: string
  activity_points: number
  is_paid: boolean
  price?: number
  is_public: boolean
  image_url?: string
  video_url?: string
  recap_images?: string[]
  recap_videos?: string[]
  created_at: string
  // Count from optional join
  activity_participants?: { count: number }[]
}

// Event-specific properties
export interface EventActivity extends ActivityBase {
  type: 'event'
  registration_deadline?: string
}

// Meeting-specific properties
export interface MeetingActivity extends ActivityBase {
  type: 'meeting'
  meeting_plan?: string
  pv_attachments?: string // URL to PV document
  meeting_type?: 'official' | 'committee' 
  // Not for meetings

}

// Formation (Training)-specific properties
export interface FormationActivity extends ActivityBase {
  type: 'formation'
  trainer_name?: string
  course_attachment?: string // URL to course materials
  registration_deadline?: string // Formations can also have registration deadlines
  training_type?: TrainingType
  // Not for formations

}

// General Assembly-specific properties
export interface GeneralAssemblyActivity extends ActivityBase {
  type: 'general_assembly'
  assembly_type?: 'local' | 'zonal' | 'national' | 'international'
}

// Discriminated union type
export type Activity = EventActivity | MeetingActivity | FormationActivity | GeneralAssemblyActivity

// Type guards
export const isEventActivity = (activity: Activity): activity is EventActivity => {
  return activity.type === 'event'
}

export const isMeetingActivity = (activity: Activity): activity is MeetingActivity => {
  return activity.type === 'meeting'
}

export const isFormationActivity = (activity: Activity): activity is FormationActivity => {
  return activity.type === 'formation'
}

export const isGeneralAssemblyActivity = (activity: Activity): activity is GeneralAssemblyActivity => {
  return activity.type === 'general_assembly'
}
