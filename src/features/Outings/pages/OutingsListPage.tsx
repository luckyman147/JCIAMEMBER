import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from '../../../Global_Components/navBar'
import { useAuth } from '../../Authentication/auth.context'
import { useOutings, useJoinOuting, useLeaveOuting, useDeleteOuting } from '../hooks/useOutings'
import { useOutingRealtime } from '../hooks/useOutingRealtime'
import OutingCard from '../components/OutingCard'
import OutingFilters from '../components/OutingFilters'
import FloatingCreateButton from '../components/FloatingCreateButton'
import ConfirmationDialog from '../components/ConfirmationDialog'
import type { OutingFilters as Filters } from '../types/outing.types'

export default function OutingsListPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [filters, setFilters] = useState<Filters>({ dateFilter: 'upcoming', sortBy: 'nearest' })
  const { outings, loading, error, refetch } = useOutings(filters)
  const joinMutation = useJoinOuting()
  const leaveMutation = useLeaveOuting()
  const deleteMutation = useDeleteOuting()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useOutingRealtime()

  const handleJoin = (id: string) => {
    joinMutation.mutate(id, {
      onSuccess: () => toast.success(t('outings.joinSuccess')),
      onError: (err: Error) => toast.error(t(`outings.${err.message}`) || t('outings.errorJoining')),
    })
  }

  const handleLeave = (id: string) => {
    leaveMutation.mutate(id, {
      onSuccess: () => toast.success(t('outings.leaveSuccess')),
      onError: () => toast.error(t('outings.errorLeaving')),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success(t('outings.deleteSuccess'))
        setDeleteTarget(null)
      },
      onError: () => toast.error(t('outings.errorDeleting')),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="text-start">
              <h1 className="text-3xl font-bold">{t('outings.title')}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('outings.subtitle')}</p>
            </div>
            {user && (
              <Link
                to="/outings/create"
                className="hidden md:inline-flex items-center gap-2 bg-(--color-myPrimary) text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {t('outings.create')}
              </Link>
            )}
          </div>

          <OutingFilters filters={filters} onChange={setFilters} />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 h-96 rounded-xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500">{t('outings.error')}</p>
              <button onClick={() => refetch()} className="mt-4 text-(--color-myPrimary) font-medium hover:underline">
                {t('outings.retry')}
              </button>
            </div>
          ) : outings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Calendar className="w-16 h-16 text-gray-200 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">{t('outings.noOutings')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('outings.noOutingsSubtitle')}</p>
              <button
                onClick={() => setFilters({})}
                className="mt-4 text-(--color-myPrimary) font-medium hover:underline"
              >
                {t('outings.clearFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outings.map((outing) => (
                <OutingCard
                  key={outing.id}
                  outing={outing}
                  onJoin={() => handleJoin(outing.id)}
                  onLeave={() => handleLeave(outing.id)}
                  onDelete={() => setDeleteTarget(outing.id)}
                  joinLoading={joinMutation.isPending}
                  leaveLoading={leaveMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      {user && <FloatingCreateButton />}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('outings.delete')}
        message={t('outings.confirmDelete')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
