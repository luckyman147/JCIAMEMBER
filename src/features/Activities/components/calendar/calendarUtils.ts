import type { Activity } from '../../models/Activity'

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function addWeeks(date: Date, amount: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + amount * 7)
  return d
}

export interface CalendarDay {
  date: Date
  key: string
  isToday: boolean
}

/** Builds the 7 days (Sunday-first) of the week containing `weekStart`. */
export function buildWeekDays(weekStart: Date): CalendarDay[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return { date: d, key: toDateKey(d), isToday: isSameDay(d, today) }
  })
}

export function groupActivitiesByDay(activities: Activity[]): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>()
  for (const activity of activities) {
    const key = toDateKey(new Date(activity.activity_begin_date))
    const list = map.get(key)
    if (list) {
      list.push(activity)
    } else {
      map.set(key, [activity])
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.activity_begin_date).getTime() - new Date(b.activity_begin_date).getTime())
  }
  return map
}

/** Activities that haven't started yet, soonest first. */
export function getUpcomingActivities(activities: Activity[], limit: number): Activity[] {
  const now = new Date()
  return [...activities]
    .filter((a) => new Date(a.activity_begin_date) >= now)
    .sort((a, b) => new Date(a.activity_begin_date).getTime() - new Date(b.activity_begin_date).getTime())
    .slice(0, limit)
}

/** Activities that already ended, most recently ended first — for "in case you missed it". */
export function getRecentActivities(activities: Activity[], limit: number): Activity[] {
  const now = new Date()
  return [...activities]
    .filter((a) => new Date(a.activity_end_date) < now)
    .sort((a, b) => new Date(b.activity_end_date).getTime() - new Date(a.activity_end_date).getTime())
    .slice(0, limit)
}
