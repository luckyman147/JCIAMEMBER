import { useTranslation } from 'react-i18next'
import { FileUpload, FormSection } from '../../../../../components'
import type { UseFileUploadReturn } from '../../../hooks/useFileUpload'

interface CoverVideoSectionProps {
  activityType: string
  fileUpload: UseFileUploadReturn
}

export default function CoverVideoSection({ activityType, fileUpload }: CoverVideoSectionProps) {
  const { t } = useTranslation()
  
  // Meetings don't have cover videos
  if (activityType === 'meeting') return null

  return (
    <FormSection title={t('activities.coverVideo')}>
      <div className="text-start">
        <FileUpload
          label={t('activities.activityVideoOptional')}
          accept="video"
          onFileSelect={(files) => fileUpload.setFile(files)}
          onFileRemove={fileUpload.clearFiles}
          currentFiles={fileUpload.file}
          currentUrls={fileUpload.urls}
        />
      </div>
    </FormSection>
  )
}
