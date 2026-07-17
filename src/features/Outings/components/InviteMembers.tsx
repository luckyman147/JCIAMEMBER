import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, UserPlus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import supabase from '../../../utils/supabase'

interface InviteMembersProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function InviteMembers({ selectedIds, onChange }: InviteMembersProps) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const isRTL = i18n.dir() === 'rtl'

  const { data: members = [] } = useQuery({
    queryKey: ['members', 'list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, fullname, avatar_url')
        .order('fullname')
      return data ?? []
    },
  })

  const filtered = members.filter((m: any) =>
    m.fullname?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{t('outings.inviteMembers')}</label>
      <div className="relative mb-3">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-400`} />
        <input
          type="text"
          placeholder={t('outings.searchMembers')}
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 text-sm`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedIds.map((id) => {
            const m = members.find((x: any) => x.id === id) as any
            return (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-(--color-myPrimary)/10 text-(--color-myPrimary) rounded-full text-xs">
                {m?.fullname ?? id.slice(0, 8)}
                <button onClick={() => toggle(id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )
          })}
        </div>
      )}
      <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-1 dark:border-gray-700">
        {filtered.map((m: any) => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              selectedIds.includes(m.id)
                ? 'bg-(--color-myPrimary)/10 text-(--color-myPrimary)'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                {m.fullname?.charAt(0) ?? '?'}
              </div>
            )}
            <span className="flex-1 truncate">{m.fullname}</span>
            {selectedIds.includes(m.id) && <UserPlus className="w-3 h-3 shrink-0" />}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">{t('outings.noMembersFound')}</p>
        )}
      </div>
    </div>
  )
}
