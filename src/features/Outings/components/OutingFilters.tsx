import { useTranslation } from 'react-i18next'
import { Search, Calendar, ArrowUpDown, Filter } from 'lucide-react'
import { OUTING_CATEGORIES, type OutingFilters as Filters } from '../types/outing.types'

interface OutingFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function OutingFilters({ filters, onChange }: OutingFiltersProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full relative">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-5 h-5 text-gray-400`} />
        <input
          type="text"
          placeholder={t('outings.search')}
          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600`}
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label={t('outings.search')}
        />
      </div>
      <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div className="relative min-w-[140px]">
          <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-500`} />
          <select
            className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-lg appearance-none bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
            value={filters.category ?? 'all'}
            onChange={(e) => onChange({ ...filters, category: e.target.value as Filters['category'] })}
            aria-label={t('outings.category')}
          >
            <option value="all">{t('outings.filters.all')}</option>
            {OUTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{t(`outings.categories.${cat}`)}</option>
            ))}
          </select>
        </div>
        <div className="relative min-w-[140px]">
          <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-500`} />
          <select
            className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-lg appearance-none bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
            value={filters.dateFilter ?? 'all'}
            onChange={(e) => onChange({ ...filters, dateFilter: e.target.value as Filters['dateFilter'] })}
            aria-label={t('outings.filters.all')}
          >
            <option value="all">{t('outings.filters.all')}</option>
            <option value="upcoming">{t('outings.filters.upcoming')}</option>
            <option value="past">{t('outings.filters.past')}</option>
          </select>
        </div>
        <div className="relative min-w-[140px]">
          <ArrowUpDown className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-gray-500`} />
          <select
            className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border rounded-lg appearance-none bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
            value={filters.sortBy ?? 'newest'}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as Filters['sortBy'] })}
            aria-label={t('outings.sort.nearest')}
          >
            <option value="nearest">{t('outings.sort.nearest')}</option>
            <option value="newest">{t('outings.sort.newest')}</option>
            <option value="oldest">{t('outings.sort.oldest')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}
