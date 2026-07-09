import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../Authentication/auth.context'
import { useActivities } from './useActivities'
import { useFileUpload } from './useFileUpload'
import { activityService } from '../services/activityService'
import { activitySchema, type ActivityFormValues } from '../schemas/activitySchema'
import { uploadActivityImage, uploadActivityAttachment, uploadRecapImages, uploadActivityVideo, uploadRecapVideos } from '../../../utils/uploadHelpers'
import { parseAgenda, serializeAgenda, type AgendaItem } from '../models/MeetingAgenda'
import type { CreateActivityDTO } from '../dto/ActivityDTOs'
import type { EventActivity } from '../models/Activity'
import { treasuryService } from '../../Treasury/services/treasury.service'
import { EXECUTIVE_LEVELS } from '../../../utils/roles'
import { committeeService } from '../services/committeeService'
import { DEFAULT_COMMITTEE_STATE } from '../models/Committee'
import type { CommitteeName, CommitteeFormState, EventOfficers } from '../models/Committee'

export interface UseActivityFormReturn {
  // Form
  register: ReturnType<typeof useForm<ActivityFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<ActivityFormValues>>['handleSubmit']
  errors: ReturnType<typeof useForm<ActivityFormValues>>['formState']['errors']
  watch: ReturnType<typeof useForm<ActivityFormValues>>['watch']
  setValue: ReturnType<typeof useForm<ActivityFormValues>>['setValue']
  
  // Watched values
  activityType: string
  isPaid: boolean
  isOnline: boolean
  
  // State
  isEditMode: boolean
  loading: boolean
  uploading: boolean
  meetingAgenda: AgendaItem[]
  selectedCategoryIds: number[]
  
  // File uploads
  activityImage: ReturnType<typeof useFileUpload>
  pvAttachment: ReturnType<typeof useFileUpload>
  courseAttachment: ReturnType<typeof useFileUpload>
  recapImages: ReturnType<typeof useFileUpload>
  activityVideo: ReturnType<typeof useFileUpload>
  recapVideos: ReturnType<typeof useFileUpload>
  
  
  // Committee
  committees: Record<CommitteeName, CommitteeFormState>
  setCommittees: React.Dispatch<React.SetStateAction<Record<CommitteeName, CommitteeFormState>>>
  officers: EventOfficers
  setOfficers: React.Dispatch<React.SetStateAction<EventOfficers>>

  // Handlers
  setMeetingAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<number[]>>
  onSubmit: (data: ActivityFormValues) => Promise<void>
  onCancel: () => void
}

