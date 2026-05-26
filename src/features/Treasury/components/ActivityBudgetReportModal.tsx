import { X, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTransactions, useActivityBudgets } from '../hooks/useTreasury'
import { exportActivityBudgetExcel } from '../services/treasury.export'
interface ActivityBudgetReportModalProps {
  budgetId: string | null
  sessionId: string
  sessionLabel?: string
  sessionStart?: string
  sessionEnd?: string
  isOpen: boolean
  onClose: () => void
}

function UsageBar({ usedPercent }: { usedPercent: number }) {
  const color =
    usedPercent >= 95 ? 'bg-red-500' :
    usedPercent >= 80 ? 'bg-(--color-mySecondary)' :
    'bg-(--color-myAccent)'

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(usedPercent, 100)}%` }}
      />
    </div>
  )
}

export default function ActivityBudgetReportModal({
  budgetId,
  sessionId,
  sessionLabel,
  sessionStart,
  sessionEnd,
  isOpen,
  onClose,
}: ActivityBudgetReportModalProps) {
  const { t } = useTranslation()
  const { data: budgets } = useActivityBudgets(sessionId)
  const { data: transactions } = useTransactions(
    budgetId ? { session_id: sessionId, activity_budget_id: budgetId } : { session_id: sessionId }
  )

  const budget = budgets?.find((b) => b.id === budgetId) || null
  const filteredTxns = transactions?.filter((t) => t.activity_budget_id === budgetId) || []

  if (!isOpen || !budgetId) return null

  const usedPercent = budget && budget.allocated_amount > 0
    ? (budget.spent_amount / budget.allocated_amount) * 100
    : 0

  const exportExcel = async () => {
    if (!budget) return
    try {
      await exportActivityBudgetExcel(budget, filteredTxns, sessionLabel || sessionId, undefined, sessionStart, sessionEnd)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {budget?.activities?.name || t('treasury.general', 'General')}
            </h3>
            <p className="text-sm text-gray-500">{t('treasury.budgetReport', 'Budget Report')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportExcel}
              className="p-2 text-gray-500 hover:text-(--color-myPrimary) hover:bg-(--color-myPrimary)/10 rounded-lg transition-colors"
              title={t('treasury.exportExcel', 'Export Excel')}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {budget && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {budget.status === 'completed' && <CheckCircle className="w-4 h-4 text-gray-400" />}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    budget.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                    budget.status === 'approved' ? 'bg-(--color-myAccent)/10 text-(--color-myAccent)' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {budget.status === 'completed' ? t('treasury.budgetCompleted', 'Completed') :
                     budget.status === 'approved' ? t('treasury.budgetApproved', 'Approved') :
                     t('treasury.budgetPending', 'Pending')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-(--color-myPrimary)/5 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('treasury.allocated', 'Allocated')}
                  </p>
                  <p className="text-xl font-bold text-(--color-myPrimary) mt-1">
                    {budget.allocated_amount.toLocaleString()} TND
                  </p>
                </div>
                <div className="bg-(--color-myAccent)/5 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('treasury.spent', 'Spent')}
                  </p>
                  <p className="text-xl font-bold text-(--color-myAccent) mt-1">
                    {budget.spent_amount.toLocaleString()} TND
                  </p>
                </div>
                <div className="bg-(--color-mySecondary)/5 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t('treasury.remaining', 'Remaining')}
                  </p>
                  <p className="text-xl font-bold text-(--color-mySecondary) mt-1">
                    {budget.remaining_amount.toLocaleString()} TND
                  </p>
                </div>
              </div>
            </>
          )}

          {budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">{t('treasury.usage', 'Usage')}</span>
                <span className={`font-bold ${usedPercent >= 95 ? 'text-red-500' : usedPercent >= 80 ? 'text-(--color-mySecondary)' : 'text-(--color-myAccent)'}`}>
                  {usedPercent.toFixed(1)}%
                </span>
              </div>
              <UsageBar usedPercent={usedPercent} />
            </div>
          )}

          {budget?.status === 'completed' && (() => {
            const gains = filteredTxns.filter((t) => t.type === 'gain' && t.status === 'approved').reduce((s, t) => s + t.amount, 0)
            const expenses = filteredTxns.filter((t) => (t.type === 'expense_paid' || t.type === 'expense_reserved') && t.status === 'approved').reduce((s, t) => s + t.amount, 0)
            const netCost = expenses - gains
            const overspend = netCost > budget.allocated_amount
            return (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">{t('treasury.activityResult', 'Activity Result')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('treasury.totalGains', 'Total Gains')}</p>
                    <p className="text-lg font-bold text-(--color-myAccent)">{gains.toLocaleString()} TND</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('treasury.totalExpenses', 'Total Expenses')}</p>
                    <p className={`text-lg font-bold ${overspend ? 'text-red-500' : 'text-(--color-mySecondary)'}`}>{expenses.toLocaleString()} TND</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t('treasury.netResult', 'Net Result')}</span>
                  <span className={`text-sm font-bold ${netCost <= 0 ? 'text-(--color-myAccent)' : 'text-red-500'}`}>
                    {netCost <= 0
                      ? `${Math.abs(netCost).toLocaleString()} TND ${t('treasury.surplus', 'surplus')}`
                      : `${netCost.toLocaleString()} TND ${t('treasury.netCost', 'net cost')}`}
                  </span>
                </div>
                {overspend && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">{t('treasury.overspendWarning', 'This activity exceeded its allocated budget.')}</p>
                  </div>
                )}
              </div>
            )
          })()}

          {filteredTxns.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3">{t('treasury.transactions', 'Transactions')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.date', 'Date')}</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.type', 'Type')}</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.category', 'Category')}</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">{t('treasury.amount', 'Amount')}</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-medium">{t('treasury.status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-2 text-gray-700">{txn.date}</td>
                        <td className="py-2.5 px-2">
                          {txn.type === 'gain' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-(--color-myAccent)/10 text-(--color-myAccent)">
                              {t('treasury.gain', 'Gain')}
                            </span>
                          ) : txn.type === 'expense_paid' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                              {t('treasury.paidNow', 'Paid')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-(--color-mySecondary)/10 text-(--color-mySecondary)">
                              {t('treasury.reserved', 'Reserved')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-gray-600">{txn.categories?.name || '-'}</td>
                        <td className={`py-2.5 px-2 text-right font-semibold ${
                          txn.type === 'gain' ? 'text-(--color-myAccent)' : 'text-red-500'
                        }`}>
                          {txn.type === 'gain' ? '+' : '-'}{txn.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            txn.status === 'approved' ? 'bg-(--color-myAccent)/10 text-(--color-myAccent)' :
                            txn.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            txn.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                            'bg-(--color-mySecondary)/10 text-(--color-mySecondary)'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredTxns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 font-medium">{t('treasury.noTransactions', 'No transactions yet')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
