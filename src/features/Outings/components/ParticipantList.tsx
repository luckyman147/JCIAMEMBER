import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import type { OutingMember } from '../types/outing.types'

interface ParticipantListProps {
  members: OutingMember[]
  maxParticipants: number
}

export default function ParticipantList({ members, maxParticipants }: ParticipantListProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('outings.participantList')}
        </h3>
        <span className="text-sm text-gray-500">
          {members.length} / {maxParticipants}
        </span>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            {member.profiles?.avatar_url ? (
              <img src={member.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-(--color-myPrimary)/10 flex items-center justify-center text-sm font-medium text-(--color-myPrimary)">
                {member.profiles?.fullname?.charAt(0) ?? '?'}
              </div>
            )}
            <span className="text-sm font-medium">{member.profiles?.fullname}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {t('outings.remainingPlaces')}: {Math.max(0, maxParticipants - members.length)}
      </p>
    </div>
  )
}
