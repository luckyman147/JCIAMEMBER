import type { ActivityType } from '../models/Activity'

export const ACTIVITY_TYPE_BADGE_CLASS: Record<ActivityType, string> = {
  event: 'bg-(--color-myPrimary) text-white',
  meeting: 'bg-blue-100 text-blue-800',
  formation: 'bg-orange-100 text-orange-800',
  general_assembly: 'bg-purple-100 text-purple-800',
}

export const ACTIVITY_TYPE_DOT_CLASS: Record<ActivityType, string> = {
  event: 'bg-(--color-myPrimary)',
  meeting: 'bg-blue-500',
  formation: 'bg-orange-500',
  general_assembly: 'bg-purple-500',
}

export function getActivityTypeBadgeClass(type: ActivityType): string {
  return ACTIVITY_TYPE_BADGE_CLASS[type] ?? 'bg-gray-100 text-gray-800'
}

export function getActivityTypeDotClass(type: ActivityType): string {
  return ACTIVITY_TYPE_DOT_CLASS[type] ?? 'bg-gray-400'
}
