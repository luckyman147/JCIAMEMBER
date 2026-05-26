import { X, Trash2, Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useDeleteSession, useArchiveSession } from '../hooks/useTreasury'
import type { TreasurySession } from '../types'

interface DeleteSessionDialogProps {
  isOpen: boolean
  onClose: () => void
  session: TreasurySession | null
}

export default function DeleteSessionDialog({ isOpen, onClose, session }: DeleteSessionDialogProps) {
  const { t } = useTranslation()
  const deleteSession = useDeleteSession()
  const archiveSession = useArchiveSession()

  if (!isOpen || !session) return null

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync(session.id)
      toast.success(t('treasury.sessionDeleted', 'Session permanently deleted'))
      onClose()
    } catch (err: any) {
      toast.error(err.message || t('treasury.errorDeletingSession', 'Failed to delete session'))
    }
  }

  const handleArchive = async () => {
    try {
      await archiveSession.mutateAsync(session.id)
      toast.success(t('treasury.sessionArchived', 'Session archived'))
      onClose()
    } catch (err: any) {
      toast.error(err.message || t('treasury.errorArchivingSession', 'Failed to archive session'))
    }
  }

  const busy = deleteSession.isPending || archiveSession.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{t('treasury.manageSession', 'Manage Session')}</h3>
          <button onClick={busy ? undefined : onClose} disabled={busy} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          {t('treasury.deleteSessionWarning', 'What would you like to do with this session?')}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDelete}
            disabled={busy}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 hover:border-red-400 bg-red-50/50 hover:bg-red-50 transition-all group disabled:opacity-50"
          >
            <div className="p-2 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">{t('treasury.deleteEverything', 'Delete Everything')}</p>
              <p className="text-xs text-gray-500">{t('treasury.deleteEverythingDesc', 'Permanently delete session, budgets, transactions, and attachments')}</p>
            </div>
            {deleteSession.isPending && <Loader2 className="w-5 h-5 animate-spin text-red-500 ml-auto" />}
          </button>

          <button
            onClick={handleArchive}
            disabled={busy}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-(--color-mySecondary) bg-gray-50/50 hover:bg-(--color-mySecondary)/5 transition-all group disabled:opacity-50"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-(--color-mySecondary)/10 group-hover:text-(--color-mySecondary) transition-colors">
              <Archive className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">{t('treasury.archiveSession_', 'Archive Session')}</p>
              <p className="text-xs text-gray-500">{t('treasury.archiveSessionDesc', 'Mark session as archived — all data is preserved')}</p>
            </div>
            {archiveSession.isPending && <Loader2 className="w-5 h-5 animate-spin text-(--color-mySecondary) ml-auto" />}
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={busy}
          className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t('common.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  )
}