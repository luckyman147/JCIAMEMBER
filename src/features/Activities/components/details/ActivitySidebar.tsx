
import { Calendar, MapPin, Video, DollarSign, Clock, Tag, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Activity } from '../../models/Activity'
import type { Category } from '../../../Members/services/members.service'

interface ActivitySidebarProps {
  activity: Activity
  categories: Category[]
}

export default function ActivitySidebar({ activity, categories }: ActivitySidebarProps) {
  const { t, i18n } = useTranslation()
  const startDate = new Date(activity.activity_begin_date)
  const endDate = new Date(activity.activity_end_date)

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 text-start shadow-sm sticky top-24">
      <h3 className="font-bold text-gray-900 mb-4">{t('activities.eventDetails')}</h3>
      
      <DetailItem 
        icon={<Calendar className="w-5 h-5 text-gray-400 mt-0.5" />}
        label={t('activities.startDate')}
        value={`${startDate.toLocaleDateString(i18n.language)} ${t('activities.at')} ${startDate.toLocaleTimeString(i18n.language, {hour: '2-digit', minute:'2-digit'})}`}
      />

      <DetailItem 
        icon={<Clock className="w-5 h-5 text-gray-400 mt-0.5" />}
        label={t('activities.endDate')}
        value={`${endDate.toLocaleDateString(i18n.language)} ${t('activities.at')} ${endDate.toLocaleTimeString(i18n.language, {hour: '2-digit', minute:'2-digit'})}`}
      />

      <div className="flex items-start gap-3">
        {activity.is_online ? <Video className="w-5 h-5 text-green-500 mt-0.5" /> : <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />}
        <div>
          <p className="text-sm font-semibold text-gray-900">{activity.is_online ? t('activities.online') : t('activities.location')}</p>
          <p className="text-sm text-gray-600 wrap-break-word">
            {activity.is_online ? (
              <a href={activity.online_link || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {activity.online_link || t('activities.linkTBD')}
              </a>
            ) : (
              activity.activity_address || t('activities.addressTBD')
            )}
          </p>
        </div>
      </div>

      <DetailItem 
        icon={<Users className="w-5 h-5 text-blue-500 mt-0.5" />}
        label={t('activities.participants')}
        value={`${activity.activity_participants?.[0]?.count || 0} ${t('activities.membersJoined')}`}
      />

      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-900">
            {activity.is_paid && activity.price ? `${activity.price} DT` : t('activities.free')}
          </span>
        </div>
        {activity.activity_points > 0 && (
          <span className="text-sm font-bold px-3 py-1 bg-(--color-mySecondary) text-white rounded-lg shadow-sm">
            {t('activities.points', { count: activity.activity_points })}
          </span>
        )}
      </div>

      {categories.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{t('activities.categories')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <span 
                key={cat.id}
                className="px-3 py-1 text-[10px] font-bold bg-(--color-myPrimary) text-white rounded-full uppercase tracking-wider"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{value}</p>
      </div>
    </div>
  )
}
