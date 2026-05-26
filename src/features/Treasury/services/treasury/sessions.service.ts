import supabase from '../../../../utils/supabase'
import type { TreasurySession } from '../../types'
import type { CreateSessionDTO, UpdateSessionDTO } from '../../types'

export const sessionsService = {
  getSessions: async (): Promise<TreasurySession[]> => {
    const { data, error } = await supabase
      .from('treasury_sessions')
      .select('*')
      .order('start_date', { ascending: false })
    if (error) throw error
    return data as TreasurySession[]
  },

  getActiveSession: async (): Promise<TreasurySession | null> => {
    const { data, error } = await supabase
      .from('treasury_sessions')
      .select('*')
      .eq('status', 'active')
      .maybeSingle()
    if (error) throw error
    return data as TreasurySession | null
  },

  getSessionById: async (id: string): Promise<TreasurySession> => {
    const { data, error } = await supabase
      .from('treasury_sessions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as TreasurySession
  },

  createSession: async (payload: CreateSessionDTO): Promise<TreasurySession> => {
    const { data: session, error } = await supabase
      .from('treasury_sessions')
      .insert({
        planned_budget: payload.planned_budget,
        reserved_amount: payload.reserved_amount,
        spent_amount: payload.spent_amount,
        remaining_amount: payload.remaining_amount,
        start_date: payload.start_date,
        end_date: payload.end_date,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()
    if (error) throw error

    const createdSession = session as TreasurySession

    await supabase.from('treasury_activity_budgets').insert({
      session_id: createdSession.id,
      activity_id: null,
      allocated_amount: 0,
      notes: 'General budget',
    })

    return createdSession
  },

  updateSession: async (id: string, payload: UpdateSessionDTO): Promise<void> => {
    const { data: current } = await supabase
      .from('treasury_sessions')
      .select('planned_budget, reserved_amount, spent_amount')
      .eq('id', id)
      .single()

    const session = current as { planned_budget: number; reserved_amount: number; spent_amount: number }

    const updateData: Record<string, unknown> = {}
    const newPlanned = payload.planned_budget ?? session.planned_budget
    const newReserved = payload.reserved_amount ?? session.reserved_amount


    if (payload.planned_budget !== undefined) updateData.planned_budget = payload.planned_budget
    if (payload.reserved_amount !== undefined) updateData.reserved_amount = payload.reserved_amount
    if (payload.start_date !== undefined) updateData.start_date = payload.start_date
    if (payload.end_date !== undefined) updateData.end_date = payload.end_date
    if (payload.status !== undefined) updateData.status = payload.status

    updateData.remaining_amount = newPlanned - newReserved - session.spent_amount

    const { error } = await supabase
      .from('treasury_sessions')
      .update(updateData)
      .eq('id', id)
    if (error) throw error
  },

  activateSession: async (id: string): Promise<void> => {
    await supabase
      .from('treasury_sessions')
      .update({ status: 'draft' })
      .eq('status', 'active')

    const { error } = await supabase
      .from('treasury_sessions')
      .update({ status: 'active' })
      .eq('id', id)
    if (error) throw error
  },

  deactivateSession: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('treasury_sessions')
      .update({ status: 'draft' })
      .eq('id', id)
    if (error) throw error
  },

  archiveSession: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('treasury_sessions')
      .update({ status: 'archived' })
      .eq('id', id)
    if (error) throw error
  },

  deleteSession: async (id: string): Promise<void> => {
    const { data: budgets } = await supabase
      .from('treasury_activity_budgets')
      .select('id')
      .eq('session_id', id)

    if (budgets && budgets.length > 0) {
      const budgetIds = budgets.map((b: { id: string }) => b.id)

      const { data: transactions } = await supabase
        .from('treasury_transactions')
        .select('id')
        .in('activity_budget_id', budgetIds)

      if (transactions && transactions.length > 0) {
        const txnIds = transactions.map((t: { id: string }) => t.id)

        const { data: attachments } = await supabase
          .from('treasury_attachments')
          .select('file_path')
          .in('transaction_id', txnIds)

        if (attachments) {
          for (const att of attachments) {
            await supabase.storage.from('treasury-attachments').remove([att.file_path])
          }
        }

        await supabase.from('treasury_attachments').delete().in('transaction_id', txnIds)
        await supabase.from('treasury_transactions').delete().in('activity_budget_id', budgetIds)
      }

      await supabase.from('treasury_activity_budgets').delete().eq('session_id', id)
    }

    await supabase.from('treasury_audit_logs').delete().eq('session_id', id)

    const { error } = await supabase
      .from('treasury_sessions')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
