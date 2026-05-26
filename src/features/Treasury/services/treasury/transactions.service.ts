import supabase from '../../../../utils/supabase'
import type { ActivityBudget, Attachment, AuditLog, Transaction } from '../../types'
import type { CreateTransactionDTO, UpdateTransactionDTO, TransactionFilterDTO } from '../../types'
import { updateSessionBudget, revertSessionBudget, updateActivityBudgetSpent } from './helpers'

export const transactionsService = {
  getTransactions: async (filters?: TransactionFilterDTO): Promise<Transaction[]> => {
    let query = supabase
      .from('treasury_transactions')
      .select('*, categories:treasury_categories(name), activity_budgets:treasury_activity_budgets!inner(allocated_amount, activities(name))')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters) {
      if (filters.session_id) query = query.eq('session_id', filters.session_id)
      if (filters.activity_budget_id) query = query.eq('activity_budget_id', filters.activity_budget_id)
      if (filters.category_id) query = query.eq('category_id', filters.category_id)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.type) query = query.eq('type', filters.type)
      if (filters.date_from) query = query.gte('date', filters.date_from)
      if (filters.date_to) query = query.lte('date', filters.date_to)
      if (filters.search) query = query.ilike('description', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Transaction[]
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('treasury_transactions')
      .select('*, categories:treasury_categories(name), activity_budgets:treasury_activity_budgets!inner(allocated_amount, activities(name)), attachments(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Transaction
  },

  createTransaction: async (payload: CreateTransactionDTO): Promise<Transaction & { isDedup?: boolean; autoApproved?: boolean }> => {
    const { data: existing } = await supabase
      .from('treasury_transactions')
      .select('*')
      .eq('date', payload.date)
      .eq('category_id', payload.category_id)
      .eq('type', payload.type)
      .eq('amount', payload.amount)
      .eq('is_verified', true)
      .maybeSingle()

    if (existing) {
      const { error: updateErr } = await supabase
        .from('treasury_transactions')
        .update({
          description: payload.description || existing.description,
          session_id: payload.session_id,
          activity_budget_id: payload.activity_budget_id || existing.activity_budget_id,
        })
        .eq('id', existing.id)
      if (updateErr) throw updateErr
      return { ...(existing as Transaction), isDedup: true }
    }

    let budgetId = payload.activity_budget_id

    if (!budgetId) {
      const { data: general } = await supabase
        .from('treasury_activity_budgets')
        .select('id')
        .eq('session_id', payload.session_id)
        .is('activity_id', null)
        .maybeSingle()

      if (general) {
        budgetId = general.id
      } else {
        const { data: anyBudget } = await supabase
          .from('treasury_activity_budgets')
          .select('id')
          .eq('session_id', payload.session_id)
          .limit(1)
          .maybeSingle()

        if (anyBudget) budgetId = anyBudget.id
      }
    }

    // Check if this belongs to an approved activity budget → auto-approve
    let autoApproved = false
    if (budgetId) {
      const { data: budget } = await supabase
        .from('treasury_activity_budgets')
        .select('status')
        .eq('id', budgetId)
        .maybeSingle()
      if (budget && budget.status === 'approved' && (budget as any).activity_id !== null) {
        autoApproved = true
      }
    }

    const { data, error } = await supabase
      .from('treasury_transactions')
      .insert({
        session_id: payload.session_id,
        activity_budget_id: budgetId,
        category_id: payload.category_id,
        type: payload.type,
        amount: payload.amount,
        description: payload.description || null,
        date: payload.date,
        status: autoApproved ? 'approved' : 'pending',
        is_verified: autoApproved ? true : false,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()
    if (error) throw error

    const created = data as Transaction

    // Auto-approve: immediately update activity budget spent/remaining
    if (autoApproved && (payload.type === 'expense_paid' || payload.type === 'expense_reserved')) {
      const { data: budget } = await supabase
        .from('treasury_activity_budgets')
        .select('spent_amount, remaining_amount, allocated_amount')
        .eq('id', budgetId)
        .single()
      if (budget) {
        const b = budget as { spent_amount: number; remaining_amount: number; allocated_amount: number }
        const newBudget = updateActivityBudgetSpent(
          { spent_amount: b.spent_amount, remaining_amount: b.remaining_amount, allocated_amount: b.allocated_amount },
          payload.amount,
          true,
        )
        await supabase.from('treasury_activity_budgets').update(newBudget).eq('id', budgetId)
      }
    }

    return { ...(created as Transaction), autoApproved }
  },

  updateTransaction: async (id: string, payload: UpdateTransactionDTO): Promise<void> => {
    const { error } = await supabase
      .from('treasury_transactions')
      .update(payload)
      .eq('id', id)
      .eq('status', 'pending')
    if (error) throw error
  },

  verifyTransaction: async (id: string, userId: string): Promise<void> => {
    const { data: txn, error: fetchError } = await supabase
      .from('treasury_transactions')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError

    const transaction = txn as Transaction & {
      type: 'gain' | 'expense_paid' | 'expense_reserved'
      amount: number
      session_id: string
      activity_budget_id: string
    }

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('planned_budget, reserved_amount, spent_amount, remaining_amount')
      .eq('id', transaction.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { planned_budget: number; reserved_amount: number; spent_amount: number; remaining_amount: number }

    let activityBudgetData: ActivityBudget | null = null

    if (transaction.activity_budget_id) {
      const { data: ab, error: abError } = await supabase
        .from('treasury_activity_budgets')
        .select('*')
        .eq('id', transaction.activity_budget_id)
        .single()
      if (abError) throw abError
      activityBudgetData = ab as ActivityBudget
    }

    const isExpense = transaction.type !== 'gain'

    if (isExpense) {
      if (activityBudgetData) {
        if (transaction.amount > activityBudgetData.remaining_amount) {
          throw new Error(`Insufficient activity budget remaining: need ${transaction.amount}, only ${activityBudgetData.remaining_amount} available`)
        }
      } else {
        if (transaction.amount > s.remaining_amount) {
          throw new Error(`Insufficient remaining budget: need ${transaction.amount}, only ${s.remaining_amount} available`)
        }
      }
    }

    await supabase
      .from('treasury_transactions')
      .update({
        status: 'approved',
        is_verified: true,
        verified_by: userId,
        verified_at: new Date().toISOString(),
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (transaction.type === 'gain' && activityBudgetData) {
      // Gains on activity budgets: no session change until completion, regardless of budget status
    } else if (transaction.type === 'gain') {
      const updated = updateSessionBudget('gain', transaction.amount, s)
      await supabase.from('treasury_sessions').update(updated).eq('id', transaction.session_id)
    } else if (transaction.type === 'expense_paid' && activityBudgetData) {
      const b = activityBudgetData
      const newBudget = updateActivityBudgetSpent(
        { spent_amount: b.spent_amount, remaining_amount: b.remaining_amount, allocated_amount: b.allocated_amount },
        transaction.amount,
        true,
      )
      await supabase.from('treasury_activity_budgets').update(newBudget).eq('id', b.id)
    } else if (transaction.type === 'expense_paid') {
      const updated = updateSessionBudget('expense_paid', transaction.amount, s)
      await supabase.from('treasury_sessions').update(updated).eq('id', transaction.session_id)
    } else if (transaction.type === 'expense_reserved' && activityBudgetData) {
      const b = activityBudgetData
      const newBudget = updateActivityBudgetSpent(
        { spent_amount: b.spent_amount, remaining_amount: b.remaining_amount, allocated_amount: b.allocated_amount },
        transaction.amount,
        true,
      )
      await supabase.from('treasury_activity_budgets').update(newBudget).eq('id', b.id)
    } else if (transaction.type === 'expense_reserved') {
      const updated = updateSessionBudget('expense_reserved', transaction.amount, s)
      await supabase.from('treasury_sessions').update(updated).eq('id', transaction.session_id)
    }
  },

  markAsPaid: async (id: string): Promise<void> => {
    const { data: txn, error: fetchError } = await supabase
      .from('treasury_transactions')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError

    const transaction = txn as Transaction & {
      type: 'gain' | 'expense_paid' | 'expense_reserved'
      amount: number
      session_id: string
      activity_budget_id: string
    }

    if (transaction.type !== 'expense_reserved') throw new Error('Only reserved expenses can be marked as paid')
    if (transaction.status !== 'approved') throw new Error('Transaction must be approved before marking as paid')

    const { data: session, error: sessionError } = await supabase
      .from('treasury_sessions')
      .select('reserved_amount, spent_amount')
      .eq('id', transaction.session_id)
      .single()
    if (sessionError) throw sessionError

    const s = session as { reserved_amount: number; spent_amount: number }

    let activityBudgetData: ActivityBudget | null = null

    if (transaction.activity_budget_id) {
      const { data: ab, error: abError } = await supabase
        .from('treasury_activity_budgets')
        .select('*')
        .eq('id', transaction.activity_budget_id)
        .single()
      if (abError) throw abError
      activityBudgetData = ab as ActivityBudget
    }

    if (activityBudgetData) {
      if (activityBudgetData.remaining_amount < transaction.amount) {
        throw new Error(`Insufficient activity budget remaining: need ${transaction.amount}, only ${activityBudgetData.remaining_amount} available`)
      }
    } else {
      if (transaction.amount > s.reserved_amount) {
        throw new Error(`Cannot pay ${transaction.amount}, only ${s.reserved_amount} is currently reserved`)
      }
    }

    await supabase
      .from('treasury_transactions')
      .update({ type: 'expense_paid', paid_at: new Date().toISOString() })
      .eq('id', id)

    if (activityBudgetData) {
      // Activity budget expenses: no session change until completion
    } else {
      await supabase
        .from('treasury_sessions')
        .update({
          reserved_amount: (s.reserved_amount || 0) - transaction.amount,
          spent_amount: (s.spent_amount || 0) + transaction.amount,
        })
        .eq('id', transaction.session_id)
    }
  },

  rejectTransaction: async (id: string, reason: string): Promise<void> => {
    const { data: txn, error: fetchError } = await supabase
      .from('treasury_transactions')
      .select('type, amount, session_id, activity_budget_id, is_verified, status')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError

    const transaction = txn as {
      type: 'gain' | 'expense_paid' | 'expense_reserved'
      amount: number
      session_id: string
      activity_budget_id: string
      is_verified: boolean
      status: string
    }

    if (transaction.is_verified && transaction.status === 'approved') {
      const { data: session, error: sessionError } = await supabase
        .from('treasury_sessions')
        .select('planned_budget, reserved_amount, spent_amount, remaining_amount')
        .eq('id', transaction.session_id)
        .single()
      if (sessionError) throw sessionError

      const s = session as { planned_budget: number; reserved_amount: number; spent_amount: number; remaining_amount: number }

      let budgetData: { status: string; spent_amount: number; remaining_amount: number; allocated_amount: number } | null = null

      if (transaction.activity_budget_id) {
        const { data: ab } = await supabase
          .from('treasury_activity_budgets')
          .select('status, spent_amount, remaining_amount, allocated_amount')
          .eq('id', transaction.activity_budget_id)
          .maybeSingle()
        if (ab) {
          budgetData = ab as { status: string; spent_amount: number; remaining_amount: number; allocated_amount: number }
        }
      }

      // Revert activity budget if it was changed at verification
      if (budgetData && (transaction.type === 'expense_paid' || transaction.type === 'expense_reserved')) {
        const reverted = updateActivityBudgetSpent(
          { spent_amount: budgetData.spent_amount, remaining_amount: budgetData.remaining_amount, allocated_amount: budgetData.allocated_amount },
          transaction.amount,
          false,
        )
        await supabase.from('treasury_activity_budgets').update(reverted).eq('id', transaction.activity_budget_id)
      }

      // Revert session budget changes based on verification type
      // For activity budgets, no session changes happened at verification
      if (budgetData) {
        // Session was not changed - only activity budget was (already reverted above)
      } else if (transaction.type === 'gain') {
        const reverted = revertSessionBudget('gain', transaction.amount, s)
        await supabase.from('treasury_sessions').update(reverted).eq('id', transaction.session_id)
      } else if (transaction.type === 'expense_paid') {
        const reverted = revertSessionBudget('expense_paid', transaction.amount, s)
        await supabase.from('treasury_sessions').update(reverted).eq('id', transaction.session_id)
      } else if (transaction.type === 'expense_reserved') {
        const reverted = revertSessionBudget('expense_reserved', transaction.amount, s)
        await supabase.from('treasury_sessions').update(reverted).eq('id', transaction.session_id)
      }
    }

    const { error } = await supabase
      .from('treasury_transactions')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id)
    if (error) throw error
  },

  uploadAttachment: async (file: File, transactionId: string): Promise<Attachment> => {
    const ext = file.name.split('.').pop()
    const path = `${transactionId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('treasury-attachments')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('treasury-attachments')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from('treasury_attachments')
      .insert({
        transaction_id: transactionId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()
    if (error) throw error
    return data as Attachment
  },

  deleteAttachment: async (id: string, fileUrl: string): Promise<void> => {
    const path = fileUrl.split('/treasury-attachments/')[1]
    if (path) {
      await supabase.storage.from('treasury-attachments').remove([path])
    }

    const { error } = await supabase
      .from('treasury_attachments')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  logAudit: async (data: {
    session_id?: string
    action: string
    entity_type: string
    entity_id: string
    old_values?: Record<string, unknown>
    new_values?: Record<string, unknown>
  }): Promise<void> => {
    const { error } = await supabase
      .from('treasury_audit_logs')
      .insert({
        session_id: data.session_id || null,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        old_values: data.old_values || null,
        new_values: data.new_values || null,
        performed_by: (await supabase.auth.getUser()).data.user?.id,
      })
    if (error) throw error
  },

  getAuditLogs: async (sessionId?: string): Promise<AuditLog[]> => {
    let query = supabase
      .from('treasury_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (sessionId) query = query.eq('session_id', sessionId)

    const { data, error } = await query
    if (error) throw error
    return data as AuditLog[]
  },
}
