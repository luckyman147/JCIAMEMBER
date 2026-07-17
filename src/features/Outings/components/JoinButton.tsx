import { useTranslation } from 'react-i18next'
import { UserPlus, Loader2 } from 'lucide-react'

interface JoinButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
}

export default function JoinButton({ onClick, isLoading, disabled }: JoinButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={t('outings.join')}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {t('outings.join')}
    </button>
  )
}
