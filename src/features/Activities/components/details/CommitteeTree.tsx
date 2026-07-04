import { Crown, Users, ExternalLink, Handshake, Camera, ClipboardList, Package, ChevronDown, Landmark, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { COMMITTEE_LABELS, OFFICER_LABELS } from '../../models/Committee'
import type { ActivityCommittee } from '../../models/Committee'
import { useState } from 'react'

interface SimpleMember {
  id: string
  fullname: string
  avatar_url?: string
}

interface CommitteeTreeProps {
  committees: ActivityCommittee[]
  projectId?: string
  treasurerId?: string
  generalSecretaryId?: string
  members?: SimpleMember[]
}

export default function CommitteeTree({ committees, projectId, treasurerId, generalSecretaryId, members = [] }: CommitteeTreeProps) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)

  if (!committees || committees.length === 0) return null

  const sorted = [...committees].sort((a, b) => {
    const order = ['sponsoring', 'media', 'program', 'logistic']
    return order.indexOf(a.name) - order.indexOf(b.name)
  })

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const getAvatarUrl = (member?: { avatar_url?: string }) =>
    member?.avatar_url

  const committeeIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'sponsoring': return <Handshake className={`${className} text-(--color-myPrimary)`} />
      case 'media': return <Camera className={`${className} text-(--color-myPrimary)`} />
      case 'program': return <ClipboardList className={`${className} text-(--color-myPrimary)`} />
      case 'logistic': return <Package className={`${className} text-(--color-myPrimary)`} />
      default: return null
    }
  }

  const MemberAvatar = ({ member, size = 'sm' }: { member: { fullname: string; avatar_url?: string }; size?: 'sm' | 'xs' }) => {
    const dims = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-5 h-5 text-[8px]'
    return (
      <div className={`${dims} rounded-full bg-gradient-to-br from-(--color-mySecondary) to-(--color-myPrimary) flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
        {member.avatar_url ? (
          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          getInitials(member.fullname)
        )}
      </div>
    )
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-(--color-myPrimary)" />
          {t('activities.committees', 'Committees')}
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>

      {!collapsed && (
        <div className="space-y-6">
          {(treasurerId || generalSecretaryId) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['treasurer', 'general_secretary'] as const).map(role => {
                const officerId = role === 'treasurer' ? treasurerId : generalSecretaryId
                if (!officerId) return null
                const officer = members.find(m => m.id === officerId)
                if (!officer) return null
                const Icon = role === 'treasurer' ? Landmark : FileText
                return (
                  <div key={role} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-(--color-myPrimary)" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{OFFICER_LABELS[role]}</p>
                      <p className="text-sm font-semibold text-gray-900">{officer.fullname}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        <div className="relative pl-5 sm:pl-7">
          <div className="absolute left-[9px] sm:left-[13px] top-2 bottom-2 w-0.5 bg-(--color-myPrimary)/20 rounded-full" />

          {sorted.map((committee, ci) => {
            const isLastCommittee = ci === sorted.length - 1
            const members = committee.members?.filter(m => m.role !== 'lead') || []
            const chef = committee.chef

            return (
              <div key={committee.id} className="relative pb-5 last:pb-0">
                <div className={`absolute left-[-3px] sm:left-[-7px] top-3 w-[14px] sm:w-[18px] h-0.5 bg-(--color-myPrimary)/20 ${isLastCommittee ? 'rounded-bl' : ''}`} />
                {isLastCommittee && (
                  <div className="absolute left-0 top-3 w-0.5 bg-white z-10" style={{ height: 'calc(100% - 12px)' }} />
                )}

                <div className="ml-2 sm:ml-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0 border border-(--color-myPrimary)/20">
                      {committeeIcon(committee.name, 'w-5 h-5 sm:w-5 sm:h-5')}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                        {COMMITTEE_LABELS[committee.name as keyof typeof COMMITTEE_LABELS] || committee.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {chef ? `Chef: ${chef.member?.fullname}` : t('activities.notAssigned', 'Not assigned')}
                      </p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <div className="mt-2 ml-1 sm:ml-2 space-y-1.5">
                    {chef?.member && (
                      <div className="flex items-center gap-2 pl-2 sm:pl-3 py-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <MemberAvatar member={chef.member} size="sm" />
                        <span className="text-sm font-semibold text-gray-900">{chef.member.fullname}</span>
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">{t('activities.chef', 'Chef')}</span>
                      </div>
                    )}

                    {members.length > 0 && (
                      <div className="pl-2 sm:pl-3">
                        <div className="flex items-start gap-2 py-1">
                          <Users className="w-3.5 h-3.5 text-gray-400 mt-1 shrink-0" />
                          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                            {members.map(member => (
                              <div
                                key={member.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs font-medium text-gray-700 hover:border-(--color-myPrimary)/30 transition-colors"
                              >
                                <MemberAvatar member={member.member!} size="xs" />
                                <span className="truncate max-w-[100px] sm:max-w-[140px]">{member.member?.fullname}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {!chef && members.length === 0 && (
                      <div className="flex items-center gap-2 pl-2 sm:pl-3 py-1 text-sm text-gray-400 italic">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {t('activities.noMembers', 'No members')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {projectId && (
        <Link
          to={`/projects/${projectId}`}
          className="mt-4 sm:mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-myPrimary) hover:bg-(--color-myPrimary)/5 px-3 py-2 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t('activities.viewProject', 'View Project')}
        </Link>
      )}
    </section>
  )
}
