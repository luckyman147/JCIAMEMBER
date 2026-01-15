
import { FormSection, FileUpload } from '../../../../../../components'
import type { AgendaItem } from '../../../../models/MeetingAgenda'
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
  register: any
}

export default function MeetingSection({ 
  agenda, 
  onAgendaChange, 
  pvAttachment,
  register,
  disabled = false 
}: MeetingSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.meetingDetails')}>
      <div className="space-y-6 text-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t('activities.meetingType')}
            </label>
            <select
              {...register('meeting_type')}
              disabled={disabled}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="official">{t('activities.meetingTypeOfficial')}</option>
              <option value="committee">{t('activities.meetingTypeCommittee')}</option>
            </select>
          </div>
        </div>

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
