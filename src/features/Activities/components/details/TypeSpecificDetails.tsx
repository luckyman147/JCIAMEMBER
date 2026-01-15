
import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Activity } from '../../models/Activity'

interface TypeSpecificDetailsProps {
  activity: Activity
}

export default function TypeSpecificDetails({ activity }: TypeSpecificDetailsProps) {
  const { t } = useTranslation()

  if (activity.type === 'formation' && activity.trainer_name) {
    return (
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.trainer')}</h2>
        <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold shadow-sm">
              {activity.trainer_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{activity.trainer_name}</p>
              <p className="text-sm text-gray-500 font-medium">{t('activities.courseTrainer')}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (activity.type === 'general_assembly' && activity.assembly_type) {
    return (
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.generalAssemblyDetails')}</h2>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{t('activities.assemblyType')}</p>
              <p className="text-sm text-gray-700 font-semibold">{t(`activities.${activity.assembly_type}`)}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return null
}
