
import { useTranslation } from 'react-i18next'
import { FileUpload, FormSection } from '../../../../../components'
import type { UseFileUploadReturn } from '../../../hooks/useFileUpload'

interface CoverImageSectionProps {
  activityType: string
  fileUpload: UseFileUploadReturn
}

export default function CoverImageSection({ activityType, fileUpload }: CoverImageSectionProps) {
  const { t } = useTranslation()
  // Meetings don't have cover images
  if (activityType === 'meeting') return null

  return (
    <FormSection title={t('activities.coverImage')}>
      <div className="text-start">
        <FileUpload
          label={t('activities.activityImageOptional')}
          accept="image"
          onFileSelect={(files) => fileUpload.setFile(files)}
          onFileRemove={fileUpload.clearFiles}
          currentFiles={fileUpload.file}
          currentUrls={fileUpload.urls}
        />
      </div>
    </FormSection>
  )
}
