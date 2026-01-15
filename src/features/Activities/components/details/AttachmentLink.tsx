
import { useTranslation } from 'react-i18next'
import { FileText, ExternalLink } from 'lucide-react'
import type { Activity } from '../../models/Activity'
import { isMeetingActivity, isFormationActivity } from '../../models/Activity'

interface AttachmentLinkProps {
  activity: Activity
  onPreview: (url: string, title: string) => void
}

export default function AttachmentLink({ activity, onPreview }: AttachmentLinkProps) {
  const { t } = useTranslation()

  let attachmentUrl = ''
  let title = ''

  if (isMeetingActivity(activity)) {
    attachmentUrl = activity.pv_attachments || ''
    title = t('activities.meetingPV')
  } else if (isFormationActivity(activity)) {
    attachmentUrl = activity.course_attachment || ''
    title = t('activities.courseDocument')
  }
  
  if (!attachmentUrl) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        {activity.type === 'meeting' ? t('activities.pvDocument') : t('activities.courseMaterials')}
      </h2>
      <button
        onClick={() => onPreview(attachmentUrl, title)}
        className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group shadow-sm"
      >
        <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
            {title}
          </p>
          <p className="text-sm text-gray-500 truncate font-medium">{t('activities.clickToView')}</p>
        </div>
        <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </button>
    </section>
  )
}
