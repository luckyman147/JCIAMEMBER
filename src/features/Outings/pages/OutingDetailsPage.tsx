import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Calendar, Clock, Users, User, Edit2, Trash2, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../../Global_Components/navBar'
import { useAuth } from '../../Authentication/auth.context'
import { useOuting, useJoinOuting, useLeaveOuting, useDeleteOuting, useInviteMembers } from '../hooks/useOutings'
import { outingService } from '../services/outing.service'
import JoinButton from '../components/JoinButton'
import LeaveButton from '../components/LeaveButton'
import ParticipantList from '../components/ParticipantList'
import MapPreview from '../components/MapPreview'
import InviteMembers from '../components/InviteMembers'
import ConfirmationDialog from '../components/ConfirmationDialog'

export default function OutingDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: outing, isLoading, error, refetch } = useOuting(id!)
  const { data: members = [] } = useQuery({
    queryKey: ['outings', id, 'members'],
    queryFn: () => outingService.getOutingMembers(id!),
    enabled: !!id,
  })
  const joinMutation = useJoinOuting()
  const leaveMutation = useLeaveOuting()
  const deleteMutation = useDeleteOuting()
  const inviteMutation = useInviteMembers()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [invitedIds, setInvitedIds] = useState<string[]>([])

  const handleJoin = () => {
    if (!id) return
    joinMutation.mutate(id, {
      onSuccess: () => toast.success(t('outings.joinSuccess')),
      onError: (err: Error) => toast.error(t(`outings.${err.message}`) || t('outings.errorJoining')),
    })
  }

  const handleLeave = () => {
    if (!id) return
    leaveMutation.mutate(id, {
      onSuccess: () => toast.success(t('outings.leaveSuccess')),
      onError: () => toast.error(t('outings.errorLeaving')),
    })
  }

  const handleDelete = () => {
    if (!id) return
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(t('outings.deleteSuccess'))
        navigate('/outings')
      },
      onError: () => toast.error(t('outings.errorDeleting')),
    })
  }

  const handleInvite = () => {
    if (!id || invitedIds.length === 0) return
    inviteMutation.mutate(
      { outingId: id, inviteeIds: invitedIds },
      {
        onSuccess: () => {
          toast.success(t('outings.invitationSent'))
          setInvitedIds([])
        },
        onError: () => toast.error(t('outings.errorCreating')),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="md:ms-64 pt-16 md:pt-6">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="md:ms-64 pt-16 md:pt-6">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-500">{t('outings.error')}</p>
            <button onClick={() => refetch()} className="mt-4 text-(--color-myPrimary) font-medium hover:underline">
              {t('outings.retry')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!outing) return null

  const isOwner = user?.id === outing.created_by
  const isFull = (outing.participant_count ?? 0) >= outing.max_participants

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/outings"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('outings.title')}
          </Link>

          {outing.cover_image && (
            <div className="relative rounded-2xl overflow-hidden mb-8">
              <img src={outing.cover_image} alt={outing.title} className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-gray-800 backdrop-blur-sm mb-3">
                  {t(`outings.categories.${outing.category}`)}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{outing.title}</h1>
              </div>
            </div>
          )}

          {!outing.cover_image && (
            <div className="mb-8">
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-(--color-myPrimary)/10 text-(--color-myPrimary) mb-3">
                {t(`outings.categories.${outing.category}`)}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold">{outing.title}</h1>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            {outing.user_joined ? (
              <LeaveButton onClick={handleLeave} isLoading={leaveMutation.isPending} />
            ) : (
              <JoinButton onClick={handleJoin} disabled={isFull} />
            )}
            {isOwner && (
              <>
                <Link
                  to={`/outings/${id}/edit`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('outings.edit')}
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('outings.delete')}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">{t('outings.detailsTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{outing.description}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {t('outings.location')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {outing.address}
                </p>
                <MapPreview latitude={outing.latitude} longitude={outing.longitude} address={outing.address} />
              </div>

              {isOwner && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <InviteMembers selectedIds={invitedIds} onChange={setInvitedIds} />
                  {invitedIds.length > 0 && (
                    <button
                      onClick={handleInvite}
                      disabled={inviteMutation.isPending}
                      className="mt-3 w-full px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {inviteMutation.isPending ? t('outings.skeleton') : t('outings.invitationSent')}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('outings.detailsTitle')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-(--color-myPrimary)" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('outings.date')}</p>
                      <p className="font-medium">{new Date(outing.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-(--color-myPrimary)" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('outings.startTime')}</p>
                      <p className="font-medium">{outing.start_time?.slice(0, 5)} - {outing.end_time?.slice(0, 5)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-(--color-myPrimary)" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('outings.organizer')}</p>
                      <p className="font-medium">{outing.profiles?.fullname}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-(--color-myPrimary)" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('outings.participants')}</p>
                      <p className="font-medium">{outing.participant_count ?? 0} / {outing.max_participants}</p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${outing.latitude},${outing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{t('outings.openInMaps')}</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <ParticipantList members={members} maxParticipants={outing.max_participants} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('outings.delete')}
        message={t('outings.confirmDelete')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