export function useActivityForm(): UseActivityFormReturn {
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { createActivity, updateActivity, fetchActivityById, loading } = useActivities()

  // Form setup
  // Helper to format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      is_online: false,
      is_paid: false,
      is_public: true,
      activity_points: 0,
      type: 'event',
      activity_begin_date: formatDateForInput(now),
      activity_end_date: formatDateForInput(oneHourLater),
      activity_address: 'Local JCI Hammam Sousse'
    }
  })

  // Watched values
  const activityType = watch('type')
  const isPaid = watch('is_paid')
  const isOnline = watch('is_online')

  // File uploads
  const activityImage = useFileUpload()
  const pvAttachment = useFileUpload()
  const courseAttachment = useFileUpload()
  const recapImages = useFileUpload()
  const activityVideo = useFileUpload()
  const recapVideos = useFileUpload()
  
  // Local state
  const [uploading, setUploading] = useState(false)
  const [meetingAgenda, setMeetingAgenda] = useState<AgendaItem[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [committees, setCommittees] = useState<Record<CommitteeName, CommitteeFormState>>(DEFAULT_COMMITTEE_STATE)
  const [officers, setOfficers] = useState<EventOfficers>({ treasurer_id: null, general_secretary_id: null, event_chef_id: null })

  // Fetch activity data in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return

    const loadActivity = async () => {
      try {
        const activity = await fetchActivityById(id)
        if (!activity) return

        const formatDate = (isoDate: string) => new Date(isoDate).toISOString().slice(0, 16)

        reset({
          name: activity.name,
          description: activity.description || '',
          type: activity.type,
          activity_address: activity.activity_address || '',
          is_online: activity.is_online,
          online_link: activity.online_link || '',
          activity_begin_date: formatDate(activity.activity_begin_date),
          activity_end_date: formatDate(activity.activity_end_date),
          activity_points: activity.activity_points,
          is_paid: activity.is_paid,
          price: activity.price,
          is_public: activity.is_public,
          image_url: activity.image_url || '',
          video_url: activity.video_url || '',
          registration_deadline: (activity.type === 'event' || activity.type === 'formation') && activity.registration_deadline
            ? formatDate(activity.registration_deadline)
            : '',
          meeting_plan: activity.type === 'meeting' ? (activity.meeting_plan || '') : '',
          pv_attachments: activity.type === 'meeting' ? (activity.pv_attachments || '') : '',
          trainer_name: activity.type === 'formation' ? (activity.trainer_name || '') : '',
          course_attachment: activity.type === 'formation' ? (activity.course_attachment || '') : '',
          training_type: activity.type === 'formation' ? (activity.training_type || 'just_training') : undefined,
          assembly_type: activity.type === 'general_assembly' ? (activity.assembly_type || undefined) : undefined,
          recap_videos: activity.recap_videos || [],
        })

        // Set file URLs
        if (activity.image_url && activity.type !== 'meeting') {
          activityImage.setUrls([activity.image_url])
        }
        if (activity.type === 'meeting') {
          // Load PV attachments if any
          if (activity.pv_attachments) {
            pvAttachment.setUrls([activity.pv_attachments])
          }
          // Load meeting agenda (independent of pv_attachments)
          if (activity.meeting_plan) {
            setMeetingAgenda(parseAgenda(activity.meeting_plan))
          }
        }
        if (activity.type === 'formation' && activity.course_attachment) {
          courseAttachment.setUrls([activity.course_attachment])
        }
        if (activity.recap_images?.length) {
          recapImages.setUrls(activity.recap_images)
        }
        if (activity.video_url) {
          activityVideo.setUrls([activity.video_url])
        }
        if (activity.recap_videos?.length) {
          recapVideos.setUrls(activity.recap_videos)
        }

        // Fetch categories
        const categories = await activityService.getActivityCategories(id)
        setSelectedCategoryIds(categories.map((c: any) => c.id))

        // Fetch committees & officers
        if (activity.type === 'event') {
          const eventActivity = activity as EventActivity
          setOfficers({
            treasurer_id: eventActivity.treasurer_id || null,
            general_secretary_id: eventActivity.general_secretary_id || null,
            event_chef_id: eventActivity.event_chef_id || null,
          })
          const existingCommittees = await committeeService.getActivityCommittees(id)
          if (existingCommittees.length > 0) {
            const parsed: Record<string, CommitteeFormState> = { ...DEFAULT_COMMITTEE_STATE }
            for (const c of existingCommittees) {
              if (parsed[c.name]) {
                const chef = c.members?.find(m => m.role === 'lead')
                const members = c.members?.filter(m => m.role !== 'lead') || []
                parsed[c.name] = {
                  chef_id: chef?.member_id || null,
                  member_ids: members.map(m => m.member_id),
                }
              }
            }
            setCommittees(parsed as Record<CommitteeName, CommitteeFormState>)
          }
        }
      } catch (error) {
        toast.error('Failed to load activity data')
        console.error('Error loading activity:', error)
      }
    }

    loadActivity()
  }, [isEditMode, id])

  // Upload files helper
  const uploadFiles = useCallback(async (data: ActivityFormValues) => {
    let imageUrl = activityImage.urls[0] || null
    if (activityImage.file.length > 0) {
      const result = await uploadActivityImage(activityImage.file[0])
      if (!result.success || !result.url) throw new Error(result.error || 'Failed to upload image')
      imageUrl = result.url
    }

    let pvUrl = pvAttachment.urls[0] || null
    if (data.type === 'meeting' && pvAttachment.file.length > 0) {
      const result = await uploadActivityAttachment(pvAttachment.file[0])
      if (!result.success || !result.url) throw new Error(result.error || 'Failed to upload PV')
      pvUrl = result.url
    }

    let courseUrl = courseAttachment.urls[0] || null
    if (data.type === 'formation' && courseAttachment.file.length > 0) {
      const result = await uploadActivityAttachment(courseAttachment.file[0])
      if (!result.success || !result.url) throw new Error(result.error || 'Failed to upload course')
      courseUrl = result.url
    }

    let recapUrls = [...recapImages.urls]
    if (recapImages.file.length > 0) {
      const results = await uploadRecapImages(recapImages.file)
      recapUrls = [...recapUrls, ...results.filter(r => r.success && r.url).map(r => r.url!)]
    }

    let videoUrl = activityVideo.urls[0] || null
    if (activityVideo.file.length > 0) {
      const result = await uploadActivityVideo(activityVideo.file[0])
      if (!result.success || !result.url) throw new Error(result.error || 'Failed to upload video')
      videoUrl = result.url
    }

    let recapVideoUrls = [...recapVideos.urls]
    if (recapVideos.file.length > 0) {
      const results = await uploadRecapVideos(recapVideos.file)
      recapVideoUrls = [...recapVideoUrls, ...results.filter(r => r.success && r.url).map(r => r.url!)]
    }

    return { imageUrl, pvUrl, courseUrl, recapUrls, videoUrl, recapVideoUrls }
  }, [activityImage, pvAttachment, courseAttachment, recapImages, activityVideo, recapVideos])

  // Build payload helper
  const buildPayload = useCallback((
    data: ActivityFormValues,
    urls: { imageUrl: string | null; pvUrl: string | null; courseUrl: string | null; recapUrls: string[]; videoUrl: string | null; recapVideoUrls: string[] }
  ): CreateActivityDTO => {
    const basePayload = {
      name: data.name,
      description: data.description,
      type: data.type,
      activity_address: data.activity_address,
      is_online: data.is_online,
      online_link: data.is_online ? (data.online_link || null) : null,
      activity_begin_date: new Date(data.activity_begin_date).toISOString(),
      activity_end_date: new Date(data.activity_end_date).toISOString(),
      activity_points: data.activity_points,
      is_paid: data.is_paid,
      price: data.is_paid ? data.price : 0,
      is_public: data.is_public,
      image_url: data.type === 'meeting' ? null : urls.imageUrl,
      video_url: urls.videoUrl,
      recap_images: urls.recapUrls.length > 0 ? urls.recapUrls : null,
      recap_videos: urls.recapVideoUrls.length > 0 ? urls.recapVideoUrls : null,
      leader_id: user!.id,
    }

    switch (data.type) {
      case 'event':
        return {
          ...basePayload,
          type: 'event',
          registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString() : null,
          treasurer_id: officers.treasurer_id,
          general_secretary_id: officers.general_secretary_id,
          event_chef_id: officers.event_chef_id,
        }
      case 'meeting':
        return {
          ...basePayload,
          type: 'meeting',
          meeting_plan: serializeAgenda(meetingAgenda),
          pv_attachments: urls.pvUrl,
        }
      case 'formation':
        return {
          ...basePayload,
          type: 'formation',
          trainer_name: data.trainer_name || null,
          course_attachment: urls.courseUrl,
          registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString() : null,
          training_type: data.training_type || 'just_training',
        }
      case 'general_assembly':
        return {
          ...basePayload,
          type: 'general_assembly',
          assembly_type: data.assembly_type,
        }
    }
  }, [user, meetingAgenda, officers])

  // Submit handler
  const onSubmit = useCallback(async (data: ActivityFormValues) => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Uploading files...')

    try {
      const urls = await uploadFiles(data)
      
      toast.dismiss(toastId)
      toast.loading('Saving activity...')

      const payload = buildPayload(data, urls)
      let createdActivityId: string | undefined

      if (isEditMode && id) {
        await updateActivity(id, payload)
        if (selectedCategoryIds.length > 0) {
          await activityService.setActivityCategories(id, selectedCategoryIds)
        }
        if (data.type === 'event') {
          await committeeService.saveActivityCommittees(id, committees, user.id)
        }
        createdActivityId = id
        toast.dismiss()
        toast.success('Activity updated!')
      } else {
        const result = await createActivity(payload)
        if (result.success && result.activity && selectedCategoryIds.length > 0) {
          await activityService.setActivityCategories(result.activity.id, selectedCategoryIds)
        }
        if (result.success && result.activity && data.budget_amount && data.budget_amount > 0 && EXECUTIVE_LEVELS.includes(user.role?.toLowerCase() || '')) {
          try {
            const session = await treasuryService.getActiveSession()
            if (session) {
              await treasuryService.allocateBudget({
                session_id: session.id,
                activity_id: result.activity.id,
                allocated_amount: data.budget_amount,
              })
            }
          } catch {}
        }

        if (result.success && result.activity && data.type === 'event') {
          try {
            const projectId = await committeeService.ensureActivityProject(
              result.activity.id,
              result.activity.name,
              user.id
            )
            await committeeService.saveActivityCommittees(
              result.activity.id,
              committees,
              user.id,
              projectId
            )
          } catch (err) {
            console.error('Failed to save committees:', err)
          }
        }

        createdActivityId = result.activity?.id
        toast.dismiss()
        toast.success('Activity created!')
      }

      navigate(`/activities/${createdActivityId || ''}/GET`)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'An error occurred')
      console.error('Submit error:', error)
    } finally {
      setUploading(false)
    }
  }, [user, isEditMode, id, uploadFiles, buildPayload, selectedCategoryIds, createActivity, updateActivity, navigate, committees, officers])

  const onCancel = useCallback(() => navigate('/'), [navigate])

  return {
    register,
    handleSubmit,
    errors,
    watch,
    setValue,
    activityType,
    isPaid,
    isOnline,
    isEditMode,
    loading,
    uploading,
    meetingAgenda,
    selectedCategoryIds,
    activityImage,
    pvAttachment,
    courseAttachment,
    recapImages,
    activityVideo,
    recapVideos,
    committees,
    setCommittees,
    officers,
    setOfficers,
    setMeetingAgenda,
    setSelectedCategoryIds,
    onSubmit,
    onCancel,
  }
}
