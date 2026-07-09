import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Crown, Users, X, Handshake, Camera, ClipboardList, Package, Landmark, FileText, Star } from 'lucide-react'
import { activityService } from '../../../services/activityService'
import { COMMITTEES, COMMITTEE_LABELS, OFFICER_LABELS } from '../../../models/Committee'
import type { CommitteeName, CommitteeFormState, EventOfficers } from '../../../models/Committee'
import MemberSelectModal from '../../common/MemberSelectModal'

interface CommitteeSectionProps {
  committees: Record<CommitteeName, CommitteeFormState>
  onChange: (committees: Record<CommitteeName, CommitteeFormState>) => void
  officers: EventOfficers
  onOfficersChange: (officers: EventOfficers) => void
}

interface SimpleMember {
  id: string
  fullname: string
}

type ModalMode = 'chef' | 'members' | 'officer'

export default function CommitteeSection({ committees, onChange, officers, onOfficersChange }: CommitteeSectionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [modalCommittee, setModalCommittee] = useState<CommitteeName | null>(null)
  const [modalOfficerRole, setModalOfficerRole] = useState<'treasurer' | 'general_secretary' | 'event_chef' | null>(null)

  useEffect(() => {
    activityService.getMembers().then(setMembers).catch(() => {})
  }, [])

  const updateCommittee = (name: CommitteeName, update: Partial<CommitteeFormState>) => {
    onChange({
      ...committees,
      [name]: { ...committees[name], ...update },
    })
  }

  const openModal = (mode: ModalMode, committee: CommitteeName) => {
    setModalMode(mode)
    setModalCommittee(committee)
  }

  const closeModal = () => {
    setModalMode(null)
    setModalCommittee(null)
    setModalOfficerRole(null)
  }

  const getTakenChefIds = (): string[] => {
    return COMMITTEES.map(c => committees[c].chef_id).filter(Boolean) as string[]
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const committeeIcon = (name: string) => {
    switch (name) {
      case 'sponsoring': return <Handshake className="w-5 h-5 text-(--color-myPrimary)" />
      case 'media': return <Camera className="w-5 h-5 text-(--color-myPrimary)" />
      case 'program': return <ClipboardList className="w-5 h-5 text-(--color-myPrimary)" />
      case 'logistic': return <Package className="w-5 h-5 text-(--color-myPrimary)" />
      default: return null
    }
  }

  const currentCommittee = modalCommittee ? committees[modalCommittee] : null
  const chefDisabledIds = modalCommittee
    ? getTakenChefIds().filter(id => id !== committees[modalCommittee].chef_id)
    : []

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-lg font-bold text-gray-900">{t('activities.advanced', 'Advanced')}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {open && (
        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{t('activities.committeeManagement', 'Committee Management')}</h3>
            <p className="text-sm text-gray-500">{t('activities.committeeDescription', 'Assign event officers, chefs, and members to each committee. A project will be automatically created for this event.')}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">{t('activities.eventOfficers', 'Event Officers')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['event_chef', 'treasurer', 'general_secretary'] as const).map(role => (
                <div key={role} className="border border-gray-200 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    {role === 'event_chef' ? <Star className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> : role === 'treasurer' ? <Landmark className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> : <FileText className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />}
                    {OFFICER_LABELS[role]}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setModalMode('officer'); setModalOfficerRole(role) }}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white hover:border-gray-400 transition-colors"
                  >
                    {officers[`${role}_id`] ? (
                      <span className="font-medium text-gray-900">
                        {members.find(m => m.id === officers[`${role}_id`])?.fullname || 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t('activities.selectOfficer', 'Select...')}</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                  {officers[`${role}_id`] && (
                    <button
                      type="button"
                      onClick={() => onOfficersChange({ ...officers, [`${role}_id`]: null })}
                      className="mt-1 text-xs text-red-500 hover:text-red-700"
                    >
                      {t('activities.clear', 'Clear')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMITTEES.map(name => {
              const committee = committees[name]

              return (
                <div key={name} className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-(--color-myPrimary)/10 flex items-center justify-center shrink-0">
                      {committeeIcon(name)}
                    </div>
                    <h4 className="font-bold text-gray-900">{COMMITTEE_LABELS[name]}</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      <Crown className="w-3 h-3 inline mr-1 text-amber-500" />
                      {t('activities.chef', 'Chef')}
                    </label>
                    <button
                      type="button"
                      onClick={() => openModal('chef', name)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white hover:border-gray-400 transition-colors"
                    >
                      {committee.chef_id ? (
                        <span className="font-medium text-gray-900">
                          {members.find(m => m.id === committee.chef_id)?.fullname || 'Unknown'}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t('activities.selectChef', 'Select chef...')}</span>
                      )}
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      <Users className="w-3 h-3 inline mr-1" />
                      {t('activities.members', 'Members')}
                    </label>
                    <button
                      type="button"
                      onClick={() => openModal('members', name)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white hover:border-gray-400 transition-colors"
                    >
                      <span className={committee.member_ids.length > 0 ? 'font-medium text-gray-900' : 'text-gray-400'}>
                        {committee.member_ids.length > 0
                          ? `${committee.member_ids.length} ${t('activities.selected', 'selected')}`
                          : t('activities.selectMembers', 'Select members...')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {committee.member_ids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {committee.member_ids.map(mid => {
                          const m = members.find(x => x.id === mid)
                          if (!m) return null
                          return (
                            <span key={mid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-(--color-mySecondary) to-(--color-myPrimary) flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                {getInitials(m.fullname)}
                              </div>
                              <span className="max-w-[100px] truncate">{m.fullname}</span>
                              <button
                                type="button"
                                onClick={() => updateCommittee(name, { member_ids: committee.member_ids.filter(id => id !== mid) })}
                                className="hover:text-red-500 ml-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalMode === 'chef' && modalCommittee && currentCommittee && (
        <MemberSelectModal
          open={true}
          onClose={closeModal}
          members={members}
          selectedIds={currentCommittee.chef_id ? [currentCommittee.chef_id] : []}
          onSelect={(ids) => {
            updateCommittee(modalCommittee, { chef_id: ids[0] || null })
          }}
          disabledIds={chefDisabledIds}
          title={t('activities.selectChefFor', 'Select Chef for {{committee}}', { committee: COMMITTEE_LABELS[modalCommittee] })}
        />
      )}

      {modalMode === 'members' && modalCommittee && currentCommittee && (
        <MemberSelectModal
          open={true}
          onClose={closeModal}
          members={members}
          selectedIds={currentCommittee.member_ids}
          onSelect={(ids) => {
            updateCommittee(modalCommittee, { member_ids: ids })
          }}
          multiSelect
          title={t('activities.selectMembersFor', 'Select Members for {{committee}}', { committee: COMMITTEE_LABELS[modalCommittee] })}
        />
      )}

      {modalMode === 'officer' && modalOfficerRole && (
        <MemberSelectModal
          open={true}
          onClose={closeModal}
          members={members}
          selectedIds={officers[`${modalOfficerRole}_id`] ? [officers[`${modalOfficerRole}_id`]!] : []}
          onSelect={(ids) => {
            onOfficersChange({ ...officers, [`${modalOfficerRole}_id`]: ids[0] || null })
            closeModal()
          }}
          title={t('activities.selectOfficerFor', 'Select {{role}}', { role: OFFICER_LABELS[modalOfficerRole] })}
        />
      )}
    </div>
  )
}
