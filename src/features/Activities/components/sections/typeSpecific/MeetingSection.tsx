
import { FormSection, FileUpload } from '../../../../../components'
import type { AgendaItem } from '../../../models/MeetingAgenda'
import MeetingAgendaComponent from './MeetingAgenda'
import { useTranslation } from 'react-i18next'

interface MeetingSectionProps {
  agenda: AgendaItem[]
  onAgendaChange: (agenda: AgendaItem[]) => void
  pvAttachment: {
    file: File[]
    urls: string[]
    setFile: (files: File[]) => void
    clearFiles: () => void
  }
  disabled?: boolean
}

export default function MeetingSection({ 
  agenda, 
  onAgendaChange, 
  pvAttachment,
  disabled = false 
}: MeetingSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.meetingDetails')}>
      <div className="space-y-6 text-start">
        <MeetingAgendaComponent
          agenda={agenda}
          onChange={onAgendaChange}
          disabled={disabled}
        />
        <FileUpload
          label={t('activities.pvAttachmentsLabel')}
          accept="document"
          onFileSelect={(files) => pvAttachment.setFile(files)}
          onFileRemove={pvAttachment.clearFiles}
          currentFiles={pvAttachment.file}
          currentUrls={pvAttachment.urls}
        />
      </div>
    </FormSection>
  )
}
