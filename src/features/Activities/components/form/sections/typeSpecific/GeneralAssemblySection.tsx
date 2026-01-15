import type { UseFormRegister } from 'react-hook-form'
import { FormSection, FormSelect } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

interface GeneralAssemblySectionProps {
  register: UseFormRegister<ActivityFormValues>
}

export default function GeneralAssemblySection({ register }: GeneralAssemblySectionProps) {
  const { t } = useTranslation()

  return (
    <FormSection title={t('activities.generalAssemblyDetails')}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-start">
        <FormSelect
          id="assembly_type"
          label={t('activities.assemblyType')}
          options={[
            { value: 'local', label: t('activities.local') },
            { value: 'zonal', label: t('activities.zonal') },
            { value: 'national', label: t('activities.national') },
            { value: 'international', label: t('activities.international') },
          ]}
          register={register('assembly_type')}
        />
      </div>
    </FormSection>
  )
}
