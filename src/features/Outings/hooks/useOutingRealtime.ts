import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import supabase from '../../../utils/supabase'
import { OUTING_KEYS } from './useOutings'

export function useOutingRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('outings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'outings' },
        () => {
          queryClient.invalidateQueries({ queryKey: OUTING_KEYS.lists() })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'outing_members' },
        () => {
          queryClient.invalidateQueries({ queryKey: OUTING_KEYS.all })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
