import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Wallet, Plus, TrendingUp, TrendingDown, Clock, Banknote, PieChart, Pencil, Trash2, CheckCircle, CreditCard, RotateCcw, AlertTriangle } from 'lucide-react'
import Navbar from '../../../Global_Components/navBar'
import SessionSelector from '../components/SessionSelector'
import TreasuryKpiCard from '../components/TreasuryKpiCard'
import TransactionFormModal from '../components/TransactionFormModal'
import ActivityBudgetReportModal from '../components/ActivityBudgetReportModal'
import ExportButton from '../components/ExportButton'
import AddSessionModal from '../components/AddSessionModal'
import EditSessionModal from '../components/EditSessionModal'
import DeleteSessionDialog from '../components/DeleteSessionDialog'
import { useSessions, useActivityBudgets, useTransactions, useDashboardMetrics, useUpdateBudgetAllocation, useDeleteBudget, useActivateSession, useDeactivateSession, useVerifyTransaction, useMarkAsPaid, useRejectTransaction, useApproveBudget, useCompleteActivityBudget, useOverspendOverride, useReopenBudget } from '../hooks/useTreasury'
import type { TreasurySession } from '../types'
import supabase from '../../../utils/supabase'
import { useAuth } from '../../Authentication/auth.context'

function typeBadge(type: string, t: (key: string, fallback: string) => string) {
  if (type === 'gain') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-(--color-myAccent)/10 text-(--color-myAccent)">{t('treasury.gain', 'Gain')}</span>
  }
  if (type === 'expense_paid') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">{t('treasury.paidNow', 'Paid')}</span>
  }
  if (type === 'expense_reserved') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-(--color-mySecondary)/10 text-(--color-mySecondary)">{t('treasury.reserved', 'Reserved')}</span>
  }
  return null
}

