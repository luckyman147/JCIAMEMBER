
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface MeetingAgendaProps {
  meetingPlan: string
}

export default function MeetingAgenda({ meetingPlan }: MeetingAgendaProps) {
  const { t, i18n } = useTranslation()

  try {
    const agendaItems = JSON.parse(meetingPlan) as Array<{id: string, title: string, estimatedTime: number}>
    
    if (!agendaItems?.length) return null

    return (
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.meetingAgenda')}</h2>
        <div className="bg-(--color-myAccent) rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-200">
            {agendaItems.map((item, index) => (
              <div key={item.id || index} className="p-4 flex items-center justify-between hover:bg-gray-100/10 transition-colors">
                <div className="flex items-center gap-3 text-white">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white text-(--color-myAccent) flex items-center justify-center text-sm font-bold shadow-sm">
                    {index + 1}
                  </span>
                  <span className="font-bold">{item.title}</span>
                </div>
                <div className="flex items-center text-sm text-white font-bold gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {item.estimatedTime} {t('activities.min')}
                </div>
              </div>
            ))}
            <div className={`p-3 bg-white text-sm font-semibold text-gray-600 ${i18n.dir() === 'rtl' ? 'text-left' : 'text-right'}`}>
              {t('activities.totalTime')}: {agendaItems.reduce((acc, curr) => acc + (Number(curr.estimatedTime) || 0), 0)} {t('activities.min')}
            </div>
          </div>
        </div>
      </section>
    )
  } catch (e) {
    console.error('Failed to parse meeting plan', e)
    return null
  }
}
