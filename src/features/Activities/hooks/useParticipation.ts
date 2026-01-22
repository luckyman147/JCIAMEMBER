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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
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
    setSelectedMemberIds([])
    setMemberSearch('')
    setRate(0)
    setNotes('')
    setShowForm(false)
  }, [])

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedMemberIds.length === 0) {
      toast.error('Please select at least one member')
      return
    }
    
    setSubmitting(true)
    let successCount = 0
    let failCount = 0

    try {
      await Promise.all(selectedMemberIds.map(async (userId) => {
        if (participants.some(p => p.user_id === userId)) {
          failCount++
          return
        }
        
        try {
          await activityService.addParticipation({ 
            activity_id: activityId, 
            user_id: userId, 
            rate: rate > 0 ? rate : undefined, 
            notes: notes.trim() || undefined 
          })
          successCount++
        } catch (err) {
          failCount++
          console.error(`Failed to add member ${userId}:`, err)
        }
      }))

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} member(s)${activityPoints > 0 ? ` (+${activityPoints * successCount} pts total)` : ''}`)
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} member(s) (maybe already registered)`)
      }
      
      resetForm()
      const data = await activityService.getParticipations(activityId)
      setParticipants(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Error updating participation')
    } finally {
      setSubmitting(false)
    }
  }, [activityId, activityPoints, selectedMemberIds, rate, notes, participants, resetForm])

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
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setMemberSearch('')
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedMemberIds([])
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
    selectedMemberIds,
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
