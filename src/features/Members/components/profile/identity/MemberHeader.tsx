import { useState } from 'react'
import { Ban, Trash2, Sparkles, CheckCircle2 } from 'lucide-react'
import type { Member } from '../../../types'
import EditMemberModal from '../../common/EditMemberModal'
import { useAuth } from '../../../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../../../utils/roles'
import { useTranslation } from 'react-i18next'

interface MemberHeaderProps {
  member: Member
  rankPosition?: string
  onUpdate?: (updates: Partial<Member>) => void
  onDelete?: () => void
}

export default function MemberHeader({
  member,
  rankPosition,
  onUpdate,
  onDelete
}: MemberHeaderProps) {
  const { t, i18n } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const { user, role } = useAuth()
  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  const currentLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  // Allow edit if it's own profile OR if user has executive role
  const canEditProfile = (user && user.id === member.id) || isExecutive

  const isTopRank = rankPosition && ['1', '2', '3'].includes(rankPosition)
  const isOwnProfile = user && user.id === member.id

  // Profile completion check
  const completenessChecks = [
    { label: t('profile.photo'), value: !!member.avatar_url },
    { label: t('profile.phone'), value: !!member.phone },
    { label: t('profile.birthday'), value: !!member.birth_date },
    { label: t('profile.bio'), value: !!member.description },
    { label: t('profile.strengths'), value: (member.strengths?.length || 0) > 0 },
    { label: t('profile.weaknesses'), value: (member.weaknesses?.length || 0) > 0 },
    { label: t('profile.jobTitle'), value: !!member.job_title },
    { label: t('profile.specialties'), value: (member.specialties?.length || 0) > 0 },
    { label: t('profile.availability'), value: (member.availability_days?.length || 0) > 0 },
    { label: t('profile.volunteeringLabel'), value: (member.estimated_volunteering_hours || 0) > 0 },
    { label: t('profile.socialMediaLabel'), value: !!member.preferred_social_media },
    { label: t('profile.engagementLabel'), value: !!member.preferred_committee || !!member.preferred_activity_type },
    { label: t('profile.lifestyleLabel'), value: !!member.astrological_sign || !!member.preferred_meal },
  ];

  const missingFields = completenessChecks.filter(c => !c.value).map(c => c.label);
  const completionPercentage = Math.round(((completenessChecks.length - missingFields.length) / completenessChecks.length) * 100);

  const getOrdinalSuffix = (pos: string) => {
    if (i18n.language !== 'en') return ''; // Simplified for non-English
    if (pos === '1') return 'st';
    if (pos === '2') return 'nd';
    if (pos === '3') return 'rd';
    return 'th';
  };

  return (
    <div className="flex flex-col gap-4">
      {isOwnProfile && missingFields.length > 0 && (
          <div className="relative overflow-hidden bg-white border border-blue-100 p-5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="absolute top-0 end-0 w-32 h-32 bg-blue-50/50 rounded-full -me-16 -mt-16 blur-3xl opacity-50" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                      <div className="bg-(--color-myAccent) p-2.5 rounded-xl text-white shadow-lg shadow-blue-100 flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900 uppercase tracking-wider">{t('profile.elevateProfile')}</p>
                            <span className="bg-(--color-myAccent) text-white px-2 py-0.5 rounded-full text-[10px] font-black border border-blue-100">
                                {completionPercentage}% {t('profile.complete')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium max-w-md italic">
                            {t('profile.professionalHelp')}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                             {missingFields.slice(0, 4).map(field => (
                               <span key={field} className="text-[15px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                 + {field}
                               </span>
                             ))}
                             {missingFields.length > 4 && (
                               <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                 & {missingFields.length - 4} {t('profile.more')}
                               </span>
                             )}
                          </div>
                      </div>
                  </div>
                  <button 
                    onClick={() => {
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                        setIsEditing(true);
                    }}
                    className="flex-shrink-0 bg-(--color-mySecondary) text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center gap-2"
                  >
                    {t('profile.finishProfile')}
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                    </div>
                  </button>
              </div>

              <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                  <div 
                    className="h-full bg-gradient-to-r from-(--color-mySecondary) to-(--color-myAccent) rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
              </div>
          </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-3xl bg-gray-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0 relative group">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.fullname}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl sm:text-5xl font-bold text-gray-400">
                {member.fullname.charAt(0)}
              </span>
            )}
            
            {isOwnProfile && !member.avatar_url && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsEditing(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate flex items-center gap-3">
              {member.fullname}
              {member.is_validated && <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50/50" />}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-2">
               <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 shadow-sm">
                  {member.role}
               </span>
               {member.poste && (
                 <span className="px-2 py-1 bg-(--color-mySecondary) text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                    {member.poste.name}
                 </span>
               )}
            </div>

            <div className="text-gray-500 text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
              {member.email && <span className="truncate">{member.email}</span>}
              {member.phone && (
                <span className="sm:inline">
                   {i18n.dir() === 'rtl' ? `• ${member.phone}` : `• ${member.phone}`}
                </span>
              )}
            </div>

            {member.birth_date && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-500 text-xs">{t('profile.birthday')}:</span>
                <span className="font-bold text-white bg-[var(--color-myAccent)] px-2 py-1 rounded-full text-xs">
                  🎂{' '}
                  {new Date(member.birth_date).toLocaleDateString(currentLocale, {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
          <div className="flex items-center gap-2">
            {canEditProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"
                title={t('profile.editProfile')}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-5 h-5'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'
                  />
                </svg>
              </button>
            )}

            {isExecutive && !isOwnProfile && (
                <>
                  <button
                      onClick={() => onUpdate && onUpdate({ is_banned: !member.is_banned })}
                      className={`p-2 rounded-full transition ${member.is_banned ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}
                      title={member.is_banned ? t('profile.unbanMember') : t('profile.banMember')}
                  >
                      <Ban className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => {
                          if(window.confirm(t('profile.deleteMemberConfirm'))) {
                              onDelete && onDelete();
                          }
                      }}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition"
                      title={t('profile.deleteMember')}
                  >
                      <Trash2 className="w-5 h-5" />
                  </button>
                </>
            )}

            {rankPosition && (
              <span
                className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  isTopRank
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {rankPosition}
                {getOrdinalSuffix(rankPosition)}
              </span>
            )}
          </div>

          <span className="text-xs text-gray-400 uppercase tracking-wider hidden md:block">
            {t('profile.currentRank')}
          </span>
        </div>

        {canEditProfile && isEditing && (
          <EditMemberModal
            member={member}
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            onSave={onUpdate!}
          />
        )}
      </div>
    </div>
  )
}
