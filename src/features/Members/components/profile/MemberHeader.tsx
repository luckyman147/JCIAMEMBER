import { useState } from 'react'
import { Ban, Trash2 } from 'lucide-react'
import type { Member } from '../../types'
import EditMemberModal from '../common/EditMemberModal'
import { useAuth } from '../../../Authentication/auth.context'
import { ROLE_MANAGERS } from '../../../../utils/roles'

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
  const [isEditing, setIsEditing] = useState(false)
  /* LEFT: AVATAR + INFO */
  const { user, role } = useAuth()
  const isManager = ROLE_MANAGERS.includes(role?.toLowerCase() || '')

  // Allow edit if it's own profile OR if user has manager role
  const canEditProfile = (user && user.id === member.id) || isManager

  const isTopRank = rankPosition && ['1', '2', '3'].includes(rankPosition)

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      {/* LEFT: AVATAR + INFO */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="h-20 w-20 sm:h-32 sm:w-32 rounded-3xl bg-gray-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0">
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
        </div>

        {/* Text */}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {member.fullname}
          </h1>

          <div className="text-gray-500 text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 truncate">
            {member.email && <span className="truncate">{member.email}</span>}
            {member.phone && (
              <span className=" sm:inline">• {member.phone}</span>
            )}
          </div>

          {member.birth_date && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-500 text-xs">Birthday:</span>
              <span className="font-bold text-white bg-[var(--color-myAccent)] px-2 py-1 rounded-full text-xs">
                🎂{' '}
                {new Date(member.birth_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: ACTIONS + RANK */}
      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
        <div className="flex items-center gap-2">
          {canEditProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition"
              title="Edit Profile"
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
              </svg>            </button>
          )}

          {isManager && !canEditProfile && (
              <>
                <button
                    onClick={() => onUpdate && onUpdate({ is_banned: !member.is_banned })}
                    className={`p-2 rounded-full transition ${member.is_banned ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}
                    title={member.is_banned ? "Unban Member" : "Ban Member"}
                >
                    <Ban className="w-5 h-5" />
                </button>
                <button
                    onClick={() => {
                        if(window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
                            onDelete && onDelete();
                        }
                    }}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition"
                    title="Delete Member"
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
              {rankPosition === '1'
                ? 'st'
                : rankPosition === '2'
                ? 'nd'
                : rankPosition === '3'
                ? 'rd'
                : 'th'}
            </span>
          )}
        </div>

        <span className="text-xs text-gray-400 uppercase tracking-wider hidden md:block">
          Current Rank
        </span>
      </div>

      {/* EDIT MODAL */}
      {canEditProfile && isEditing && (
        <EditMemberModal
          member={member}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={onUpdate!}
        />
      )}
    </div>
  )
}
