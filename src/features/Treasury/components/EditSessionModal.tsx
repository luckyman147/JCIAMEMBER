import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useUpdateSession } from '../hooks/useTreasury'
import { treasuryService } from '../services/treasury.service'
import type { TreasurySession } from '../types'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  session: TreasurySession | null
}

export default function EditSessionModal({ isOpen, onClose, session }: EditSessionModalProps) {
  const { t } = useTranslation()
  const updateSession = useUpdateSession()
  const [plannedBudget, setPlannedBudget] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (session && isOpen) {
      setPlannedBudget(session.planned_budget)
      setStartDate(session.start_date?.split('T')[0] || '')
      setEndDate(session.end_date?.split('T')[0] || '')
    }
  }, [session, isOpen])

  if (!isOpen || !session) return null

  const remainingAmount = plannedBudget - session.reserved_amount - session.spent_amount

  const handleSave = async () => {
    try {
      const changes: Record<string, unknown> = {}
      if (plannedBudget !== session.planned_budget) changes.planned_budget = plannedBudget

      await updateSession.mutateAsync({
        id: session.id,
        data: {
          planned_budget: plannedBudget,
          start_date: startDate,
          end_date: endDate,
        },
      })

      if (Object.keys(changes).length > 0) {
        await treasuryService.logAudit({
          session_id: session.id,
          action: 'UPDATE_SESSION',
          entity_type: 'treasury_sessions',
          entity_id: session.id,
          old_values: {
            planned_budget: session.planned_budget,
          },
          new_values: changes,
        })
      }

      toast.success(t('treasury.sessionUpdated', 'Session updated'))
      onClose()
    } catch (err: any) {
      toast.error(err.message || t('treasury.errorUpdatingSession', 'Failed to update session'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{t('treasury.editSession', 'Edit Session')}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-(--color-myPrimary)/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-(--color-myPrimary) uppercase tracking-wider">{t('treasury.sessionPeriod', 'Session Period')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t('treasury.startDate', 'Start Date')} *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t('treasury.endDate', 'End Date')} *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.plannedBudget', 'Planned Budget')}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={plannedBudget}
                onChange={(e) => setPlannedBudget(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-(--color-myPrimary)">TND</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">{t('treasury.spentAmount', 'Spent Amount')}</span>
              <span className="font-bold text-red-500">{session.spent_amount.toLocaleString()} TND</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{t('treasury.remainingAmount', 'Remaining Amount')}</span>
              <span className={`text-lg font-bold ${remainingAmount >= 0 ? 'text-(--color-myAccent)' : 'text-red-500'}`}>
                {remainingAmount.toLocaleString()} TND
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={updateSession.isPending}
              className="flex-1 py-2.5 rounded-lg bg-(--color-myPrimary) text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateSession.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save', 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
