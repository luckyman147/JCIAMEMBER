import { FormSection, FileUpload } from '../../../../../components'
import type { UseFileUploadReturn } from '../../../hooks/useFileUpload'
import { useTranslation } from 'react-i18next'

interface RecapImagesSectionProps {
  fileUpload: UseFileUploadReturn
}

export default function RecapImagesSection({ fileUpload }: RecapImagesSectionProps) {
  const { t } = useTranslation()
  const handleRemove = (index: number) => {
    if (index < fileUpload.urls.length) {
      // Remove from URLs
      fileUpload.setUrls(fileUpload.urls.filter((_, i) => i !== index))
    } else {
      // Remove from files
      const fileIndex = index - fileUpload.urls.length
      fileUpload.setFile(fileUpload.file.filter((_, i) => i !== fileIndex))
    }
  }

  return (
    <FormSection title={t('activities.recapImagesSectionLabel')}>
      <div className="space-y-2 text-start">
        <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">
          {t('activities.recapImagesDescription')}
        </p>
        <FileUpload
          label={t('activities.activityPhotos')}
          accept="image"
          multiple={true}
          onFileSelect={(files) => fileUpload.setFile([...fileUpload.file, ...files])}
          onFileRemove={handleRemove}
          currentFiles={fileUpload.file}
          currentUrls={fileUpload.urls}
        />
      </div>
    </FormSection>
  )
}
