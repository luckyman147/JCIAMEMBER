import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function FloatingCreateButton() {
  const { t } = useTranslation()

  return (
    <Link
      to="/outings/create"
      className="fixed bottom-6 right-6 z-40 md:hidden w-14 h-14 bg-(--color-myPrimary) text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
      aria-label={t('outings.create')}
    >
      <Plus className="w-6 h-6" />
    </Link>
  )
}
