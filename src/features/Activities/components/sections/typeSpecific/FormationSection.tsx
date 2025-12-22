import type { UseFormRegister } from 'react-hook-form'

import { User } from 'lucide-react'
import { FileUpload, FormInput, FormSection } from '../../../../../components'
import type { ActivityFormValues } from '../../../schemas/activitySchema'
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
