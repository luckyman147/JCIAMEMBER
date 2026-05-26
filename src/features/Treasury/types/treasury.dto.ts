import type { TreasuryCategory } from './treasury'

export interface CreateSessionDTO {
  planned_budget: number
  reserved_amount: number
  spent_amount: number
  remaining_amount: number
  start_date: string
  end_date: string
}

export interface UpdateSessionDTO {
  planned_budget?: number
  start_date?: string
  end_date?: string
  status?: 'draft' | 'active' | 'archived'
}

export interface CreateTransactionDTO {
  session_id: string
  activity_budget_id?: string
  category_id: string
  type: 'gain' | 'expense_paid' | 'expense_reserved'
  amount: number
  description?: string
  date: string
}

export interface VerifyTransactionDTO {
  id: string
  userId: string
}

export interface UpdateTransactionDTO {
  category_id?: string
  amount?: number
  description?: string
  date?: string
}

export interface TransactionFilterDTO {
  session_id?: string
  activity_budget_id?: string
  category_id?: string
  status?: string
  type?: 'gain' | 'expense_paid' | 'expense_reserved'
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface AllocateBudgetDTO {
  session_id: string
  activity_id?: string
  allocated_amount: number
  status?: 'pending' | 'approved'
  notes?: string
}

export interface UpdateBudgetDTO {
  allocated_amount: number
  notes?: string
  status?: 'pending' | 'approved'
}

export interface ApproveBudgetDTO {
  budgetId: string
  userId: string
}

export interface CompleteActivityDTO {
  activityBudgetId: string
  userId: string
}

export interface OverspendOverrideDTO {
  budgetId: string
  extraAmount: number
  userId: string
  reason?: string
}

export type CategoryGroup = {
  type: 'expense' | 'gain'
  categories: TreasuryCategory[]
}

export type ExpenseSubtype = 'paid' | 'reserved'
