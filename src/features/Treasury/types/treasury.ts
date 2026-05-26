export interface TreasurySession {
  id: string
  planned_budget: number
  current_balance: number
  reserved_amount: number
  spent_amount: number
  remaining_amount: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export interface TreasuryCategory {
  id: string
  name: string
  type: 'expense' | 'gain'
  is_active: boolean
  created_at: string
}

export type ActivityBudgetStatus = 'pending' | 'approved' | 'completed'

export interface ActivityBudget {
  id: string
  session_id: string
  activity_id: string | null
  allocated_amount: number
  spent_amount: number
  remaining_amount: number
  status: ActivityBudgetStatus
  approved_at: string | null
  approved_by: string | null
  completed_at: string | null
  completed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  activities?: {
    id: string
    name: string
    activity_begin_date: string
  }
}

export interface Transaction {
  id: string
  session_id: string
  activity_budget_id: string
  category_id: string
  type: 'gain' | 'expense_paid' | 'expense_reserved'
  amount: number
  description: string | null
  date: string
  status: 'pending' | 'approved' | 'rejected' | 'archived'
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  paid_at: string | null
  created_by: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  categories?: { name: string }
  activity_budgets?: ActivityBudget
  profiles?: { fullname: string }
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  transaction_id: string
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
}

export interface AuditLog {
  id: string
  session_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  performed_by: string
  created_at: string
  profiles?: { fullname: string }
}
