import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Clock, Users, User, Edit2, Trash2, ChevronRight } from 'lucide-react'
import type { Outing } from '../types/outing.types'
import { useAuth } from '../../Authentication/auth.context'
import JoinButton from './JoinButton'
import LeaveButton from './LeaveButton'

interface OutingCardProps {
  outing: Outing
  onJoin: () => void
  onLeave: () => void
  onDelete: () => void
  joinLoading?: boolean
  leaveLoading?: boolean
}

export default function OutingCard({ outing, onJoin, onLeave, onDelete, joinLoading, leaveLoading }: OutingCardProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isOwner = user?.id === outing.created_by
  const isFull = (outing.participant_count ?? 0) >= outing.max_participants

  return (
    <Link
      to={`/outings/${outing.id}`}
      className="group block bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-(--color-myPrimary)/20 transition-all duration-300 cursor-pointer"
    >
      {outing.cover_image ? (
        <div className="relative overflow-hidden h-48">
          <img
            src={outing.cover_image}
            alt={outing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 text-gray-800 backdrop-blur-sm">
            {t(`outings.categories.${outing.category}`)}
          </span>
        </div>
      ) : (
        <div className="relative w-full h-48 bg-gradient-to-br from-(--color-myPrimary)/20 via-(--color-myPrimary)/10 to-(--color-myAccent)/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="text-center">
            <span className="text-6xl font-bold text-(--color-myPrimary)/20">
              {outing.title.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="absolute bottom-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full bg-(--color-myPrimary)/15 text-(--color-myPrimary) backdrop-blur-sm">
            {t(`outings.categories.${outing.category}`)}
          </span>
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1.5 group-hover:text-(--color-myPrimary) transition-colors line-clamp-1">{outing.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {outing.description}
        </p>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(outing.date).toLocaleDateString()}</span>
          <span className="mx-1">·</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{outing.start_time?.slice(0, 5)}</span>
        </div>

        {outing.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{outing.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>{outing.participant_count ?? 0}/{outing.max_participants}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-24">{outing.profiles?.fullname}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700">
          {outing.user_joined ? (
            <div onClick={(e) => e.preventDefault()}>
              <LeaveButton onClick={onLeave} isLoading={leaveLoading} />
            </div>
          ) : (
            <div onClick={(e) => e.preventDefault()}>
              <JoinButton onClick={onJoin} isLoading={joinLoading} disabled={isFull} />
            </div>
          )}
          <span className="ml-auto flex items-center gap-1 text-sm text-(--color-myPrimary) font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            {t('outings.viewDetails')} <ChevronRight className="w-4 h-4" />
          </span>
          {isOwner && (
            <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
              <Link
                to={`/outings/${outing.id}/edit`}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('outings.edit')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); onDelete() }}
                className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label={t('outings.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
