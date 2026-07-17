import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import type { OutingFormValues } from '../schemas/outing.schema'
import { OUTING_CATEGORIES } from '../types/outing.types'
import { FormInput, FormSection, FormSelect } from '../../../components'
import ImageUploader from './ImageUploader'
import LocationPicker from './LocationPicker'

interface OutingFormProps {
  form: UseFormReturn<OutingFormValues>
  onSubmit: (data: OutingFormValues) => void
  isEditMode?: boolean
  isLoading?: boolean
  onCancel: () => void
}

export default function OutingForm({ form, onSubmit, isEditMode, isLoading, onCancel }: OutingFormProps) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors }, setValue, watch } = form
  const [, setCoverFile] = useState<File | null>(null)
  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const address = watch('address')
  const coverImage = watch('cover_image')
  const startTime = watch('start_time')

  useEffect(() => {
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number)
      const end = new Date()
      end.setHours(h + 2, m)
      const hh = String(end.getHours()).padStart(2, '0')
      const mm = String(end.getMinutes()).padStart(2, '0')
      setValue('end_time', `${hh}:${mm}`)
    }
  }, [startTime, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title={isEditMode ? t('outings.editTitle') : t('outings.createTitle')}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2">
            <FormInput
              id="title"
              label={`${t('outings.title')} *`}
              placeholder={t('outings.title')}
              register={register('title')}
              error={errors.title}
            />
          </div>
          <div className="col-span-2">
            <FormInput
              id="description"
              label={`${t('outings.description')} *`}
              placeholder={t('outings.description')}
              register={register('description')}
              isTextarea
              error={errors.description}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormSelect
              id="category"
              label={`${t('outings.category')} *`}
              options={OUTING_CATEGORIES.map((cat) => ({
                value: cat,
                label: t(`outings.categories.${cat}`),
              }))}
              register={register('category')}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormInput
              id="date"
              label={`${t('outings.date')} *`}
              type="date"
              register={register('date')}
              error={errors.date}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormInput
              id="start_time"
              label={`${t('outings.startTime')} *`}
              type="time"
              register={register('start_time')}
              error={errors.start_time}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormInput
              id="end_time"
              label={`${t('outings.endTime')} *`}
              type="time"
              register={register('end_time')}
              error={errors.end_time}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <FormInput
              id="max_participants"
              label={`${t('outings.maxParticipants')} *`}
              type="number"
              register={register('max_participants')}
              error={errors.max_participants}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title={t('outings.location')}>
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          address={address}
          onLocationChange={(lat, lng, addr) => {
            setValue('latitude', lat)
            setValue('longitude', lng)
            setValue('address', addr)
          }}
        />
        {errors.latitude && <p className="text-red-500 text-sm mt-1">{t('outings.validation.required')}</p>}
      </FormSection>

      <FormSection title={t('outings.coverImage')}>
        <ImageUploader
          value={coverImage}
          onChange={(url) => setValue('cover_image', url ?? '')}
          onFileSelect={setCoverFile}
        />
      </FormSection>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          {t('outings.buttons.cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-lg bg-(--color-myPrimary) text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {isLoading ? t('outings.skeleton') : (isEditMode ? t('outings.edit') : t('outings.create'))}
        </button>
      </div>
    </form>
  )
}