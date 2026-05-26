import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { treasuryService } from '../services/treasury.service'
import type { CreateTransactionDTO, TransactionFilterDTO, UpdateBudgetDTO, CreateSessionDTO, UpdateSessionDTO } from '../types'

export const TREASURY_KEYS = {
  all: ['treasury'] as const,
  sessions: {
    all: () => [...TREASURY_KEYS.all, 'sessions'] as const,
    list: () => [...TREASURY_KEYS.sessions.all(), 'list'] as const,
    detail: (id: string) => [...TREASURY_KEYS.sessions.all(), id] as const,
    active: () => [...TREASURY_KEYS.sessions.all(), 'active'] as const,
  },
  categories: {
    all: () => [...TREASURY_KEYS.all, 'categories'] as const,
    list: () => [...TREASURY_KEYS.categories.all(), 'list'] as const,
  },
  budgets: {
    all: () => [...TREASURY_KEYS.all, 'budgets'] as const,
    list: (sessionId: string) => [...TREASURY_KEYS.budgets.all(), 'list', sessionId] as const,
    byActivity: (activityId: string) => [...TREASURY_KEYS.budgets.all(), 'activity', activityId] as const,
  },
  transactions: {
    all: () => [...TREASURY_KEYS.all, 'transactions'] as const,
    list: (filters?: TransactionFilterDTO) => [...TREASURY_KEYS.transactions.all(), 'list', { ...filters }] as const,
    detail: (id: string) => [...TREASURY_KEYS.transactions.all(), id] as const,
  },
  dashboard: (sessionId: string) => [...TREASURY_KEYS.all, 'dashboard', sessionId] as const,
  audit: (sessionId?: string) => [...TREASURY_KEYS.all, 'audit', sessionId] as const,
}

// ─── Sessions ─────────────────────────────────────
export function useSessions() {
  return useQuery({
    queryKey: TREASURY_KEYS.sessions.list(),
    queryFn: () => treasuryService.getSessions(),
  })
}

export function useActiveSession() {
  return useQuery({
    queryKey: TREASURY_KEYS.sessions.active(),
    queryFn: () => treasuryService.getActiveSession(),
  })
}

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.sessions.detail(id),
    queryFn: () => treasuryService.getSessionById(id),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSessionDTO) => treasuryService.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionDTO }) =>
      treasuryService.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useActivateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.activateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
    },
  })
}

export function useDeactivateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.deactivateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
    },
  })
}

export function useArchiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.archiveSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.all })
    },
  })
}

// ─── Categories ────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: TREASURY_KEYS.categories.list(),
    queryFn: () => treasuryService.getCategories(),
  })
}

// ─── Activity Budgets ─────────────────────────────
export function useActivityBudgets(sessionId: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.budgets.list(sessionId),
    queryFn: () => treasuryService.getActivityBudgets(sessionId),
    enabled: !!sessionId,
  })
}

export function useActivityBudgetByActivity(activityId: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.budgets.byActivity(activityId),
    queryFn: () => treasuryService.getActivityBudgetByActivity(activityId),
    enabled: !!activityId,
  })
}

export function useAllocateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { session_id: string; activity_id?: string; allocated_amount: number; notes?: string }) =>
      treasuryService.allocateBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
    },
  })
}

export function useUpdateBudgetAllocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetDTO }) =>
      treasuryService.updateBudgetAllocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
    },
  })
}

export function useApproveBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, userId }: { budgetId: string; userId: string }) =>
      treasuryService.approveBudget(budgetId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useCompleteActivityBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ activityBudgetId, userId }: { activityBudgetId: string; userId: string }) =>
      treasuryService.completeActivityBudget(activityBudgetId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useOverspendOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, extraAmount, userId, reason }: { budgetId: string; extraAmount: number; userId: string; reason?: string }) =>
      treasuryService.overrideOverspend(budgetId, extraAmount, userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useReopenBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, userId }: { budgetId: string; userId: string }) =>
      treasuryService.reopenBudget(budgetId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

// ─── Transactions ─────────────────────────────────
export function useTransactions(filters?: TransactionFilterDTO) {
  return useQuery({
    queryKey: TREASURY_KEYS.transactions.list(filters),
    queryFn: () => treasuryService.getTransactions(filters),
  })
}

export function useTransactionDetail(id: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.transactions.detail(id),
    queryFn: () => treasuryService.getTransactionById(id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionDTO) => treasuryService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.transactions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useVerifyTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      treasuryService.verifyTransaction(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.transactions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => treasuryService.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.transactions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.budgets.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

export function useRejectTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      treasuryService.rejectTransaction(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.transactions.all() })
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.sessions.all() })
      queryClient.invalidateQueries({ queryKey: [...TREASURY_KEYS.all, 'dashboard'] })
    },
  })
}

// ─── Dashboard ────────────────────────────────────
export interface DashboardMetrics {
  planned_budget: number
  reserved_amount: number
  remaining_amount: number
  total_allocated: number
  total_spent: number
  total_gains: number
  current_balance: number
  pending_count: number
}

export function useDashboardMetrics(sessionId: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.dashboard(sessionId),
    queryFn: async (): Promise<DashboardMetrics> => {
      const session = await treasuryService.getSessionById(sessionId)
      const budgets = await treasuryService.getActivityBudgets(sessionId)
      const transactions = await treasuryService.getTransactions({ session_id: sessionId })

      const completedBudgetIds = new Set(
        budgets.filter((b) => b.status === 'completed').map((b) => b.id)
      )

      const approvedPaidExpenses = transactions
        .filter((t) =>
          t.status === 'approved' && t.type === 'expense_paid' &&
          (!t.activity_budget_id || completedBudgetIds.has(t.activity_budget_id))
        )
        .reduce((sum, t) => sum + t.amount, 0)

      const approvedGains = transactions
        .filter((t) =>
          t.status === 'approved' && t.type === 'gain' &&
          (!t.activity_budget_id || completedBudgetIds.has(t.activity_budget_id))
        )
        .reduce((sum, t) => sum + t.amount, 0)

      const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0)
      const pendingCount = transactions.filter((t) => t.status === 'pending').length

      return {
        planned_budget: session.planned_budget,
        reserved_amount: session.reserved_amount,
        remaining_amount: session.remaining_amount,
        total_allocated: totalAllocated,
        total_spent: approvedPaidExpenses,
        total_gains: approvedGains,
        current_balance: approvedGains - approvedPaidExpenses,
        pending_count: pendingCount,
      }
    },
    enabled: !!sessionId,
  })
}

// ─── Audit ─────────────────────────────────────────
export function useAuditLogs(sessionId?: string) {
  return useQuery({
    queryKey: TREASURY_KEYS.audit(sessionId),
    queryFn: () => treasuryService.getAuditLogs(sessionId),
  })
}

// ─── Upload ────────────────────────────────────────
export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, transactionId }: { file: File; transactionId: string }) =>
      treasuryService.uploadAttachment(file, transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.transactions.all() })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: 'expense' | 'gain' }) =>
      treasuryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TREASURY_KEYS.categories.all() })
    },
  })
}
