
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { activityService } from '../services/activityService'
import type { Activity } from '../models/Activity'
import type { Category } from '../../Members/services/members.service'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function useActivityDetail(id: string | undefined) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [otherActivities, setOtherActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true)
      const [data, cats, allActs] = await Promise.all([
        activityService.getActivityById(activityId),
        activityService.getActivityCategories(activityId),
        activityService.getActivities()
      ])
      setActivity(data)
      setCategories(cats)
      setOtherActivities(allActs.filter(a => a.id !== activityId).slice(0, 3))
      
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

  return {
    activity,
    categories,
    otherActivities,
    loading,
    deleteActivity,
    refetch: () => id && loadActivity(id)
  }
}
