import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { outingService } from '../services/outing.service'
import type { Outing, CreateOutingDTO, UpdateOutingDTO, OutingFilters } from '../types/outing.types'

export const OUTING_KEYS = {
  all: ['outings'] as const,
  lists: () => [...OUTING_KEYS.all, 'list'] as const,
  list: (filters?: OutingFilters) => [...OUTING_KEYS.lists(), filters ?? {}] as const,
  details: () => [...OUTING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...OUTING_KEYS.details(), id] as const,
  members: (id: string) => [...OUTING_KEYS.detail(id), 'members'] as const,
  invitations: () => [...OUTING_KEYS.all, 'invitations'] as const,
}

export function useOutings(filters?: OutingFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: OUTING_KEYS.list(filters),
    queryFn: () => outingService.getOutings(filters),
  })

  return {
    outings: (data?.data ?? []) as Outing[],
    count: data?.count ?? 0,
    loading: isLoading,
    error,
    refetch,
  }
}

export function useOuting(id: string) {
  return useQuery({
    queryKey: OUTING_KEYS.detail(id),
    queryFn: () => outingService.getOutingById(id),
    enabled: !!id,
  })
}

export function useCreateOuting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOutingDTO) => outingService.createOuting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.lists() })
    },
  })
}

export function useUpdateOuting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOutingDTO }) =>
      outingService.updateOuting(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.detail(variables.id) })
    },
  })
}

export function useDeleteOuting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => outingService.deleteOuting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.lists() })
    },
  })
}

export function useJoinOuting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (outingId: string) => outingService.joinOuting(outingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.all })
    },
  })
}

export function useLeaveOuting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (outingId: string) => outingService.leaveOuting(outingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.all })
    },
  })
}

export function useInviteMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ outingId, inviteeIds }: { outingId: string; inviteeIds: string[] }) =>
      outingService.inviteMembers(outingId, inviteeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.all })
    },
  })
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invitationId, status }: { invitationId: string; status: 'accepted' | 'rejected' }) =>
      outingService.respondToInvitation(invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.all })
      queryClient.invalidateQueries({ queryKey: OUTING_KEYS.invitations() })
    },
  })
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: OUTING_KEYS.invitations(),
    queryFn: () => outingService.getPendingInvitations(),
  })
}
