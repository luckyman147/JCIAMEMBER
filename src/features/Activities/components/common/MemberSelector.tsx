import { Search, X, User, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Member {
  id: string
  fullname: string
}

interface MemberSelectorProps {
  members: Member[]
  selectedMemberIds: string[]
  memberSearch: string
  onSearchChange: (value: string) => void
  onToggleMember: (id: string) => void
  onClearSelection: () => void
  excludeIds?: string[]
}

export default function MemberSelector({
  members,
  selectedMemberIds,
  memberSearch,
  onSearchChange,
  onToggleMember,
  onClearSelection,
  excludeIds = []
}: MemberSelectorProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const availableMembers = members.filter(m => !excludeIds.includes(m.id))
  const filteredMembers = availableMembers.filter(m => 
    m.fullname.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{t('activities.selectMembers')}</label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10`} />
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('activities.search')}
          className={`w-full rounded-xl shadow-sm text-sm py-3 ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 focus:outline-none`}
        />
        {selectedMemberIds.length > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Members Chips */}
      {selectedMemberIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedMemberIds.map(id => {
            const m = members.find(member => member.id === id)
            if (!m) return null
            return (
              <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-white text-(--color-myPrimary) rounded-full border border-blue-100 text-xs font-bold animate-in fade-in zoom-in duration-200">
                <span>{m.fullname}</span>
                <button type="button" onClick={() => onToggleMember(id)} className="hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Dropdown List */}
      <div 
        className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
        style={{ maxHeight: '240px' }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
          {filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t('activities.noMembersFound')}</p>
              {memberSearch && <p className="text-xs mt-1">{t('activities.tryDifferentSearch')}</p>}
            </div>
          ) : (
            filteredMembers.map((m, index) => {
              const isSelected = selectedMemberIds.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onToggleMember(m.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-all duration-150 ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-linear-to-r hover:from-yellow-50 hover:to-transparent'
                  } ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all duration-300 ${
                    isSelected ? 'bg-linear-to-br from-(--color-mySecondary) to-(--color-myPrimary)' : 'bg-linear-to-br from-(--color-mySecondary) to-(--color-myPrimary)'
                  }`}>
                    {isSelected ? <Check className="w-5 h-5" /> : getInitials(m.fullname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.fullname}</p>
                    <p className="text-xs text-gray-500">
                      {isSelected ? t('activities.selected') : t('activities.clickToSelect')}
                    </p>
                  </div>
                  <div className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'bg-(--color-myPrimary) border-(--color-myPrimary)  shadow-(--color-myPrimary)' : 'border-gray-200'
                  }`}>
                    <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
