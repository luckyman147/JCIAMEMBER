import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Video, X, ArrowRight, Camera } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { Activity } from '../../models/Activity'
import { getActivityTypeDotClass } from '../../utils/activityTypeStyles'
import {
  addWeeks,
  buildWeekDays,
  getRecentActivities,
  getUpcomingActivities,
  groupActivitiesByDay,
  startOfWeek,
  toDateKey,
  type CalendarDay,
} from './calendarUtils'

interface ActivityCalendarProps {
  activities: Activity[]
  loading?: boolean
  /** Shows a "view all activities" link under the agenda list (for the Home widget). */
  linkToAllActivities?: boolean
  className?: string
}

const AGENDA_LIMIT = 5

export default function ActivityCalendar({ activities, loading, linkToAllActivities = false, className }: ActivityCalendarProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const today = useMemo(() => new Date(), [])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [focusedKey, setFocusedKey] = useState(() => toDateKey(today))
  const [tab, setTab] = useState<'upcoming' | 'recent'>('upcoming')

  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart])
  const byDay = useMemo(() => groupActivitiesByDay(activities), [activities])
  const upcoming = useMemo(() => getUpcomingActivities(activities, AGENDA_LIMIT), [activities])
  const recent = useMemo(() => getRecentActivities(activities, AGENDA_LIMIT), [activities])

  const weekRangeLabel = useMemo(() => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    const sameMonth = weekStart.getMonth() === end.getMonth()
    const startFmt = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' })
    const endFmt = new Intl.DateTimeFormat(i18n.language, sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startFmt.format(weekStart)} – ${endFmt.format(end)}`
  }, [weekStart, i18n.language])

  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: 'numeric' }), [i18n.language])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }), [i18n.language])
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }), [i18n.language])

  const selectedDayLabel = useMemo(() => {
    if (!selectedDateKey) return null
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(y, m - 1, d))
  }, [selectedDateKey, i18n.language])

  const registerDayRef = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) dayRefs.current.set(key, el)
    else dayRefs.current.delete(key)
  }

  const focusDaySoon = (key: string) => {
    requestAnimationFrame(() => dayRefs.current.get(key)?.focus())
  }

  const handleSelectDay = (day: CalendarDay) => {
    setSelectedDateKey((prev) => (prev === day.key ? null : day.key))
    setFocusedKey(day.key)
  }

  const handleThisWeek = () => {
    setWeekStart(startOfWeek(today))
    const key = toDateKey(today)
    setFocusedKey(key)
    focusDaySoon(key)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, day: CalendarDay) => {
    let delta = 0
    switch (event.key) {
      case 'ArrowLeft':
        delta = isRTL ? 1 : -1
        break
      case 'ArrowRight':
        delta = isRTL ? -1 : 1
        break
      case 'Home':
        delta = -day.date.getDay()
        break
      case 'End':
        delta = 6 - day.date.getDay()
        break
      case 'PageUp':
        event.preventDefault()
        setWeekStart((w) => addWeeks(w, -1))
        return
      case 'PageDown':
        event.preventDefault()
        setWeekStart((w) => addWeeks(w, 1))
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        handleSelectDay(day)
        return
      default:
        return
    }
    event.preventDefault()
    const newDate = new Date(day.date)
    newDate.setDate(newDate.getDate() + delta)
    const newKey = toDateKey(newDate)
    const newWeekStart = startOfWeek(newDate)
    if (toDateKey(newWeekStart) !== toDateKey(weekStart)) {
      setWeekStart(newWeekStart)
    }
    setFocusedKey(newKey)
    focusDaySoon(newKey)
  }

  const selectedDayActivities = selectedDateKey ? byDay.get(selectedDateKey) ?? [] : []
  const agendaList = selectedDateKey ? selectedDayActivities : tab === 'upcoming' ? upcoming : recent
  const agendaEmptyMessage = selectedDateKey
    ? t('activities.noActivitiesOnDay')
    : tab === 'upcoming'
      ? t('activities.noUpcomingActivities')
      : t('activities.noRecentActivities')

  if (loading) {
    return <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse h-80 p-4', className)} />
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-100 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">{t('activities.activityCalendar')}</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t('activities.previousWeek')}
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-myPrimary)"
          >
            <ChevronLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          </button>
          <span className="text-xs font-semibold text-gray-600 min-w-32 text-center">{weekRangeLabel}</span>
          <button
            type="button"
            aria-label={t('activities.nextWeek')}
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-myPrimary)"
          >
            <ChevronRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          </button>
          <button type="button" onClick={handleThisWeek} className="ms-1 text-xs font-semibold text-(--color-myPrimary) hover:underline px-1.5 py-1">
            {t('activities.thisWeek')}
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1.5 mb-4" role="row">
        {weekDays.map((day) => {
          const dayActivities = byDay.get(day.key) ?? []
          const isSelected = day.key === selectedDateKey
          return (
            <button
              key={day.key}
              ref={registerDayRef(day.key)}
              type="button"
              role="gridcell"
              tabIndex={day.key === focusedKey ? 0 : -1}
              aria-selected={isSelected}
              aria-current={day.isToday ? 'date' : undefined}
              aria-label={`${day.date.toDateString()}${dayActivities.length ? `, ${dayActivities.length}` : ''}`}
              onClick={() => handleSelectDay(day)}
              onFocus={() => setFocusedKey(day.key)}
              onKeyDown={(e) => handleKeyDown(e, day)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border py-1.5 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-myPrimary) focus-visible:ring-offset-1',
                isSelected
                  ? 'bg-(--color-myPrimary) border-(--color-myPrimary) text-white'
                  : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/60',
                day.isToday && !isSelected && 'border-(--color-myPrimary) border-2'
              )}
            >
              <span className={cn('text-[10px] font-semibold uppercase tracking-wide', isSelected ? 'text-white/80' : 'text-gray-400')}>
                {weekdayFormatter.format(day.date)}
              </span>
              <span className={cn('text-sm font-bold', day.isToday && !isSelected && 'text-(--color-myPrimary)')}>{day.date.getDate()}</span>
              <span className="flex items-center gap-0.5 h-1.5">
                {dayActivities.slice(0, 3).map((a) => (
                  <span key={a.id} className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : getActivityTypeDotClass(a.type))} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      {/* Agenda */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          {selectedDateKey ? (
            <>
              <h4 className="text-sm font-bold text-gray-900 capitalize line-clamp-1">{selectedDayLabel}</h4>
              <button type="button" onClick={() => setSelectedDateKey(null)} aria-label={t('activities.clearFilters')} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTab('upcoming')}
                aria-pressed={tab === 'upcoming'}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                  tab === 'upcoming' ? 'bg-white text-(--color-myPrimary) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t('activities.upcoming')}
              </button>
              <button
                type="button"
                onClick={() => setTab('recent')}
                aria-pressed={tab === 'recent'}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                  tab === 'recent' ? 'bg-white text-(--color-myPrimary) shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t('activities.recent')}
              </button>
            </div>
          )}
        </div>

        {agendaList.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{agendaEmptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {agendaList.map((activity) => {
              const hasRecap = (activity.recap_images?.length ?? 0) > 0 || (activity.recap_videos?.length ?? 0) > 0
              return (
                <li key={activity.id}>
                  <Link
                    to={`/activities/${activity.id}/GET`}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                  >
                    <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', getActivityTypeDotClass(activity.type))} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-(--color-myPrimary) transition-colors">{activity.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <span className="shrink-0">
                          {selectedDateKey ? timeFormatter.format(new Date(activity.activity_begin_date)) : dateFormatter.format(new Date(activity.activity_begin_date))}
                        </span>
                        <span aria-hidden="true">·</span>
                        {activity.is_online ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{activity.is_online ? t('activities.onlineEvent') : activity.activity_address || t('activities.locationTBD')}</span>
                      </div>
                    </div>
                    {tab === 'recent' && !selectedDateKey && hasRecap && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-(--color-myAccent) shrink-0 mt-0.5" title={t('activities.recapPhotos')}>
                        <Camera className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {linkToAllActivities && (
          <Link
            to="/activities"
            className="mt-3 w-full py-2 flex items-center justify-center gap-1 text-sm font-medium text-(--color-myPrimary) bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {t('home.viewAll')}
            <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          </Link>
        )}
      </div>
    </div>
  )
}
