
import {  MapPin } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FormCheckbox, FormInput, FormSection } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

interface LocationSectionProps {
  register: UseFormRegister<ActivityFormValues>
  errors: FieldErrors<ActivityFormValues>
  isOnline: boolean
}

export default function LocationSection({ register, errors, isOnline }: LocationSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.locationDetails')}>
      <div className="space-y-4 text-start">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <FormCheckbox
            id="is_online"
            label={t('activities.isOnline')}
            register={register('is_online')}
          />
          <FormCheckbox
            id="is_public"
            label={t('activities.isPublic')}
            register={register('is_public')}
          />
        </div>

          {isOnline && (
            <FormInput
            id="online_link"
            label={t('activities.onlineLinkLabel')}
            type="url"
            placeholder={t('activities.onlineLinkPlaceholder')}
            register={register('online_link')}
            error={errors.online_link}
          />
        )}

        {!isOnline && (
          <FormInput
            id="activity_address"
            label={`${t('activities.address')} *`}
            placeholder={t('activities.addressPlaceholder')}
            icon={<MapPin className="h-5 w-5 text-gray-400" />}
            register={register('activity_address')}
            error={errors.activity_address}
          />
        )}
      </div>
    </FormSection>
  )
}
