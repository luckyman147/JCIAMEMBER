import supabase from '../../../../utils/supabase'
import type { ActivityBudget, TreasuryCategory } from '../../types'
import type { AllocateBudgetDTO, UpdateBudgetDTO } from '../../types'

export const budgetsService = {
  getCategories: async (): Promise<TreasuryCategory[]> => {
    const { data, error } = await supabase
      .from('treasury_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return data as TreasuryCategory[]
  },

  createCategory: async (payload: { name: string; type: 'expense' | 'gain' }): Promise<TreasuryCategory> => {
    const { data, error } = await supabase
      .from('treasury_categories')
      .insert({ name: payload.name, type: payload.type })
      .select()
      .single()
    if (error) throw error
    return data as TreasuryCategory
  },

  getActivityBudgets: async (sessionId: string): Promise<ActivityBudget[]> => {
    const { data, error } = await supabase
      .from('treasury_activity_budgets')
      .select('*, activities(id, name, activity_begin_date)')
      .eq('session_id', sessionId)
      .order('created_at')
    if (error) throw error
    return data as ActivityBudget[]
  },

  getActivityBudgetByActivity: async (activityId: string): Promise<ActivityBudget | null> => {
    const { data, error } = await supabase
      .from('treasury_activity_budgets')
      .select('*, activities(id, name, activity_begin_date)')
      .eq('activity_id', activityId)
      .maybeSingle()
    if (error) throw error
    return data as ActivityBudget | null
  },

  allocateBudget: async (payload: AllocateBudgetDTO): Promise<ActivityBudget> => {
    const { data, error } = await supabase
      .from('treasury_activity_budgets')
      .insert({
        session_id: payload.session_id,
        activity_id: payload.activity_id || null,
        allocated_amount: payload.allocated_amount,
        spent_amount: 0,
        remaining_amount: payload.allocated_amount,
        status: 'pending',
        notes: payload.notes || null,
      })
      .select()
      .single()
    if (error) throw error
    return data as ActivityBudget
  },

  approveBudget: async (budgetId: string, userId: string): Promise<void> => {
    const { data: budget, error: fetchError } = await supabase
      .from('treasury_activity_budgets')
      .select('*')
      .eq('id', budgetId)
      .single()
    if (fetchError) throw fetchError

    const b = budget as ActivityBudget
    if (b.status !== 'pending') throw new Error('Only pending budgets can be approved')

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('reserved_amount, remaining_amount')
      .eq('id', b.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { reserved_amount: number; remaining_amount: number }

    if (b.allocated_amount > s.remaining_amount) {
      throw new Error(`Insufficient remaining budget: need ${b.allocated_amount}, only ${s.remaining_amount} available`)
    }

    const { error: updateError } = await supabase
      .from('treasury_activity_budgets')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
      .eq('id', budgetId)
    if (updateError) throw updateError

    await supabase
      .from('treasury_sessions')
      .update({
        reserved_amount: (s.reserved_amount || 0) + b.allocated_amount,
        remaining_amount: s.remaining_amount - b.allocated_amount,
      })
      .eq('id', b.session_id)
  },

  updateBudgetAllocation: async (id: string, payload: UpdateBudgetDTO): Promise<void> => {
    const { data: budget, error: fetchError } = await supabase
      .from('treasury_activity_budgets')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError

    const b = budget as ActivityBudget
    if (b.status === 'completed') throw new Error('Cannot edit a completed budget')

    const currentSpent = b.spent_amount || 0

    if (b.status === 'approved') {
      const diff = payload.allocated_amount - b.allocated_amount
      if (diff !== 0) {
        const { data: session, error: sessionError } = await supabase
          .from('treasury_sessions')
          .select('reserved_amount, remaining_amount')
          .eq('id', b.session_id)
          .single()
        if (sessionError) throw sessionError

        const s = session as { reserved_amount: number; remaining_amount: number }

        if (diff > 0 && diff > s.remaining_amount) {
          throw new Error(`Insufficient remaining budget to increase allocation by ${diff}`)
        }

        await supabase
          .from('treasury_sessions')
          .update({
            reserved_amount: (s.reserved_amount || 0) + diff,
            remaining_amount: s.remaining_amount - diff,
          })
          .eq('id', b.session_id)
      }
    }

    const remaining = payload.allocated_amount - currentSpent

    const { error } = await supabase
      .from('treasury_activity_budgets')
      .update({
        allocated_amount: payload.allocated_amount,
        remaining_amount: Math.max(0, remaining),
        notes: payload.notes || null,
      })
      .eq('id', id)
    if (error) throw error
  },

  deleteBudget: async (id: string): Promise<void> => {
    const { error: txnErr } = await supabase
      .from('treasury_transactions')
      .delete()
      .eq('activity_budget_id', id)

    if (txnErr) throw txnErr

    const { error } = await supabase
      .from('treasury_activity_budgets')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  completeActivityBudget: async (activityBudgetId: string, userId: string): Promise<{ netCost: number; overspend: boolean }> => {
    const { data: budget, error: fetchError } = await supabase
      .from('treasury_activity_budgets')
      .select('*')
      .eq('id', activityBudgetId)
      .single()
    if (fetchError) throw fetchError

    const b = budget as ActivityBudget
    if (b.status === 'completed') throw new Error('Activity budget is already completed')
    if (b.status !== 'approved') throw new Error('Only approved budgets can be completed')

    const { data: allTxns, error: txnError } = await supabase
      .from('treasury_transactions')
      .select('type, amount, status')
      .eq('activity_budget_id', activityBudgetId)
    if (txnError) throw txnError

    const transactions = allTxns as { type: string; amount: number; status: string }[]

    const totalGains = transactions
      .filter((t) => t.type === 'gain' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => (t.type === 'expense_paid' || t.type === 'expense_reserved') && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    const netCost = totalExpenses - totalGains
    const overspend = netCost > b.allocated_amount
    const unspent = Math.max(0, b.allocated_amount - b.spent_amount)
    const actualExpenses = b.spent_amount

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('planned_budget, reserved_amount, spent_amount, remaining_amount')
      .eq('id', b.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { planned_budget: number; reserved_amount: number; spent_amount: number; remaining_amount: number }

    await supabase
      .from('treasury_sessions')
      .update({
        planned_budget: (s.planned_budget || 0) + totalGains,
        reserved_amount: Math.max(0, (s.reserved_amount || 0) - actualExpenses - unspent),
        spent_amount: (s.spent_amount || 0) + actualExpenses,
        remaining_amount: (s.remaining_amount || 0) + totalGains + unspent,
      })
      .eq('id', b.session_id)

    await supabase
      .from('treasury_activity_budgets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId,
        remaining_amount: 0,
      })
      .eq('id', activityBudgetId)

    return { netCost, overspend }
  },

  overrideOverspend: async (budgetId: string, extraAmount: number, userId: string, reason?: string): Promise<void> => {
    const { data: budget, error: fetchError } = await supabase
      .from('treasury_activity_budgets')
      .select('*')
      .eq('id', budgetId)
      .single()
    if (fetchError) throw fetchError

    const b = budget as ActivityBudget
    if (b.status !== 'approved') throw new Error('Only approved budgets can have overspend overrides')

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('reserved_amount, remaining_amount')
      .eq('id', b.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { reserved_amount: number; remaining_amount: number }

    if (extraAmount > s.remaining_amount) {
      throw new Error(`Insufficient remaining budget: need ${extraAmount}, only ${s.remaining_amount} available`)
    }

    const newAllocated = b.allocated_amount + extraAmount
    const newRemaining = b.spent_amount ? newAllocated - b.spent_amount : newAllocated

    await supabase
      .from('treasury_activity_budgets')
      .update({
        allocated_amount: newAllocated,
        remaining_amount: Math.max(0, newRemaining),
      })
      .eq('id', budgetId)

    await supabase
      .from('treasury_sessions')
      .update({
        reserved_amount: (s.reserved_amount || 0) + extraAmount,
        remaining_amount: s.remaining_amount - extraAmount,
      })
      .eq('id', b.session_id)

    await supabase.from('treasury_audit_logs').insert({
      session_id: b.session_id,
      action: 'OVERRIDE_OVERSPEND',
      entity_type: 'activity_budget',
      entity_id: budgetId,
      new_values: { allocated_amount: newAllocated, extra_amount: extraAmount, reason: reason || null },
      performed_by: userId,
    })
  },

  reopenBudget: async (budgetId: string, _userId: string): Promise<void> => {
    const { data: budget, error: fetchError } = await supabase
      .from('treasury_activity_budgets')
      .select('*')
      .eq('id', budgetId)
      .single()
    if (fetchError) throw fetchError

    const b = budget as ActivityBudget
    if (b.status !== 'completed') throw new Error('Only completed budgets can be reopened')

    const spent = b.spent_amount || 0
    const unspent = Math.max(0, b.allocated_amount - spent)

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('reserved_amount, spent_amount, remaining_amount')
      .eq('id', b.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { reserved_amount: number; spent_amount: number; remaining_amount: number }

    if (unspent > s.remaining_amount) {
      throw new Error(`Insufficient remaining budget to reopen: need ${unspent}, only ${s.remaining_amount} available`)
    }

    // Restore full allocation: move spent back to reserved, plus re-reserve unspent
    await supabase
      .from('treasury_sessions')
      .update({
        reserved_amount: (s.reserved_amount || 0) + b.allocated_amount,
        spent_amount: Math.max(0, (s.spent_amount || 0) - spent),
        remaining_amount: s.remaining_amount - unspent,
      })
      .eq('id', b.session_id)

    // Reset activity budget to approved state with full allocation available
    await supabase
      .from('treasury_activity_budgets')
      .update({
        status: 'approved',
        spent_amount: 0,
        remaining_amount: b.allocated_amount,
        completed_at: null,
        completed_by: null,
      })
      .eq('id', budgetId)
  },

  getActivityBudgetTransactions: async (budgetId: string): Promise<{ totalGains: number; totalExpenses: number }> => {
    const { data, error } = await supabase
      .from('treasury_transactions')
      .select('type, amount, status')
      .eq('activity_budget_id', budgetId)
    if (error) throw error

    const transactions = data as { type: string; amount: number; status: string }[]
    const totalGains = transactions
      .filter((t) => t.type === 'gain' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter((t) => (t.type === 'expense_paid' || t.type === 'expense_reserved') && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    return { totalGains, totalExpenses }
  },
}
