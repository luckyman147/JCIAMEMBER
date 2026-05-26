import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Banknote, CalendarDays, HelpCircle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { SessionSchema } from '../schemas/treasury.schema'
import { useCreateSession } from '../hooks/useTreasury'
import { z } from 'zod'
import type { TreasurySession } from '../types'

const AddSessionFormSchema = SessionSchema
type AddSessionFormValues = z.input<typeof AddSessionFormSchema>

interface AddSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (session: TreasurySession) => void
}

interface BudgetFieldProps {
  label: string
  descKey: string
  value: number | undefined
  error?: string
  onChange: (val: number) => void
  icon: React.ReactNode
}

function BudgetField({ label, descKey, value, error, onChange, icon }: BudgetFieldProps) {
  const { t } = useTranslation()
  const [showDesc, setShowDesc] = useState(false)

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <button
          type="button"
          onClick={() => setShowDesc(!showDesc)}
          className={`p-1 rounded-lg transition-all ${showDesc ? 'bg-(--color-myPrimary)/10 text-(--color-myPrimary)' : 'text-gray-300 hover:text-gray-500'}`}
          title={t('treasury.toggleDescription', 'Toggle description')}
        >
          {showDesc ? <ChevronDown className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
        </button>
      </div>
      {showDesc && (
        <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {t(descKey)}
        </div>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-myPrimary)">
          {icon}
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
          className={`w-full rounded-lg border ${error ? 'border-red-400' : 'border-gray-200'} pl-9 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
          placeholder="0.00"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">TND</span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function AddSessionModal({ isOpen, onClose, onCreated }: AddSessionModalProps) {
  const { t } = useTranslation()
  const createSession = useCreateSession()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddSessionFormValues>({
    resolver: zodResolver(AddSessionFormSchema),
    defaultValues: {
      planned_budget: 0,
      reserved_amount: 0,
      spent_amount: 0,
      remaining_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    },
  })

  const plannedBudget = watch('planned_budget')
  const reservedAmount = watch('reserved_amount')
  const spentAmount = watch('spent_amount')

  if (!isOpen) return null

  const onSubmit = async (data: AddSessionFormValues) => {
    try {
      const session = await createSession.mutateAsync({
        planned_budget: data.planned_budget,
        reserved_amount: data.reserved_amount ?? 0,
        spent_amount: data.spent_amount ?? 0,
        remaining_amount: data.planned_budget - (data.reserved_amount ?? 0) - (data.spent_amount ?? 0),
        start_date: data.start_date,
        end_date: data.end_date,
      })
      toast.success(t('treasury.sessionCreated', 'Session created'))
      onCreated(session)
      reset()
      onClose()
    } catch (err: any) {
      toast.error(err.message || t('treasury.errorCreatingSession', 'Failed to create session'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{t('treasury.addSession', 'New Session')}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="bg-(--color-myPrimary)/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-(--color-myPrimary) uppercase tracking-wider">{t('treasury.sessionPeriod', 'Session Period')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t('treasury.startDate', 'Start Date')} *</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    {...register('start_date')}
                    className={`w-full rounded-lg border ${errors.start_date ? 'border-red-400' : 'border-gray-200'} pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
                  />
                </div>
                {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{t('treasury.endDate', 'End Date')} *</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    {...register('end_date')}
                    className={`w-full rounded-lg border ${errors.end_date ? 'border-red-400' : 'border-gray-200'} pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
                  />
                </div>
                {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>}
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('treasury.budgetFields', 'Budget Fields')}</p>

          <BudgetField
            label={t('treasury.plannedBudget', 'Planned Budget')}
            descKey="treasury.plannedBudgetDesc"
            value={plannedBudget}
            error={errors.planned_budget?.message}
            onChange={(val) => setValue('planned_budget', val)}
            icon={<Banknote className="w-4 h-4" />}
          />

          <BudgetField
            label={t('treasury.reservedAmount', 'Reserved Amount')}
            descKey="treasury.reservedAmountDesc"
            value={reservedAmount}
            error={errors.reserved_amount?.message}
            onChange={(val) => setValue('reserved_amount', val)}
            icon={<Banknote className="w-4 h-4" />}
          />

          <BudgetField
            label={t('treasury.spentAmount', 'Spent Amount')}
            descKey="treasury.spentAmountDesc"
            value={spentAmount}
            error={errors.spent_amount?.message}
            onChange={(val) => setValue('spent_amount', val)}
            icon={<Banknote className="w-4 h-4" />}
          />

          <div className="bg-(--color-myAccent)/5 border border-(--color-myAccent)/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{t('treasury.remainingAmount', 'Remaining Amount')}</span>
              <span className="text-lg font-bold text-(--color-myAccent)">
                {((plannedBudget ?? 0) - (reservedAmount ?? 0) - (spentAmount ?? 0)).toLocaleString()} TND
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('treasury.remainingAmountDesc')}</p>
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-(--color-myPrimary) text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.create', 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}