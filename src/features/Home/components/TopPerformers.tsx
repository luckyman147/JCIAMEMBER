import { useEffect, useState } from 'react'
import { getMembers } from '../../Members/services/members.service'
import type { Member } from '../../Members/types'
import { Trophy, Medal, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TopPerformers() {
  const { t } = useTranslation()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopPerformers()
  }, [])

  const loadTopPerformers = async () => {
    try {
      const allMembers = await getMembers()
      const sorted = allMembers
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 5)
      setMembers(sorted)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="animate-pulse h-64 bg-white rounded-xl shadow-sm border p-6" />
    )

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
          {t('home.topPerformers')}
        </h3>
      </div>

      {/* LIST */}
      <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="flex items-center gap-3 sm:gap-4"
          >
            {/* RANK */}
            <div className="w-6 sm:w-8 flex justify-center text-gray-400">
              {index === 0 ? (
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-current" />
              ) : index === 1 ? (
                <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              ) : index === 2 ? (
                <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              ) : (
                <span className="text-xs sm:text-sm">#{index + 1}</span>
              )}
            </div>

            {/* AVATAR */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 overflow-hidden border">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold text-gray-400 bg-gray-50">
                  {member.fullname.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {member.fullname}
              </p>
              <p className="hidden sm:block text-xs text-gray-500 truncate">
                {member.email}
              </p>
            </div>

            {/* POINTS */}
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded text-white font-bold text-xs" style={{ backgroundColor: 'var(--color-myPrimary)' }}>
                {member.points} {t('home.points')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
