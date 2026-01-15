import { Calendar, MapPin, Video, DollarSign, ArrowRight, Users } from 'lucide-react'
import type { Activity } from '../../models/Activity'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface ActivityCardProps {
  activity: Activity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const { t, i18n } = useTranslation()

  const startDate = new Date(activity.activity_begin_date)
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-(--color-myPrimary)  text-white'
      case 'meeting': return 'bg-blue-100 text-blue-800'
      case 'formation': return 'bg-orange-100 text-orange-800'
      case 'general_assembly': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlaceholderImage = (type: string) => {
    switch (type) {
        case 'event': return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'
        case 'meeting': return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1000'
        case 'formation': return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000'
        case 'general_assembly': return 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=1000'
        default: return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'
    }
}

  const participantCount = activity.activity_participants?.[0]?.count || 0;

  return (
    <Link 
      to={`/activities/${activity.id}/GET`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-gray-100 group"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={activity.image_url || getPlaceholderImage(activity.type)}
          alt={activity.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-4 ${i18n.dir() === 'rtl' ? 'left-4' : 'right-4'} flex flex-col gap-2 items-end`}>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getTypeColor(activity.type)}`}>
            {activity.type === 'general_assembly' && (activity as any).assembly_type
              ? `${t('activities.generalAssembly')} - ${t(`activities.${(activity as any).assembly_type}`)}`
              : t(`profile.${activity.type}`)}
          </span>
          {new Date(activity.activity_end_date) < new Date() && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500 text-white shadow-sm animate-pulse">
              {t('activities.expired')}
            </span>
          )}
        </div>
        {activity.is_paid && (
             <div className={`absolute top-4 ${i18n.dir() === 'rtl' ? 'right-4' : 'left-4'}`}>
             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
               <DollarSign className="w-3 h-3" />
               {activity.is_paid && activity.price! > 0 ? `${activity.price} DT` : t('activities.paid')}
             </span>
           </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 transition-colors group-hover:text-(--color-myPrimary)" title={activity.name}>
          {activity.name}
        </h3>
        
        <div className="space-y-3 mb-6 flex-1 text-start">
          <p className="text-gray-600 text-sm line-clamp-3">
            {activity.description || t('activities.noDescription')}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{formatDate(startDate)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{participantCount}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500 gap-2">
            {activity.is_online ? (
              <Video className="w-4 h-4 text-green-500" />
            ) : (
              <MapPin className="w-4 h-4 text-red-500" />
            )}
            <span className="truncate">
              {activity.is_online ? t('activities.onlineEvent') : (activity.activity_address || t('activities.locationTBD'))}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="text-sm font-medium text-gray-500">
               {activity.activity_points > 0 ? t('activities.points', { count: activity.activity_points }) : ''}
             </div>
           </div>
           
           <div 
             className="inline-flex items-center gap-1 text-(--color-myPrimary) group-hover:text-(--color-myPrimary) font-semibold text-sm transition-colors"
           >
             {t('activities.viewDetails')} <ArrowRight className={`w-4 h-4 transition-transform ${i18n.dir() === 'rtl' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
           </div>
        </div>
      </div>
    </Link>
  )
}
