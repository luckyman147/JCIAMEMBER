import { useState, useEffect, } from 'react'
import type { Member, Poste } from '../../types'
import { uploadAvatarImage } from '../../../../utils/uploadHelpers'
import { useFileUpload } from '../../../Activities/hooks/useFileUpload'
import { getRoles, getPostesByRole } from '../../services/members.service'
import MemberAvatarImage from '../profile/identity/MemberAvatarImage'
import { useAuth } from '../../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../../utils/roles'
import { useTranslation } from "react-i18next";

interface EditMemberModalProps {
  member: Member
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<Member>) => void
}

export default function EditMemberModal({
  member,
  isOpen,
  onClose,
  onSave
}: EditMemberModalProps) {
  const { t } = useTranslation();
  const { role: currentUserRole, user } = useAuth()
  const canEditExclusive = EXECUTIVE_LEVELS.includes(currentUserRole?.toLowerCase() || '')
  
  // Determine if the user is editing their own profile
  const isOwnProfile = user?.id === member.id;

  const avatarImage = useFileUpload()
  // --- State Initialization ---
  const [fullname, setFullname] = useState(member.fullname)
  const [phone, setPhone] = useState(member.phone || '')
  const [birthday, setBirthday] = useState(member.birth_date|| '')
  const [role, setRole] = useState(member.role)
  const [posteId, setPosteId] = useState(member.poste_id || '')
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [availablePostes, setAvailablePostes] = useState<Poste[]>([])
  const [loading, setLoading] = useState(false)

  // Reset state when the modal opens or the member changes
  useEffect(() => {
    if (isOpen) {
      setFullname(member.fullname)
      setPhone(member.phone || '')
      // Format birth_date to YYYY-MM-DD for the date input
      const formattedDate = member.birth_date ? member.birth_date.split('T')[0] : ''
      setBirthday(formattedDate)
      setRole(member.role)
      setPosteId(member.poste_id || '')
      avatarImage.setUrls(member.avatar_url ? [member.avatar_url] : [])
    }
  }, [member, isOpen])

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      getRoles().then(setAvailableRoles)
    }
  }, [isOpen])

  // Fetch postes when role changes
  useEffect(() => {
    if (isOpen && role) {
      getPostesByRole(role).then(setAvailablePostes)
    } else {
      setAvailablePostes([])
    }
  }, [role, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let imageUrl: string | null = null

    try {
      const updates: Partial<Member> = {};

      if (isOwnProfile || canEditExclusive) {
          if (avatarImage.file && avatarImage.file.length > 0) {
               const result = await uploadAvatarImage(avatarImage.file[0])
               if (!result.success || !result.url) {
                 throw new Error(result.error || 'Failed to upload image')
               }
               imageUrl = result.url
          }

          updates.fullname = fullname;
          updates.phone = phone;
          updates.birth_date = birthday;
          updates.avatar_url = imageUrl || member.avatar_url;
      }

      if (canEditExclusive) {
        updates.role = role
        updates.poste_id = posteId || undefined
      }

      await onSave(updates)
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
        <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                {isOwnProfile ? t('profile.editYourProfile') : t('profile.editMemberProfile')}
              </h2>
              {!isOwnProfile && !canEditExclusive && (
                  <p className="text-sm text-gray-500">{t('profile.noEditPermission')}</p>
              )}
            </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 font-bold text-xl'
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {(isOwnProfile || canEditExclusive) && (
             <MemberAvatarImage fileUpload={avatarImage} />
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t('auth.fullname')}
            </label>

            <input
              type='text'
              required
              disabled={!isOwnProfile && !canEditExclusive}
              className={`w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary) ${(!isOwnProfile && !canEditExclusive) ? 'bg-gray-100 text-gray-500' : ''}`}
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t('auth.phone')}
            </label>

            <input
              type='tel'
              disabled={!isOwnProfile && !canEditExclusive}
              className={`w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary) ${(!isOwnProfile && !canEditExclusive) ? 'bg-gray-100 text-gray-500' : ''}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t('auth.birthday')}
            </label>
            <input
              type='date'
              disabled={!isOwnProfile && !canEditExclusive}
              className={`w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary) ${(!isOwnProfile && !canEditExclusive) ? 'bg-gray-100 text-gray-500' : ''}`}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {canEditExclusive && (
            <div className="space-y-4">
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t('profile.role')}
                </label>

                <select
                  className='w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary)'
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPosteId(''); // Reset poste when role changes
                  }}
                >
                  {availableRoles.length === 0 && (
                    <option value={role}>{role}</option>
                  )}

                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {availablePostes.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {t('profile.poste', 'Poste Specific')}
                  </label>
                  <select
                    className='w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary)'
                    value={posteId}
                    onChange={(e) => setPosteId(e.target.value)}
                  >
                    <option value="">{t('common.select', 'Select Poste')}</option>
                    {availablePostes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          
          <div className='flex justify-end gap-3 pt-4 border-t border-gray-100'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border rounded-md transition-colors'
            >
              {t('common.cancel')}
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 text-sm font-medium text-white bg-(--color-myPrimary) rounded-md disabled:opacity-50 transition-colors'
            >
              {loading ? t('profile.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
