import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FormActionsProps {
  isEditMode: boolean
  loading: boolean
  uploading: boolean
  onCancel: () => void
}

export default function FormActions({ 
  isEditMode, 
  loading, 
  uploading, 
  onCancel 
}: FormActionsProps) {
  const isSubmitting = loading || uploading
  const { t, i18n } = useTranslation()

  return (
    <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {t('profile.cancel')}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-(--color-myPrimary) hover:bg-(--color-mySecondary) focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className={`animate-spin h-4 w-4 ${i18n.dir() === 'rtl' ? 'ml-2' : '-ml-1 mr-2'}`} />
            {uploading ? t('activities.uploading') : (isEditMode ? t('activities.updating') : t('activities.creating'))}
          </>
        ) : (
          isEditMode ? t('activities.updateActivity') : t('activities.createActivity')
        )}
      </button>
    </div>
  )
}
