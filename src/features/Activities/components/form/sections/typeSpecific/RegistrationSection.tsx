import type { UseFormRegister } from 'react-hook-form'
import { FormInput, FormSection } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

interface RegistrationSectionProps {
  register: UseFormRegister<ActivityFormValues>
}

export default function RegistrationSection({ register }: RegistrationSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.registration')}>
      <div className="text-start">
        <FormInput
          id="registration_deadline"
          label={t('activities.registrationDeadline')}
          type="datetime-local"
          register={register('registration_deadline')}
        />
      </div>
    </FormSection>
  )
}
