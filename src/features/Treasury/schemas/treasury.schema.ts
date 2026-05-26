import * as z from 'zod'

export const TransactionSchema = z.object({
  session_id: z.string().min(1, 'Session is required'),
  activity_budget_id: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  type: z.enum(['expense_paid', 'expense_reserved', 'gain']),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

export type TransactionFormValues = z.infer<typeof TransactionSchema>

export const SessionSchema = z.object({
  planned_budget: z.number().min(0, 'Budget must be 0 or more'),
  reserved_amount: z.number().min(0, 'Must be 0 or more').default(0),
  spent_amount: z.number().min(0, 'Must be 0 or more').default(0),
  remaining_amount: z.number().min(0, 'Must be 0 or more').default(0),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
})

export const AllocateBudgetSchema = z.object({
  session_id: z.string().min(1),
  activity_id: z.string().optional(),
  allocated_amount: z.number().min(0, 'Amount must be 0 or more'),
  notes: z.string().optional(),
})

export const UpdateBudgetSchema = z.object({
  allocated_amount: z.number().min(0, 'Amount must be 0 or more'),
  notes: z.string().optional(),
})
