import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTransactions, useActivityBudgets, useDashboardMetrics } from '../hooks/useTreasury'
import { exportOverallBudgetExcel, exportActivityBudgetExcel } from '../services/treasury.export'

interface ExportButtonProps {
  sessionId: string
  sessionLabel?: string
  sessionStart?: string
  sessionEnd?: string
  activityBudgetId?: string
  label?: string
  variant?: 'primary' | 'outline'
  logoUrl?: string
}

export default function ExportButton({
  sessionId,
  sessionLabel,
  sessionStart,
  sessionEnd,
  activityBudgetId,
  label,
  variant = 'outline',
  logoUrl,
}: ExportButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const { data: budgets } = useActivityBudgets(sessionId)
  const { data: transactions } = useTransactions({ session_id: sessionId })
  const { data: metrics } = useDashboardMetrics(sessionId)

  const handleExport = async () => {
    setLoading(true)
    try {
      const exportLabel = sessionLabel || sessionId

      if (activityBudgetId) {
        const budget = budgets?.find((b) => b.id === activityBudgetId)
        if (budget && transactions) {
          const filteredTxns = transactions.filter((t) => t.activity_budget_id === activityBudgetId)
          await exportActivityBudgetExcel(budget, filteredTxns, exportLabel, logoUrl, sessionStart, sessionEnd)
        }
      } else if (budgets && transactions && metrics) {
        await exportOverallBudgetExcel(exportLabel, budgets, transactions, metrics, logoUrl, sessionStart, sessionEnd)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const base = variant === 'primary'
    ? 'bg-(--color-myPrimary) text-white hover:brightness-110'
    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${base}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label || t('treasury.exportExcel', 'Export Excel')}
    </button>
  )
}
