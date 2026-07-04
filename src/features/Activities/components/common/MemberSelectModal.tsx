import { useState, useEffect } from 'react'
import { Search, X, Check, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Member {
  id: string
  fullname: string
}

interface MemberSelectModalProps {
  open: boolean
  onClose: () => void
  members: Member[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  disabledIds?: string[]
  multiSelect?: boolean
  title: string
}

export default function MemberSelectModal({
  open,
  onClose,
  members,
  selectedIds,
  onSelect,
  disabledIds = [],
  multiSelect = false,
  title,
}: MemberSelectModalProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds)
      setSearch('')
    }
  }, [open, selectedIds])

  if (!open) return null

  const isRTL = i18n.dir() === 'rtl'
  const availableMembers = members.filter(m => !disabledIds.includes(m.id))

  const filtered = availableMembers.filter(m =>
    m.fullname.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const toggleMember = (id: string) => {
    if (multiSelect) {
      setLocalSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    } else {
      onSelect([id])
      onClose()
    }
  }

  const handleDone = () => {
    onSelect(localSelected)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('activities.searchMembers', 'Search members...')}
              autoFocus
              className={`w-full text-sm py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">{t('activities.noMembersFound', 'No members found')}</p>
              {search && <p className="text-xs mt-1">{t('activities.tryDifferentSearch', 'Try a different search')}</p>}
            </div>
          ) : (
            filtered.map((m, i) => {
              const isSelected = localSelected.includes(m.id)
              const isDisabled = disabledIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleMember(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                    ${i !== 0 ? 'mt-0.5' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0
                    ${isSelected
                      ? 'bg-gradient-to-br from-(--color-mySecondary) to-(--color-myPrimary)'
                      : 'bg-gradient-to-br from-(--color-mySecondary) to-(--color-myPrimary) opacity-80'}`}
                  >
                    {isSelected && !multiSelect ? <Check className="w-5 h-5" /> : getInitials(m.fullname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.fullname}</p>
                    <p className="text-xs text-gray-500">
                      {isSelected
                        ? (multiSelect ? t('activities.selected', 'Selected') : t('activities.selected', 'Selected'))
                        : t('activities.clickToSelect', 'Click to select')}
                    </p>
                  </div>
                  {multiSelect && (
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all
                      ${isSelected ? 'bg-(--color-myPrimary) border-(--color-myPrimary)' : 'border-gray-300'}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {multiSelect && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('profile.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="px-5 py-2 bg-(--color-myPrimary) text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
            >
              {t('activities.done', 'Done')} ({localSelected.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
