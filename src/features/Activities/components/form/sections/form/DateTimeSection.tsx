import { Calendar } from 'lucide-react'
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormInput, FormSection } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'

interface DateTimeSectionProps {
  register: UseFormRegister<ActivityFormValues>
  errors: FieldErrors<ActivityFormValues>
  watch: UseFormWatch<ActivityFormValues>
  setValue: UseFormSetValue<ActivityFormValues>
}

export default function DateTimeSection({ register, errors, watch, setValue }: DateTimeSectionProps) {
  const { t } = useTranslation()
  const beginDate = watch('activity_begin_date')
  const endDate = watch('activity_end_date')

  // Helper to format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Effect to update end date when begin date changes
  useEffect(() => {
    if (!beginDate) return

    const start = new Date(beginDate)
    
    // Default logic: End date = Start date + 2 hours
    const suggestedEnd = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    
    // Only update if end date is empty OR end date is NOT later than start date
    // OR if we want it to always follow start date (user said "always plus 2 hours")
    // Actually user said: "WHEN CHANGING begin date change end date ALWAYS plus 2 hours"
    setValue('activity_end_date', formatDateForInput(suggestedEnd))
    
  }, [beginDate, setValue])

  // Validation: End date must be later than begin date
  useEffect(() => {
    if (!beginDate || !endDate) return

    const start = new Date(beginDate)
    const end = new Date(endDate)

    if (end <= start) {
        const fixedEnd = new Date(start.getTime() + 2 * 60 * 60 * 1000)
        setValue('activity_end_date', formatDateForInput(fixedEnd))
    }
  }, [endDate, beginDate, setValue])

  return (
    <FormSection title={t('activities.dateTime')}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-start">
        <FormInput
          id="activity_begin_date"
          label={`${t('activities.startDate')} *`}
          type="datetime-local"
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          register={register('activity_begin_date')}
          error={errors.activity_begin_date}
        />

        <FormInput
          id="activity_end_date"
          label={`${t('activities.endDate')} *`}
          type="datetime-local"
          icon={<Calendar className="h-5 w-5 text-gray-400" />}
          register={register('activity_end_date')}
          error={errors.activity_end_date}
        />
      </div>
    </FormSection>
  )
}
