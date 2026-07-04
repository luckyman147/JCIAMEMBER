import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Download, Wallet, Edit, CheckCircle, RotateCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../utils/roles'
import Navbar from '../../../Global_Components/navBar'
import {
  ParticipationSection,
  ActivityCard,
  MediaPreviewModal,
  ActivityHeader,
  MeetingAgenda,
  ActivitySidebar,
  TypeSpecificDetails,
  RecapGallery,
  ActivityVideo,
  RecapVideoGallery,
  AttachmentLink,
  CommitteeTree
} from '../components'
import { useActivityDetail } from '../hooks/useActivityDetail'
import { useActivityBudgetByActivity, useApproveBudget, useReopenBudget, useDeleteBudget, useTransactions } from '../../Treasury/hooks/useTreasury'
import TransactionFormModal from '../../Treasury/components/TransactionFormModal'
import { treasuryService } from '../../Treasury/services/treasury.service'
import { exportActivityBudgetExcel } from '../../Treasury/services/treasury.export'

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const { user, role } = useAuth()
  const { t, i18n } = useTranslation()
  const { activity, categories, otherActivities, committees, members, loading, deleteActivity, treasurerId, generalSecretaryId } = useActivityDetail(id)

  const [preview, setPreview] = useState<{ items: {url: string; title: string}[]; activeIndex: number; isOpen: boolean }>({
    items: [],
    activeIndex: 0,
    isOpen: false
  })
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionLabel, setSessionLabel] = useState('')
  const [budgetGains, setBudgetGains] = useState(0)

  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  const { data: activityBudget, refetch: refetchBudget } = useActivityBudgetByActivity(id || '')
  const approveBudget = useApproveBudget()
  const reopenBudget = useReopenBudget()
  const deleteBudget = useDeleteBudget()
  const { data: budgetTxns } = useTransactions(
    activityBudget ? { session_id: sessionId || '', activity_budget_id: activityBudget.id } : undefined
  )

  useEffect(() => {
    if (isExecutive) {
      treasuryService.getActiveSession().then((s) => {
        if (s) { setSessionId(s.id); setSessionLabel(s.start_date?.split('-')[0] || '') }
      }).catch(() => {})
    }
  }, [isExecutive])

  useEffect(() => {
    if (activityBudget?.id) {
      treasuryService.getActivityBudgetTransactions(activityBudget.id).then((r) => {
        setBudgetGains(r.totalGains)
      }).catch(() => {})
    }
  }, [activityBudget?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!activity) return null

  const handlePreview = (url: string, title: string) => {
    setPreview({
      items: [{ url, title }],
      activeIndex: 0,
      isOpen: true
    })
  }

  const handleRecapPreview = (index: number) => {
    if (!activity.recap_images) return
    setPreview({
      items: activity.recap_images.map((url, i) => ({
        url,
        title: `${t('activities.recapPhotos')} ${i + 1}`
      })),
      activeIndex: index,
      isOpen: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 text-start">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 group">
            <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-1 rotate-180' : 'mr-1'} transition-transform group-hover:${i18n.dir() === 'rtl' ? 'translate-x-1' : '-translate-x-1'}`} />
            {t('activities.backToActivities')}
          </Link>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-8">
            <ActivityHeader
              activity={activity}
              isExecutive={isExecutive}
              onDelete={deleteActivity}
            />

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.aboutActivity')}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {activity.description || t('activities.noDescription')}
                  </p>
                </section>

                {activity.type === 'meeting' && activity.meeting_plan && (
                  <MeetingAgenda meetingPlan={activity.meeting_plan} />
                )}

                <TypeSpecificDetails activity={activity} />

                <AttachmentLink activity={activity} onPreview={handlePreview} />

                {activity.video_url && <ActivityVideo url={activity.video_url} />}

                <RecapGallery
                  images={activity.recap_images || []}
                  onImageClick={handleRecapPreview}
                />

                <RecapVideoGallery
                  videos={activity.recap_videos || []}
                />
              </div>

              <div className="md:col-span-1 space-y-6">
                <ActivitySidebar activity={activity} categories={categories} />
              </div>
            </div>
          </div>

          {(activity.type === 'event' && (committees.length > 0 || treasurerId || generalSecretaryId)) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
              <CommitteeTree
                committees={committees}
                projectId={activity.project_id}
                treasurerId={treasurerId}
                generalSecretaryId={generalSecretaryId}
                members={members}
              />
            </div>
          )}

          {isExecutive && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 mb-8">
              {activityBudget ? (
                <>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-(--color-myPrimary)/10 rounded-lg text-(--color-myPrimary)">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900">{t('treasury.budget', 'Budget')}</h3>
                <div className="flex-1" />
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  activityBudget.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                  activityBudget.status === 'approved' ? 'bg-(--color-myAccent)/10 text-(--color-myAccent)' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {activityBudget.status === 'completed' ? t('treasury.budgetCompleted', 'Completed') :
                   activityBudget.status === 'approved' ? t('treasury.budgetApproved', 'Approved') :
                   t('treasury.budgetPending', 'Pending')}
                </span>
                {activityBudget.status === 'pending' && isExecutive && (
                  <button onClick={async () => {
                    try {
                      await approveBudget.mutateAsync({ budgetId: activityBudget.id, userId: user?.id || '' })
                      await refetchBudget()
                      toast.success(t('treasury.budgetApprovedToast', 'Budget approved'))
                    } catch (err: any) {
                      toast.error(err.message || t('treasury.errorApprovingBudget', 'Failed to approve budget'))
                    }
                  }} disabled={approveBudget.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-(--color-myAccent) text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {t('treasury.approveBudget', 'Approve')}
                  </button>
                )}
                {activityBudget.status === 'completed' && isExecutive && (
                  <button onClick={async () => {
                    try {
                      await reopenBudget.mutateAsync({ budgetId: activityBudget.id, userId: user?.id || '' })
                      await refetchBudget()
                      toast.success(t('treasury.budgetReopened', 'Budget reopened'))
                    } catch (err: any) {
                      toast.error(err.message || t('treasury.errorReopeningBudget', 'Failed to reopen budget'))
                    }
                  }} disabled={reopenBudget.isPending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-(--color-myPrimary) text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('treasury.reopenBudget', 'Reopen')}
                  </button>
                )}
                <button onClick={() => setShowAddTxn(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-(--color-myPrimary) text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('treasury.addTransaction', 'Add')}
                </button>
                <button onClick={async () => {
                  if (!activityBudget || !sessionId) return
                  const txns = await treasuryService.getTransactions({ session_id: sessionId, activity_budget_id: activityBudget.id })
                  await exportActivityBudgetExcel(activityBudget, txns, sessionLabel)
                }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
                <button onClick={async () => {
                  if (!activityBudget) return
                  if (!window.confirm(t('treasury.confirmDeleteBudget', 'Delete this budget allocation?'))) return
                  try {
                    await deleteBudget.mutateAsync(activityBudget.id)
                    await refetchBudget()
                    toast.success(t('treasury.budgetDeleted', 'Budget deleted'))
                  } catch (err: any) {
                    toast.error(err.message || t('treasury.errorDeletingBudget', 'Failed to delete budget'))
                  }
                }} disabled={deleteBudget.isPending}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('treasury.deleteBudget', 'Delete')}
                </button>
                <Link to={`/treasury?activity=${activity.id}`}
                  className="inline-flex items-center justify-center px-3 py-2 text-(--color-myPrimary) rounded-lg text-xs font-semibold hover:bg-(--color-myPrimary)/10 transition-all"
                >
                  {t('treasury.viewFull', 'Full')}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-(--color-myPrimary)/5 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium text-gray-500">{t('treasury.allocated', 'Allocated')}</p>
                  {editingBudget ? (
                    <div className="flex items-center gap-1 justify-center mt-1">
                      <input type="number" min="0" value={budgetInput}
                        onChange={(e) => setBudgetInput(Number(e.target.value))}
                        className="w-20 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
                      />
                      <button onClick={async () => {
                        try {
                          await treasuryService.updateBudgetAllocation(activityBudget.id, { allocated_amount: budgetInput })
                          await refetchBudget()
                          toast.success(t('treasury.budgetUpdated', 'Budget updated'))
                        } catch { toast.error(t('treasury.errorUpdatingBudget', 'Failed to update budget')) }
                        setEditingBudget(false)
                      }} className="text-xs text-(--color-myPrimary) font-semibold">OK</button>
                      <button onClick={() => setEditingBudget(false)} className="text-xs text-gray-400">X</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 justify-center mt-1">
                      <span className="text-lg font-bold text-(--color-myPrimary)">{activityBudget.allocated_amount.toLocaleString()} TND</span>
                      {activityBudget.status !== 'completed' && (
                        <button onClick={() => { setBudgetInput(activityBudget.allocated_amount); setEditingBudget(true) }} className="p-0.5 text-gray-400 hover:text-(--color-myPrimary)">
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium text-gray-500">{t('treasury.spent', 'Spent')}</p>
                  <p className="text-lg font-bold text-red-500 mt-1">{activityBudget.spent_amount.toLocaleString()} TND</p>
                </div>
                <div className="bg-(--color-myAccent)/5 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium text-gray-500">{t('treasury.totalGains', 'Gains')}</p>
                  <p className="text-lg font-bold text-(--color-myAccent) mt-1">{budgetGains.toLocaleString()} TND</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${budgetGains >= activityBudget.spent_amount ? 'bg-(--color-myAccent)/5' : 'bg-red-50'}`}>
                  <p className="text-xs font-medium text-gray-500">{t('treasury.difference', 'Difference')}</p>
                  <p className={`text-lg font-bold mt-1 ${budgetGains >= activityBudget.spent_amount ? 'text-(--color-myAccent)' : 'text-red-500'}`}>
                    {(budgetGains - activityBudget.spent_amount) >= 0 ? '+' : ''}{(budgetGains - activityBudget.spent_amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('treasury.remaining', 'Remaining')}</span>
                <span className="font-semibold text-(--color-mySecondary)">{activityBudget.remaining_amount.toLocaleString()} TND</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                {(() => {
                  const pct = activityBudget.allocated_amount > 0 ? (activityBudget.spent_amount / activityBudget.allocated_amount) * 100 : 0
                  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-(--color-mySecondary)' : 'bg-(--color-myAccent)'
                  return <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                })()}
              </div>

              {budgetTxns && budgetTxns.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">{t('treasury.transactions', 'Transactions')}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.date', 'Date')}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.type', 'Type')}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.category', 'Category')}</th>
                          <th className="text-right py-2 px-2 text-gray-500 font-medium">{t('treasury.amount', 'Amount')}</th>
                          <th className="text-left py-2 px-2 text-gray-500 font-medium">{t('treasury.description', 'Notes')}</th>
                          <th className="text-center py-2 px-2 text-gray-500 font-medium">{t('treasury.status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetTxns.map((txn) => (
                          <tr key={txn.id} className="border-b border-gray-50">
                            <td className="py-2 px-2 text-gray-700">{txn.date}</td>
                            <td className="py-2 px-2">
                              {txn.type === 'gain' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-(--color-myAccent)/10 text-(--color-myAccent)">
                                  {t('treasury.gain', 'Gain')}
                                </span>
                              ) : txn.type === 'expense_paid' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                  {t('treasury.paidNow', 'Paid')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-(--color-mySecondary)/10 text-(--color-mySecondary)">
                                  {t('treasury.reserved', 'Reserved')}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{txn.categories?.name || '-'}</td>
                            <td className={`py-2 px-2 text-right font-semibold ${txn.type === 'gain' ? 'text-(--color-myAccent)' : 'text-red-500'}`}>
                              {txn.type === 'gain' ? '+' : '-'}{txn.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-gray-500 max-w-[120px] truncate" title={txn.description || ''}>
                              {txn.description || '-'}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold ${
                                txn.status === 'approved' ? 'bg-(--color-myAccent)/10 text-(--color-myAccent)' :
                                txn.status === 'rejected' ? 'bg-red-100 text-red-600' :
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
              </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-(--color-myPrimary)/10 rounded-lg text-(--color-myPrimary)">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900">{t('treasury.budget', 'Budget')}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{t('treasury.noBudget', 'No budget allocated yet')}</p>
                  {sessionId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(Number(e.target.value))}
                        placeholder={t('treasury.amountPlaceholder', 'Amount (TND)')}
                        className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent"
                      />
                      <button
                        onClick={async () => {
                          if (!sessionId || budgetInput <= 0) return
                          try {
                            await treasuryService.allocateBudget({
                              session_id: sessionId,
                              activity_id: id,
                              allocated_amount: budgetInput,
                            })
                            await refetchBudget()
                            toast.success(t('treasury.budgetCreated', 'Budget allocated'))
                          } catch {
                            toast.error(t('treasury.errorCreatingBudget', 'Failed to allocate budget'))
                          }
                        }}
                        className="px-4 py-2 bg-(--color-myPrimary) text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
                      >
                        {t('treasury.setBudget', 'Set Budget')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">{t('treasury.noActiveSession', 'No active session available')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="mt-12">
              <ParticipationSection activityId={activity.id} activityPoints={activity.activity_points} />
            </div>
          ) : (
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-800 font-semibold">
                {t('activities.signupToSeeMore', 'Sign up to participate and view full activity details')}
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t('auth.createAccount', 'Create Account')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex px-5 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  {t('auth.signIn', 'Sign In')}
                </Link>
              </div>
            </div>
          )}

          {otherActivities.length > 0 && (
            <div className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('activities.discoverMore')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MediaPreviewModal
        items={preview.items}
        initialIndex={preview.activeIndex}
        isOpen={preview.isOpen}
        onClose={() => setPreview(prev => ({ ...prev, isOpen: false }))}
      />

      {isExecutive && sessionId && activityBudget && (
        <TransactionFormModal
          isOpen={showAddTxn}
          onClose={() => { setShowAddTxn(false); refetchBudget() }}
          defaultActivityBudgetId={activityBudget.id}
          sessionId={sessionId}
        />
      )}
    </div>
  )
}
