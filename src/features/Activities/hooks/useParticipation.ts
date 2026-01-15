import { useState, useEffect, useCallback } from 'react'
import { activityService } from '../services/activityService'
import { toast } from 'sonner'

// Types
export interface Participant {
  id: string
  activity_id: string
  user_id: string
  is_temp: boolean
  rate: number | null
  notes: string | null
  is_interested?: boolean
  registered_at: string
  member?: { id: string; fullname: string; points: number }
}

export interface Member {
  id: string
  fullname: string
}

interface UseParticipationProps {
  activityId: string
  activityPoints: number
}

export function useParticipation({ activityId, activityPoints }: UseParticipationProps) {
  // Data State
  const [participants, setParticipants] = useState<Participant[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [selectedMember, setSelectedMember] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [rate, setRate] = useState(0)
  const [notes, setNotes] = useState('')

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRate, setEditRate] = useState(0)
  const [editNotes, setEditNotes] = useState('')

  // Computed
  const excludeIds = participants.map(p => p.user_id)

  // Load Data
  useEffect(() => {
    loadData()
  }, [activityId])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [participantsData, membersData] = await Promise.all([
        activityService.getParticipations(activityId),
        activityService.getMembers()
      ])
      setParticipants(participantsData || [])
      setMembers(membersData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [activityId])

  // Form Handlers
  const resetForm = useCallback(() => {
    setSelectedMember('')
    setMemberSearch('')
    setRate(0)
    setNotes('')
    setShowForm(false)
  }, [])

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }
    
    if (participants.some(p => p.user_id === selectedMember)) {
      toast.error('Already registered')
      return
    }

    setSubmitting(true)
    try {
      await activityService.addParticipation(
        { 
          activity_id: activityId, 
          user_id: selectedMember, 
          rate: rate > 0 ? rate : undefined, 
          notes: notes.trim() || undefined 
        }
      )
      toast.success(`Added${activityPoints > 0 ? ` (+${activityPoints} pts)` : ''}`)
      resetForm()
      const data = await activityService.getParticipations(activityId)
      setParticipants(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to add')
    } finally {
      setSubmitting(false)
    }
  }, [activityId, activityPoints, selectedMember, rate, notes, participants, resetForm])

  const handleDelete = useCallback(async (p: Participant) => {
    if (!confirm('Remove?')) return
    
    try {
      await activityService.deleteParticipation(p.id, p.user_id, p.is_interested ? 0 : activityPoints)
      setParticipants(prev => prev.filter(x => x.id !== p.id))
      toast.success('Removed')
    } catch (error) {
      toast.error('Failed to remove')
    }
  }, [activityPoints])

  const handleMarkAttendance = useCallback(async (p: Participant, status: 'present' | 'absent') => {
    try {
      if (status === 'present') {
        await activityService.updateParticipation(p.id, {
          is_temp: false,
          is_interested: false
        })
        
        setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, is_interested: false, is_temp: false } : x))
        toast.success(`${p.member?.fullname} marked as present`)
      } else {
        await activityService.deleteParticipation(p.id, p.user_id, 0)
        setParticipants(prev => prev.filter(x => x.id !== p.id))
        toast.success(`${p.member?.fullname} marked as absent`)
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }, [])

  // Edit Handlers
  const startEdit = useCallback((p: Participant) => {
    setEditingId(p.id)
    setEditRate(p.rate || 0)
    setEditNotes(p.notes || '')
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditRate(0)
    setEditNotes('')
  }, [])

  const saveEdit = useCallback(async (id: string) => {
    try {
      await activityService.updateParticipation(id, { 
        rate: editRate > 0 ? editRate : null, 
        notes: editNotes.trim() || null 
      })
      setParticipants(prev => prev.map(p => 
        p.id === id ? { ...p, rate: editRate > 0 ? editRate : null, notes: editNotes.trim() || null } : p
      ))
      toast.success('Updated')
      cancelEdit()
    } catch (error) {
      toast.error('Failed to update')
    }
  }, [editRate, editNotes, cancelEdit])

  // Member Selection Handlers
  const handleSelectMember = useCallback((id: string) => {
    setSelectedMember(id)
    setMemberSearch('')
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedMember('')
    setMemberSearch('')
  }, [])

  const toggleForm = useCallback(() => {
    setShowForm(prev => !prev)
  }, [])

  // Return
  return {
    // Data
    participants,
    members,
    loading,
    submitting,
    showForm,
    excludeIds,
    
    // Form Values
    selectedMember,
    memberSearch,
    rate,
    notes,
    
    // Edit Values
    editingId,
    editRate,
    editNotes,
    
    // Form Setters
    setMemberSearch,
    setRate,
    setNotes,
    
    // Edit Setters
    setEditRate,
    setEditNotes,
    
    // Handlers
    toggleForm,
    handleAdd,
    handleDelete,
    handleMarkAttendance,
    handleSelectMember,
    handleClearSelection,
    startEdit,
    cancelEdit,
    saveEdit,
  }
}