export default function TreasuryPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const [selectedSession, setSelectedSession] = useState<TreasurySession | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddSessionModal, setShowAddSessionModal] = useState(false)
  const [showEditSessionModal, setShowEditSessionModal] = useState(false)
  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState(false)
  const [reportBudgetId, setReportBudgetId] = useState<string | null>(null)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [editBudgetAmount, setEditBudgetAmount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const updateBudget = useUpdateBudgetAllocation()
  const deleteBudget = useDeleteBudget()
  const activateSession = useActivateSession()
  const deactivateSession = useDeactivateSession()
  const verifyTransaction = useVerifyTransaction()
  const markAsPaid = useMarkAsPaid()
  const rejectTransaction = useRejectTransaction()
  const approveBudget = useApproveBudget()
  const completeBudget = useCompleteActivityBudget()
  const overspendOverride = useOverspendOverride()
  const reopenBudget = useReopenBudget()

  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null)
  const [confirmCompleteResult, setConfirmCompleteResult] = useState<{ netCost: number; overspend: boolean } | null>(null)
  const [overspendDialog, setOverspendDialog] = useState<{ budgetId: string; needed: number; txnId: string; userId: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const activeSession = sessions?.find((s) => s.status === 'active')
  const session = selectedSession || activeSession || null

  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useActivityBudgets(session?.id || '')
  const { data: transactions, isLoading: txnsLoading } = useTransactions({ session_id: session?.id || '' })
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(session?.id || '')

  useEffect(() => {
    if (!selectedSession && activeSession) {
      setSelectedSession(activeSession)
    }
  }, [activeSession, selectedSession])

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="md:ml-64 pt-16 md:pt-6 p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const pendingCount = transactions?.filter((t) => t.status === 'pending').length || 0
  const isTreasurer = role?.toLowerCase() === 'tresorier'

  function budgetStatusBadge(status: string, t: (key: string, fallback: string) => string) {
    if (status === 'pending') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">{t('treasury.budgetPending', 'Pending')}</span>
    }
    if (status === 'approved') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-(--color-myAccent)/10 text-(--color-myAccent)">{t('treasury.budgetApproved', 'Approved')}</span>
    }
    if (status === 'completed') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">{t('treasury.budgetCompleted', 'Completed')}</span>
    }
    return null
  }
  const formatCurrency = (val: number) => `${val.toLocaleString()} TND`

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="md:ml-64 pt-16 md:pt-6 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center text-(--color-myPrimary)">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('treasury.title', 'Treasury')}</h1>
                <p className="text-sm text-gray-500">
                  {session
                    ? `${new Date(session.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — ${new Date(session.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : t('treasury.subtitle', 'Financial management')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session && (
                <>
                  <SessionSelector selectedId={session.id} onSelect={setSelectedSession} />
                  {session.status !== 'active' && (
                    <button
                      onClick={async () => {
                        try {
                          await activateSession.mutateAsync(session.id)
                        } catch (err: any) {
                          toast.error(err.message || 'Activation failed')
                        }
                      }}
                      className="p-2.5 text-gray-400 hover:text-(--color-myAccent) hover:bg-(--color-myAccent)/10 rounded-lg transition-all"
                      title={t('treasury.activateSession', 'Activate session')}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      onClick={async () => {
                        try {
                          await deactivateSession.mutateAsync(session.id)
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to make draft')
                        }
                      }}
                      className="p-2.5 text-gray-400 hover:text-(--color-mySecondary) hover:bg-(--color-mySecondary)/10 rounded-lg transition-all"
                      title={t('treasury.makeDraft', 'Make draft')}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowEditSessionModal(true)}
                    className="p-2.5 text-gray-400 hover:text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-all"
                    title={t('treasury.editSession', 'Edit session')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteSessionDialog(true)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title={t('treasury.deleteSession', 'Delete session')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowAddSessionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-myAccent) text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" />
                {t('treasury.addSession', 'Add Session')}
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--color-myPrimary) text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" />
                {t('treasury.addTransaction', 'Add Transaction')}
              </button>
            </div>
          </div>

          {metrics && !metricsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <TreasuryKpiCard
                icon={<Banknote className="w-5 h-5" />}
                label={t('treasury.balance', 'Balance')}
                description={t('treasury.balanceFormula', 'Gains − Paid expenses')}
                value={formatCurrency(metrics.current_balance)}
                color={metrics.current_balance >= 0 ? 'accent' : 'red'}
              />
              <TreasuryKpiCard
                icon={<PieChart className="w-5 h-5" />}
                label={t('treasury.planned', 'Planned')}
                description={t('treasury.plannedFormula', 'Total budget target')}
                value={formatCurrency(metrics.planned_budget)}
                color="primary"
              />
              <TreasuryKpiCard
                icon={<CreditCard className="w-5 h-5" />}
                label={t('treasury.reservedAmount', 'Reserved')}
                description={t('treasury.reservedFormula', 'Committed not yet paid')}
                value={formatCurrency(metrics.reserved_amount)}
                color="secondary"
              />
              <TreasuryKpiCard
                icon={<TrendingDown className="w-5 h-5" />}
                label={t('treasury.spent', 'Spent')}
                description={t('treasury.spentFormula', 'Money already paid out')}
                value={formatCurrency(metrics.total_spent)}
                color="red"
              />
              <TreasuryKpiCard
                icon={<TrendingUp className="w-5 h-5" />}
                label={t('treasury.totalGains', 'Total Gains')}
                description={t('treasury.gainsFormula', 'Total income earned')}
                value={formatCurrency(metrics.total_gains)}
                color="accent"
              />
              <TreasuryKpiCard
                icon={<PieChart className="w-5 h-5" />}
                label={t('treasury.remaining', 'Remaining')}
                description={t('treasury.remainingFormula', 'Planned − (Reserved + Spent)')}
                value={formatCurrency(metrics.remaining_amount)}
                color={metrics.remaining_amount >= 0 ? 'accent' : 'red'}
              />
             
            </div>
          )}

          <div className="flex items-center justify-end">
              {session && (
                <ExportButton
                  sessionId={session.id}
                  sessionLabel={session.start_date?.split('-')[0] || ''}
                  sessionStart={session.start_date}
                  sessionEnd={session.end_date}
                  variant="primary"
                  label={t('treasury.exportExcel', 'Export Excel')}
                />
              )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t('treasury.activityBudgets', 'Activity Budgets')}</h2>
            </div>
            {budgetsLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
              </div>
            ) : budgets && budgets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="text-left py-3.5 px-6 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.activity', 'Activity')}
                      </th>
                      <th className="text-center py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.status', 'Status')}
                      </th>
                      <th className="text-right py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.remaining', 'Remaining')}
                      </th>
                      <th className="text-right py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.spent', 'Spent')}
                      </th>
                      <th className="text-center py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.usage', 'Usage')}
                      </th>
                      <th className="text-center py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        {t('treasury.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.filter((b) => b.activity_id !== null).map((b) => {
                      const usedPercent = b.allocated_amount > 0
                        ? (b.spent_amount / b.allocated_amount) * 100
                        : 0
                      const usageColor = usedPercent >= 95 ? 'bg-red-500' : usedPercent >= 80 ? 'bg-(--color-mySecondary)' : 'bg-(--color-myAccent)'

                      const budgetGains = transactions
                        ?.filter((t) => t.activity_budget_id === b.id && t.type === 'gain' && t.status === 'approved')
                        .reduce((sum, t) => sum + t.amount, 0) || 0
                      const budgetExpenses = transactions
                        ?.filter((t) => t.activity_budget_id === b.id && t.type !== 'gain' && t.status === 'approved')
                        .reduce((sum, t) => sum + t.amount, 0) || 0
                      const netLoss = budgetExpenses > budgetGains + b.allocated_amount

                      return (
                        <Fragment key={b.id}>
                          <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-(--color-myPrimary)/10 flex items-center justify-center text-(--color-myPrimary)">
                                <PieChart className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                {b.activity_id && b.activities?.id ? (
                                  <Link to={`/activities/${b.activities.id}/GET`} className="font-semibold text-(--color-myPrimary) hover:underline">
                                    {b.activities?.name || t('treasury.general', 'General')}
                                  </Link>
                                ) : (
                                  <span className="font-semibold text-gray-900">
                                    {b.activities?.name || t('treasury.general', 'General')}
                                  </span>
                                )}
                                {b.allocated_amount > 0 && (
                                  <span className="text-xs text-gray-400">{b.allocated_amount.toLocaleString()} TND {t('treasury.allocated', 'allocated')}</span>
                                )}
                                {budgetGains > 0 && (
                                  <span className="text-xs text-(--color-myAccent)">{budgetGains.toLocaleString()} TND {t('treasury.gains', 'gains')}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {budgetStatusBadge(b.status, t)}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-(--color-mySecondary)">
                            {b.remaining_amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-(--color-myAccent)">
                            {b.spent_amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-full rounded-full ${usageColor} transition-all`}
                                  style={{ width: `${Math.min(usedPercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-500 w-10 text-right">
                                {usedPercent.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {b.status === 'pending' && (
                                <button
                                  onClick={() => setConfirmApproveId(b.id)}
                                  disabled={approveBudget.isPending}
                                  className="p-1.5 text-(--color-myAccent) hover:bg-(--color-myAccent)/10 rounded-lg transition-all"
                                  title={t('treasury.approveBudget', 'Approve budget')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {b.status === 'approved' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const result = await completeBudget.mutateAsync({ activityBudgetId: b.id, userId: userId! })
                                      setConfirmCompleteResult(result)
                                      setConfirmCompleteId(b.id)
                                    } catch (err: any) {
                                      toast.error(err.message || t('treasury.errorCompletingBudget', 'Failed to complete budget'))
                                    }
                                  }}
                                  disabled={completeBudget.isPending}
                                  className="p-1.5 text-(--color-mySecondary) hover:bg-(--color-mySecondary)/10 rounded-lg transition-all"
                                  title={t('treasury.completeActivity', 'Complete activity')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {b.status === 'completed' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await reopenBudget.mutateAsync({ budgetId: b.id, userId: userId! })
                                      toast.success(t('treasury.budgetReopened', 'Budget reopened'))
                                    } catch (err: any) {
                                      toast.error(err.message || t('treasury.errorReopeningBudget', 'Failed to reopen budget'))
                                    }
                                  }}
                                  disabled={reopenBudget.isPending}
                                  className="p-1.5 text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-all"
                                  title={t('treasury.reopenBudget', 'Reopen budget')}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => { setEditBudgetAmount(b.allocated_amount); setEditingBudgetId(b.id) }}
                                className="p-1.5 text-gray-400 hover:text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-all"
                                title={t('treasury.editBudget', 'Edit budget')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setReportBudgetId(b.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-colors"
                              >
                                {t('treasury.viewReport', 'Report')}
                              </button>
                              {session && (
                                <ExportButton
                                  sessionId={session.id}
                                  sessionLabel={session.start_date?.split('-')[0] || ''}
                                  sessionStart={session.start_date}
                                  sessionEnd={session.end_date}
                                  activityBudgetId={b.id}
                                  label="Excel"
                                />
                              )}
                              {b.status !== 'completed' && (
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(t('treasury.confirmDeleteBudget', 'Delete this budget allocation?'))) return
                                    try {
                                      await deleteBudget.mutateAsync(b.id)
                                    } catch {}
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title={t('treasury.deleteBudget', 'Delete budget')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {netLoss && (
                          <tr key={`${b.id}-warn`} className="bg-red-50/50">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-red-700 space-y-1">
                                  <p className="font-semibold">{t('treasury.budgetLossWarning', 'Expenses exceed budget allocation + gains')}</p>
                                  <p>{t('treasury.budgetLossRecommend', 'Consider increasing the budget allocation or reducing future unpaid expenses to balance this activity.')}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('treasury.noBudgets', 'No budgets allocated yet')}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t('treasury.recentTransactions', 'Recent Transactions')}</h2>
            </div>
            {txnsLoading ? (
              <div className="p-6 space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="text-left py-3.5 px-6 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.date', 'Date')}</th>
                      <th className="text-left py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.type', 'Type')}</th>
                      <th className="text-left py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.category', 'Category')}</th>
                      <th className="text-left py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.activity', 'Activity')}</th>
                      <th className="text-right py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.amount', 'Amount')}</th>
                      <th className="text-center py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.status', 'Status')}</th>
                      <th className="text-center py-3.5 px-4 text-gray-500 font-semibold text-xs uppercase tracking-wider">{t('treasury.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-6 text-gray-600">{txn.date}</td>
                        <td className="py-3.5 px-4">{typeBadge(txn.type, t)}</td>
                        <td className="py-3.5 px-4 text-gray-600">{txn.categories?.name || '-'}</td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {txn.activity_budgets?.activities?.name || t('treasury.general', 'General')}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-semibold ${
                          txn.type === 'gain' ? 'text-(--color-myAccent)' : 'text-red-500'
                        }`}>
                          {txn.type === 'gain' ? '+' : '-'}{txn.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            txn.is_verified ? 'bg-(--color-myAccent)/10 text-(--color-myAccent)' :
                            txn.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            txn.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                            'bg-(--color-mySecondary)/10 text-(--color-mySecondary)'
                          }`}>
                            {txn.is_verified && <CheckCircle className="w-3 h-3" />}
                            {txn.is_verified ? t('treasury.verified', 'Verified') :
                             txn.status === 'rejected' ? t('treasury.rejected', 'Rejected') :
                             txn.status === 'archived' ? t('treasury.archived', 'Archived') :
                             t('treasury.pending', 'Pending')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {txn.status === 'pending' && userId && (
                              <>
                              <button
                                onClick={async () => {
                                  try {
                                    await verifyTransaction.mutateAsync({ id: txn.id, userId })
                                  } catch (err: any) {
                                    const msg = err.message || ''
                                    if (msg.includes('Insufficient activity budget')) {
                                      const match = msg.match(/need (\d+), only (\d+)/)
                                      if (match && isTreasurer) {
                                        const needed = parseInt(match[1]) - parseInt(match[2])
                                        setOverspendDialog({ budgetId: txn.activity_budget_id, needed, txnId: txn.id, userId })
                                        return
                                      }
                                    }
                                    toast.error(err.message || 'Verification failed')
                                  }
                                }}
                                disabled={verifyTransaction.isPending}
                                className="p-1.5 text-(--color-myAccent) hover:bg-(--color-myAccent)/10 rounded-lg transition-all"
                                title={t('treasury.verify', 'Verify')}
                              >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const reason = window.prompt(t('treasury.rejectionReason', 'Reason for rejection:'))
                                    if (!reason) return
                                    try {
                                      await rejectTransaction.mutateAsync({ id: txn.id, reason })
                                    } catch (err: any) {
                                      toast.error(err.message || 'Rejection failed')
                                    }
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title={t('treasury.reject', 'Reject')}
                                >
                                  <span className="text-lg leading-none">&times;</span>
                                </button>
                              </>
                            )}
                            {txn.type === 'expense_reserved' && txn.is_verified && (
                              <button
                                onClick={async () => {
                                  try {
                                    await markAsPaid.mutateAsync(txn.id)
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to mark as paid')
                                  }
                                }}
                                disabled={markAsPaid.isPending}
                                className="px-2 py-1 text-xs font-bold text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-all flex items-center gap-1"
                                title={t('treasury.markAsPaid', 'Mark as paid')}
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                {t('treasury.pay', 'Pay')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('treasury.noTransactions', 'No transactions yet')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {editingBudgetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingBudgetId(null)}>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{t('treasury.editBudgetAllocation', 'Edit Budget Allocation')}</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('treasury.allocated', 'Allocated')} (TND)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editBudgetAmount}
                onChange={(e) => setEditBudgetAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingBudgetId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateBudget.mutateAsync({ id: editingBudgetId, data: { allocated_amount: editBudgetAmount } })
                    setEditingBudgetId(null)
                  } catch {}
                }}
                disabled={updateBudget.isPending}
                className="flex-1 py-2.5 rounded-lg bg-(--color-myPrimary) text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddSessionModal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        onCreated={(s) => setSelectedSession(s)}
      />

      <EditSessionModal
        isOpen={showEditSessionModal}
        onClose={() => setShowEditSessionModal(false)}
        session={session}
      />

      <DeleteSessionDialog
        isOpen={showDeleteSessionDialog}
        onClose={() => setShowDeleteSessionDialog(false)}
        session={session}
      />

      {confirmApproveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmApproveId(null)}>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{t('treasury.confirmApproveTitle', 'Approve Budget')}</h3>
            <p className="text-sm text-gray-600">{t('treasury.confirmApproveDesc', 'Approving this budget will reserve the allocated amount from the General Budget. Continue?')}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmApproveId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={async () => {
                  try {
                    await approveBudget.mutateAsync({ budgetId: confirmApproveId, userId: userId! })
                    toast.success(t('treasury.budgetApprovedToast', 'Budget approved and reserved from General Budget'))
                  } catch (err: any) {
                    toast.error(err.message || t('treasury.errorApprovingBudget', 'Failed to approve budget'))
                  }
                  setConfirmApproveId(null)
                }}
                disabled={approveBudget.isPending}
                className="flex-1 py-2.5 rounded-lg bg-(--color-myAccent) text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {t('treasury.approveBudget', 'Approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmCompleteResult && confirmCompleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmCompleteId(null); setConfirmCompleteResult(null) }}>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              {confirmCompleteResult.overspend ? (
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-(--color-myAccent)/10">
                  <CheckCircle className="w-5 h-5 text-(--color-myAccent)" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmCompleteResult.overspend
                    ? t('treasury.completeOverspendTitle', 'Activity Overspent')
                    : t('treasury.completeSuccessTitle', 'Activity Completed')}
                </h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('treasury.netResult', 'Net Result')}</span>
                <span className={`font-semibold ${confirmCompleteResult.netCost <= 0 ? 'text-(--color-myAccent)' : 'text-red-500'}`}>
                  {confirmCompleteResult.netCost <= 0
                    ? `${Math.abs(confirmCompleteResult.netCost).toLocaleString()} TND ${t('treasury.surplus', 'surplus')}`
                    : `${confirmCompleteResult.netCost.toLocaleString()} TND ${t('treasury.netCost', 'net cost')}`}
                </span>
              </div>
              {confirmCompleteResult.overspend && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2">
                  <p className="text-xs text-red-700">{t('treasury.overspendWarning', 'This activity exceeded its allocated budget. The unspent portion (if any) has been released back to the General Budget. Overspent funds remain deducted from the session.')}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => { setConfirmCompleteId(null); setConfirmCompleteResult(null) }}
              className="w-full py-2.5 rounded-lg bg-(--color-myPrimary) text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              {t('common.close', 'Close')}
            </button>
          </div>
        </div>
      )}

      {overspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOverspendDialog(null)}>
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('treasury.overspendTitle', 'Budget Overspend')}</h3>
            </div>
            <p className="text-sm text-gray-600">
              {t('treasury.overspendDesc', 'This expense exceeds the activity budget remaining by {{amount}} TND. As treasurer, you can override this by allocating additional funds from the General Budget.', { amount: overspendDialog.needed })}
            </p>
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <p className="text-xs text-yellow-700">{t('treasury.overspendImpact', 'This will deduct the additional amount from the session remaining balance.')}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setOverspendDialog(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={async () => {
                  try {
                    await overspendOverride.mutateAsync({
                      budgetId: overspendDialog.budgetId,
                      extraAmount: overspendDialog.needed,
                      userId: overspendDialog.userId,
                    })
                    await verifyTransaction.mutateAsync({ id: overspendDialog.txnId, userId: overspendDialog.userId })
                    toast.success(t('treasury.overspendApproved', 'Overspend approved. Transaction verified.'))
                  } catch (err: any) {
                    toast.error(err.message || t('treasury.errorOverspend', 'Failed to process overspend'))
                  }
                  setOverspendDialog(null)
                }}
                disabled={overspendOverride.isPending || verifyTransaction.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {t('treasury.overrideApprove', 'Override & Verify')}
              </button>
            </div>
          </div>
        </div>
      )}

      {session && (
        <>
          <TransactionFormModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); refetchBudgets() }}
            sessionId={session.id}
          />
          <ActivityBudgetReportModal
            budgetId={reportBudgetId}
            sessionId={session.id}
            sessionLabel={session.start_date?.split('-')[0] || ''}
            sessionStart={session.start_date}
            sessionEnd={session.end_date}
            isOpen={!!reportBudgetId}
            onClose={() => setReportBudgetId(null)}
          />
        </>
      )}
    </div>
  )
}
