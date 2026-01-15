import type { UseFormRegister } from 'react-hook-form'

import { User } from 'lucide-react'
import { FileUpload, FormInput, FormSection } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

interface FormationSectionProps {
  register: UseFormRegister<ActivityFormValues>
  courseAttachment: {
    file: File[]
    urls: string[]
    setFile: (files: File[]) => void
    clearFiles: () => void
  }
}

export default function FormationSection({ 
  register, 
  courseAttachment
}: FormationSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.formationDetails')}>
      <div className="space-y-6 text-start">
        <FormInput
          id="trainer_name"
          label={t('activities.trainerNameOptional')}
          placeholder={t('activities.trainerNamePlaceholder')}
          icon={<User className="h-5 w-5 text-gray-400" />}
          register={register('trainer_name')}
        />

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-gray-100/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-blue-100 text-blue-600`}>
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('activities.trainingType')}</p>
              </div>
            </div>
            <select
              {...register('training_type')}
              className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="just_training">{t('activities.justTraining')}</option>
              <option value="official_session">{t('activities.officialSession')}</option>
              <option value="important_training">{t('activities.importantTraining')}</option>
              <option value="member_to_member">{t('activities.memberToMemberTraining')}</option>
            </select>
          </div>
        </div>
        <FileUpload
          label={t('activities.courseMaterialsOptional')}
          accept="document"
          onFileSelect={(files) => courseAttachment.setFile(files)}
          onFileRemove={courseAttachment.clearFiles}
          currentFiles={courseAttachment.file}
          currentUrls={courseAttachment.urls}
        />
      </div>
    </FormSection>
  )
}
