
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import {  Type } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { FormInput, FormSection, FormSelect } from '../../../../../../components'

interface BasicInfoSectionProps {
  register: UseFormRegister<ActivityFormValues>
  errors: FieldErrors<ActivityFormValues>
  isEditMode?: boolean
}

export default function BasicInfoSection({ register, errors, isEditMode = false }: BasicInfoSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.basicInfo')}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-start">
        <div className="col-span-2">
          <FormInput
            id="name"
            label={`${t('activities.name')} *`}
            placeholder={t('activities.namePlaceholder')}
            register={register('name')}
            error={errors.name}
          />
        </div>

        <div className="col-span-2">
          <FormInput
            id="description"
            label={t('activities.descriptionOptional')}
            placeholder={t('activities.descriptionPlaceholder')}
            register={register('description')}
            isTextarea
          />
        </div>

        <FormSelect
          id="type"
          label={isEditMode ? t('activities.typeFixed') : `${t('activities.type')} *`}
          icon={<Type className="h-5 w-5 text-gray-400" />}
          options={[
            { value: 'event', label: t('activities.events') },
            { value: 'formation', label: t('activities.formations') },
            { value: 'meeting', label: t('activities.meetings') },
            { value: 'general_assembly', label: t('activities.generalAssembly') }
          ]}
          register={register('type')}
          disabled={isEditMode}
        />

        <FormInput
          id="activity_points"
          label={`${t('activities.points')} *`}
          type="number"
          register={register('activity_points')}
          error={errors.activity_points}
        />
      </div>
    </FormSection>
  )
}

