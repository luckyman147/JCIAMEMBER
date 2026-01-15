import type { ActivityType } from "../models/Activity"

// Base DTO with shared properties
interface ActivityDTOBase {
  name: string
  description?: string
  activity_address?: string
  is_online: boolean
  online_link?: string | null
  activity_begin_date: string
  activity_end_date: string
  activity_points: number
  is_paid: boolean
  price?: number
  is_public: boolean
  image_url?: string | null
  recap_images?: string[] | null
  leader_id: string
}

// Event-specific DTO
export interface CreateEventDTO extends ActivityDTOBase {
  type: 'event'
  registration_deadline?: string | null
}

// Meeting-specific DTO
export interface CreateMeetingDTO extends ActivityDTOBase {
  type: 'meeting'
  meeting_plan?: string | null
  pv_attachments?: string | null
  meeting_type?: 'official' | 'committee' | null
}

// Formation-specific DTO
export interface CreateFormationDTO extends ActivityDTOBase {
  type: 'formation'
  trainer_name?: string | null
  course_attachment?: string | null
  registration_deadline?: string | null
  training_type?: import("../models/Activity").TrainingType | null
}

// General Assembly-specific DTO
export interface CreateGeneralAssemblyDTO extends ActivityDTOBase {
  type: 'general_assembly'
  assembly_type?: 'local' | 'zonal' | 'national' | 'international'
}

// Discriminated union for Create
export type CreateActivityDTO = CreateEventDTO | CreateMeetingDTO | CreateFormationDTO | CreateGeneralAssemblyDTO

// Update DTOs (Partial of each type)
export type UpdateEventDTO = Partial<CreateEventDTO>
export type UpdateMeetingDTO = Partial<CreateMeetingDTO>
export type UpdateFormationDTO = Partial<CreateFormationDTO>
export type UpdateGeneralAssemblyDTO = Partial<CreateGeneralAssemblyDTO>
export type UpdateActivityDTO = UpdateEventDTO | UpdateMeetingDTO | UpdateFormationDTO | UpdateGeneralAssemblyDTO


// Filter DTO
export interface ActivityFilterDTO {
  type?: ActivityType
  is_online?: boolean
  is_paid?: boolean
  is_public?: boolean
  startDate?: string
  endDate?: string
}
