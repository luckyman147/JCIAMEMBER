import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import Navbar from '../../../Global_Components/navBar'
import { useCreateOuting, useInviteMembers } from '../hooks/useOutings'
import { useOutingForm } from '../hooks/useOutingForm'
import OutingForm from '../components/OutingForm'
import InviteMembers from '../components/InviteMembers'
import { uploadOutingImage } from '../../../utils/uploadHelpers'

export default function CreateOutingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateOuting()
  const inviteMutation = useInviteMembers()
  const form = useOutingForm()
  const [invitedIds, setInvitedIds] = useState<string[]>([])

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
      const outing = await createMutation.mutateAsync({ ...data, cover_image: coverImageUrl || undefined } as any)
      if (invitedIds.length > 0) {
        await inviteMutation.mutateAsync({ outingId: outing.id, inviteeIds: invitedIds })
      }
      toast.success(t('outings.createSuccess'))
      navigate('/outings')
    } catch {
      toast.error(t('outings.errorCreating'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
            <OutingForm
              form={form}
              onSubmit={onSubmit}
              onCancel={() => navigate('/outings')}
              isLoading={createMutation.isPending}
            />
            <div className="border-t pt-6 dark:border-gray-700">
              <InviteMembers selectedIds={invitedIds} onChange={setInvitedIds} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
