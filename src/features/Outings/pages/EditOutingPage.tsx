import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import Navbar from '../../../Global_Components/navBar'
import { useAuth } from '../../Authentication/auth.context'
import { useOuting, useUpdateOuting } from '../hooks/useOutings'
import { useOutingForm } from '../hooks/useOutingForm'
import OutingForm from '../components/OutingForm'
import { uploadOutingImage } from '../../../utils/uploadHelpers'

export default function EditOutingPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: outing, isLoading } = useOuting(id!)
  const updateMutation = useUpdateOuting()
  const form = useOutingForm(outing)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="md:ms-64 pt-16 md:pt-6">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (outing && user?.id !== outing.created_by) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="md:ms-64 pt-16 md:pt-6">
          <div className="max-w-3xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-500">{t('outings.error')}</p>
          </div>
        </main>
      </div>
    )
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      let coverImageUrl = data.cover_image as string | undefined
      if (coverImageUrl && coverImageUrl.startsWith('blob:')) {
        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
        const file = fileInput?.files?.[0]
        if (file) {
          const result = await uploadOutingImage(file)
          if (result.success) coverImageUrl = result.url
        }
      }
      await updateMutation.mutateAsync({ id: id!, data: { ...data, cover_image: coverImageUrl || undefined } as any })
      toast.success(t('outings.updateSuccess'))
      navigate('/outings')
    } catch {
      toast.error(t('outings.errorUpdating'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <OutingForm
              form={form}
              onSubmit={onSubmit}
              isEditMode
              onCancel={() => navigate(`/outings/${id}`)}
              isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
