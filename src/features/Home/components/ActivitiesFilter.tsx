import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FormInput, FormSelect } from '../../../components'
import { Filter, X, Calendar, Clock } from 'lucide-react'
import type { ActivityFilterDTO } from '../../Activities/dto/ActivityDTOs'
import { useTranslation } from 'react-i18next'

interface ActivitiesFilterProps {
  onFilterChange: (filters: ActivityFilterDTO) => void
}

// Internal form interface with split date/time
interface FilterFormValues extends Omit<ActivityFilterDTO, 'startDate' | 'endDate'> {
  startDateDate: string
  startDateTime: string
  endDateDate: string
  endDateTime: string
  // Keep original fields for type safety, but we won't bind them directly
  startDate?: string
  endDate?: string
}

export default function ActivitiesFilter({ onFilterChange }: ActivitiesFilterProps) {
  const { t } = useTranslation()
  const { register, watch, reset } = useForm<FilterFormValues>()
  const lastFiltersRef = useRef<string>('')
  
  // Watch all fields
  const filters = watch()

  // Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // 1. Combine Date and Time fields
      let finalStartDate = undefined
      if (filters.startDateDate) {
        finalStartDate = filters.startDateDate
        if (filters.startDateTime) {
          finalStartDate += `T${filters.startDateTime}`
        } else {
            finalStartDate += 'T00:00' // Default to start of day
        }
      }

      let finalEndDate = undefined
      if (filters.endDateDate) {
        finalEndDate = filters.endDateDate
        if (filters.endDateTime) {
          finalEndDate += `T${filters.endDateTime}`
        } else {
            finalEndDate += 'T23:59' // Default to end of day
        }
      }

      // 2. Prepare final DTO
      const cleanedFilters: ActivityFilterDTO = {
        type: filters.type || undefined,
        is_online: filters.is_online || undefined,
        is_paid: filters.is_paid || undefined,
        startDate: finalStartDate,
        endDate: finalEndDate
      }
      
      const filtersString = JSON.stringify(cleanedFilters)
      if (filtersString !== lastFiltersRef.current) {
        lastFiltersRef.current = filtersString
        onFilterChange(cleanedFilters)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters, onFilterChange])

  const handleReset = () => {
    reset({
      type: undefined,
      startDateDate: '',
      startDateTime: '',
      endDateDate: '',
      endDateTime: '',
      is_online: false,
      is_paid: false
    })
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          {t('home.filterTitle')}
        </h3>
        <button 
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('home.clearFilters')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FormSelect
          id="type"
          label={t('home.activityType')}
          options={[
            { value: '', label: t('home.allTypes') },
            { value: 'event', label: t('home.events') },
            { value: 'formation', label: t('home.formations') },
            { value: 'meeting', label: t('home.meetings') }
          ]}
          register={register('type')}
        />

        {/* Start Date Range */}
        <div className="space-y-2">
            <FormInput
                id="startDateDate"
                label={t('home.fromDate')}
                type="date"
                icon={<Calendar className="text-gray-400" size={16} />}
                register={register('startDateDate')}
            />
             <FormInput
                id="startDateTime"
                label={t('home.time')}
                type="time"
                icon={<Clock className="text-gray-400" size={16} />}
                register={register('startDateTime')}
            />
        </div>

        {/* End Date Range */}
        <div className="space-y-2">
            <FormInput
                id="endDateDate"
                label={t('home.toDate')}
                type="date"
                icon={<Calendar className="text-gray-400" size={16} />}
                register={register('endDateDate')}
            />
            <FormInput
                id="endDateTime"
                label={t('home.time')}
                type="time"
                icon={<Clock className="text-gray-400" size={16} />}
                register={register('endDateTime')}
            />
        </div>

        <div className="flex flex-col justify-end pb-2 gap-3">
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="is_online" 
                    {...register('is_online')} 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_online" className="text-sm text-gray-700">{t('home.onlineOnly')}</label>
            </div>
             <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="is_paid" 
                    {...register('is_paid')} 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_paid" className="text-sm text-gray-700">{t('home.paidActivities')}</label>
            </div>
        </div>
      </div>
    </div>
  )
}
