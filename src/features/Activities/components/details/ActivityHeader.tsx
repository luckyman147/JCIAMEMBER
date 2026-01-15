
import { Link } from 'react-router-dom'
import { Edit, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Activity } from '../../models/Activity'

interface ActivityHeaderProps {
  activity: Activity
  isExecutive: boolean
  onDelete: () => void
}

export default function ActivityHeader({ activity, isExecutive, onDelete }: ActivityHeaderProps) {
  const { t, i18n } = useTranslation()
  
  return (
    <div className="relative h-64 md:h-80 w-full bg-gray-200">
      <img
        src={activity.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'}
        alt={activity.name}
        className="w-full h-full object-cover"
      />
      {isExecutive && (
        <div className={`absolute top-4 ${i18n.dir() === 'rtl' ? 'left-4' : 'right-4'} flex gap-2`}>
          <Link
            to={`/activities/${activity.id}/edit`} 
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-blue-600 hover:text-blue-700 shadow-sm transition-transform hover:scale-105"
            title={t('activities.editActivity')}
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={onDelete}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-600 hover:text-red-700 shadow-sm transition-transform hover:scale-105"
            title={t('activities.deleteActivity')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-6 md:p-8 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full">
            {t(`profile.${activity.type}`)}
          </span>
          {activity.type === 'formation' && activity.training_type && (
            <span className="inline-block px-3 py-1 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
              {t(`activities.${activity.training_type === 'official_session' ? 'officialSession' : 
                          activity.training_type === 'important_training' ? 'importantTraining' :
                          activity.training_type === 'just_training' ? 'justTraining' : 'memberToMemberTraining'}`)}
            </span>
          )}
          {activity.type === 'meeting' && activity.meeting_type && (
            <span className="inline-block px-3 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
              {t(`activities.meetingType${activity.meeting_type.charAt(0).toUpperCase() + activity.meeting_type.slice(1)}`)}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">{activity.name}</h1>
      </div>
    </div>
  )
}
