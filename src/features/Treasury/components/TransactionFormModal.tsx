import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Upload, Loader2, Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { TransactionSchema } from '../schemas/treasury.schema'
import { z } from 'zod'

const FormTransactionSchema = TransactionSchema.omit({ session_id: true })
type FormTransactionValues = z.infer<typeof FormTransactionSchema>
import { useCategories, useActivityBudgets, useCreateTransaction, useUploadAttachment, useCreateCategory } from '../hooks/useTreasury'
import { treasuryService } from '../services/treasury.service'

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  defaultActivityBudgetId?: string
  sessionId: string
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  defaultActivityBudgetId,
  sessionId,
}: TransactionFormModalProps) {
  const { t } = useTranslation()
  const [receipt, setReceipt] = useState<File | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const { data: categories } = useCategories()
  const { data: budgets } = useActivityBudgets(sessionId)
  const createTransaction = useCreateTransaction()
  const uploadAttachment = useUploadAttachment()
  const createCategory = useCreateCategory()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormTransactionValues>({
    resolver: zodResolver(FormTransactionSchema),
    defaultValues: {
      type: 'expense_paid',
      amount: undefined as any,
      category_id: '',
      activity_budget_id: defaultActivityBudgetId || '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  })

  const selectedType = watch('type')
  const selectedBudgetId = watch('activity_budget_id')
  const amount = watch('amount')
  const isExpense = selectedType === 'expense_paid' || selectedType === 'expense_reserved'

  const selectedBudget = budgets?.find((b) => b.id === selectedBudgetId)
  const isActivityBudget = selectedBudget?.activity_id !== null && selectedBudgetId !== ''
  const budgetRemaining = selectedBudget?.remaining_amount ?? 0
  const budgetCompleted = selectedBudget?.status === 'completed'
  const expenseExceedsBudget = isExpense && !budgetCompleted && amount > 0 && budgetRemaining > 0 && amount > budgetRemaining

  useEffect(() => {
    if (isActivityBudget && selectedType === 'expense_reserved') {
      setValue('type', 'expense_paid')
    }
  }, [selectedBudgetId, isActivityBudget, selectedType, setValue])

  useEffect(() => {
    if (isOpen) {
      reset({
        type: 'expense_paid',
        amount: undefined as any,
        category_id: '',
        activity_budget_id: defaultActivityBudgetId || '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      } as FormTransactionValues)
      setReceipt(null)
    }
  }, [isOpen, reset, defaultActivityBudgetId])

  const filteredCategories = categories?.filter((c) => c.type === (isExpense ? 'expense' : 'gain')) || []

  const onSubmit = async (data: FormTransactionValues) => {
    try {
      const txn = await createTransaction.mutateAsync({
        session_id: sessionId,
        activity_budget_id: data.activity_budget_id,
        category_id: data.category_id,
        type: data.type,
        amount: data.amount,
        description: data.description || undefined,
        date: data.date,
      })

      if (receipt && txn?.id) {
        await uploadAttachment.mutateAsync({ file: receipt, transactionId: txn.id })
      }

      await treasuryService.logAudit({
        session_id: sessionId,
        action: txn.isDedup ? 'UPDATE_TRANSACTION' : 'CREATE_TRANSACTION',
        entity_type: 'treasury_transactions',
        entity_id: txn.id,
        new_values: data as unknown as Record<string, unknown>,
      })

      if (txn.isDedup) {
        toast.info(t('treasury.transactionUpdated', 'Existing verified transaction updated'))
      } else if (txn.autoApproved) {
        toast.success(t('treasury.transactionAutoApproved', 'Transaction added'))
      } else {
        toast.success(t('treasury.transactionCreated', 'Transaction created successfully'))
      }
      onClose()
    } catch (err: any) {
      toast.error(err.message || t('treasury.errorCreatingTransaction', 'Failed to create transaction'))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {t('treasury.addTransaction', 'Add Transaction')}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Type: Gain vs Expense */}
          <div className="flex gap-3">
            <label
              className={`flex-1 py-2.5 rounded-lg text-center text-sm font-bold cursor-pointer border-2 transition-all ${
                isExpense
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                value="expense_paid"
                {...register('type')}
                className="sr-only"
                onChange={() => setValue('type', 'expense_paid')}
              />
              {t('treasury.expense', 'Expense')}
            </label>
            <label
              className={`flex-1 py-2.5 rounded-lg text-center text-sm font-bold cursor-pointer border-2 transition-all ${
                selectedType === 'gain'
                  ? 'border-(--color-myAccent) bg-(--color-myAccent)/10 text-(--color-myAccent)'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                value="gain"
                {...register('type')}
                className="sr-only"
              />
              {t('treasury.gain', 'Gain')}
            </label>
          </div>

          {/* Expense subtype: Paid now vs Reserved */}
          {isExpense && !isActivityBudget && (
            <div className="flex gap-2 bg-gray-50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setValue('type', 'expense_paid')}
                className={`flex-1 py-2 rounded-lg text-center text-xs font-bold transition-all ${
                  selectedType === 'expense_paid'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('treasury.paidNow', 'Paid now')}
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'expense_reserved')}
                className={`flex-1 py-2 rounded-lg text-center text-xs font-bold transition-all ${
                  selectedType === 'expense_reserved'
                    ? 'bg-(--color-mySecondary) text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('treasury.reservedFuture', 'Reserved (future)')}
              </button>
            </div>
          )}
          {isExpense && isActivityBudget && (
            <div className="flex gap-2 bg-gray-50 rounded-xl p-1">
              <button
                type="button"
                disabled
                className="flex-1 py-2 rounded-lg text-center text-xs font-bold bg-red-500 text-white shadow-sm"
              >
                {t('treasury.paidNow', 'Paid now')}
              </button>
            </div>
          )}

          {selectedType === 'expense_reserved' && !isActivityBudget && (
            <p className="text-xs text-(--color-mySecondary) bg-(--color-mySecondary)/5 rounded-lg px-3 py-2">
              {t('treasury.reservedHint', 'This expense is a future commitment. It will reduce the remaining budget but not count as spent until marked as paid.')}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.amount', 'Amount')} *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { valueAsNumber: true })}
                className={`w-full rounded-lg border ${errors.amount ? 'border-red-400' : 'border-gray-300'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">TND</span>
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}
            {expenseExceedsBudget && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{t('treasury.budgetExceededWarning', 'Expense exceeds budget remaining')}</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {t('treasury.budgetExceededDesc', 'This activity only has {{remaining}} TND remaining. You will need to increase the budget allocation before verifying this transaction.', { remaining: budgetRemaining })}
                  </p>
                </div>
              </div>
            )}
            {budgetCompleted && (
              <div className="mt-2 flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">{t('treasury.budgetCompletedWarning', 'This activity budget is completed. Reopen it first to add transactions.')}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {t('treasury.category', 'Category')} *
              </label>
              <button
                type="button"
                onClick={() => { setShowNewCat(!showNewCat); setNewCatName('') }}
                className="flex items-center gap-1 text-xs font-semibold text-(--color-mySecondary) hover:text-(--color-mySecondary)/80 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {t('treasury.addCategory', 'Add')}
              </button>
            </div>
            <select
              {...register('category_id')}
              className={`w-full rounded-lg border ${errors.category_id ? 'border-red-400' : 'border-gray-300'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
            >
              <option value="">{t('common.select', 'Select...')}</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>
            )}

            {showNewCat && (
              <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
                  placeholder={t('treasury.categoryName', 'New category name')}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCatName.trim()) return
                    try {
                      await createCategory.mutateAsync({ name: newCatName.trim(), type: isExpense ? 'expense' : 'gain' })
                      toast.success(t('treasury.categoryCreated', 'Category added'))
                      setNewCatName('')
                      setShowNewCat(false)
                    } catch (err: any) {
                      toast.error(err.message || t('treasury.errorCreatingCategory', 'Failed to add category'))
                    }
                  }}
                  disabled={createCategory.isPending || !newCatName.trim()}
                  className="px-3 py-2 rounded-lg bg-(--color-myPrimary) text-white text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                >
                  {t('common.add', 'Add')}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.activityBudget', 'Activity Budget')}
            </label>
            <select
              {...register('activity_budget_id')}
              disabled={!!defaultActivityBudgetId}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{t('treasury.autoGeneral', 'Auto (General)')}</option>
              {budgets?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.activities?.name || t('treasury.general', 'General')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.date', 'Date')} *
            </label>
            <input
              type="date"
              {...register('date')}
              className={`w-full rounded-lg border ${errors.date ? 'border-red-400' : 'border-gray-300'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.description', 'Description')}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent resize-none"
              placeholder={t('treasury.descriptionPlaceholder', 'Optional description...')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('treasury.receipt', 'Receipt')}
            </label>
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-(--color-myPrimary) hover:bg-(--color-myPrimary)/5 transition-all">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {receipt ? receipt.name : t('treasury.uploadReceipt', 'Upload receipt (optional, max 5MB)')}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && file.size <= 5 * 1024 * 1024) {
                    setReceipt(file)
                  } else if (file) {
                    toast.error(t('treasury.fileTooLarge', 'File must be under 5MB'))
                  }
                }}
              />
              {receipt && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setReceipt(null)
                  }}
                  className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-(--color-myPrimary) text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isActivityBudget ? t('treasury.save', 'Save') : t('treasury.savePending', 'Save as Pending')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
