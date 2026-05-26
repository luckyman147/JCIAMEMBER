import { useState, useRef, useEffect } from 'react'
import { ChevronDown, CheckCircle } from 'lucide-react'
import { useSessions } from '../hooks/useTreasury'
import type { TreasurySession } from '../types'

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface SessionSelectorProps {
  selectedId: string
  onSelect: (session: TreasurySession) => void
}

export default function SessionSelector({ selectedId, onSelect }: SessionSelectorProps) {
  const { data: sessions, isLoading } = useSessions()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = sessions?.find((s) => s.id === selectedId)

  if (isLoading) {
    return <div className="h-10 w-60 bg-gray-100 rounded-lg animate-pulse" />
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-semibold text-gray-900 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-(--color-myPrimary) focus:border-transparent whitespace-nowrap"
      >
        {selected ? fmtDate(selected.start_date) : 'Select session'}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[320px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {sessions?.map((session) => {
            const isActive = session.status === 'active'
            const isSelected = session.id === selectedId
            return (
              <button
                key={session.id}
                onClick={() => { onSelect(session); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  isSelected ? 'bg-(--color-myPrimary)/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900">
                    {fmtDate(session.start_date)} — {fmtDate(session.end_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <CheckCircle className="w-4 h-4 text-(--color-myAccent)" />
                  )}
                </div>
              </button>
            )
          })}
          {(!sessions || sessions.length === 0) && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">No sessions</div>
          )}
        </div>
      )}
    </div>
  )
}
