
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { activityService } from '../services/activityService'
import { committeeService } from '../services/committeeService'
import type { Activity, EventActivity } from '../models/Activity'
import type { Category } from '../../Members/services/members.service'
import type { ActivityCommittee } from '../models/Committee'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface SimpleMember {
  id: string
  fullname: string
  avatar_url?: string
}

export function useActivityDetail(id: string | undefined) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [otherActivities, setOtherActivities] = useState<Activity[]>([])
  const [committees, setCommittees] = useState<ActivityCommittee[]>([])
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true)
      const [data, cats, allActs, fetchedCommittees, allMembers] = await Promise.all([
        activityService.getActivityById(activityId),
        activityService.getActivityCategories(activityId),
        activityService.getActivities(),
        committeeService.getActivityCommittees(activityId),
        activityService.getMembers(),
      ])
      setActivity(data)
      setCategories(cats)
      setOtherActivities(allActs.filter(a => a.id !== activityId).slice(0, 3))
      setCommittees(fetchedCommittees)
      setMembers(allMembers || [])
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error loading activity:', error)
      navigate('/activities') 
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (id) {
      loadActivity(id)
    }
  }, [id, loadActivity])

  const deleteActivity = async () => {
    if (!activity || !confirm(t('activities.deleteConfirm'))) return false
    
    try {
      await activityService.deleteActivity(activity.id)
      toast.success(t('activities.activityDeleted'))
      navigate('/')
      return true
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error(t('activities.deleteFailed'))
      return false
    }
  }

  const isEvent = activity?.type === 'event'
  const eventActivity = isEvent ? (activity as EventActivity) : null

  return {
    activity,
    categories,
    otherActivities,
    committees,
    members,
    loading,
    deleteActivity,
    refetch: () => id && loadActivity(id),
    treasurerId: eventActivity?.treasurer_id,
    generalSecretaryId: eventActivity?.general_secretary_id,
    eventChefId: eventActivity?.event_chef_id,
  }
}
