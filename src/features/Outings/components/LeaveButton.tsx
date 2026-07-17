import { useTranslation } from 'react-i18next'
import { UserMinus, Loader2 } from 'lucide-react'

interface LeaveButtonProps {
  onClick: () => void
  isLoading?: boolean
}

export default function LeaveButton({ onClick, isLoading }: LeaveButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-50"
      aria-label={t('outings.leave')}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserMinus className="w-4 h-4" />
      )}
      {t('outings.leave')}
    </button>
  )
}
