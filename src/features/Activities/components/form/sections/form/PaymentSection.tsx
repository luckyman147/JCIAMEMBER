

import { DollarSign } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FormSection, FormCheckbox, FormInput } from '../../../../../../components'
import type { ActivityFormValues } from '../../../../schemas/activitySchema'
import { useTranslation } from 'react-i18next'

interface PaymentSectionProps {
  register: UseFormRegister<ActivityFormValues>
  errors: FieldErrors<ActivityFormValues>
  isPaid: boolean
}

export default function PaymentSection({ register, errors, isPaid }: PaymentSectionProps) {
  const { t } = useTranslation()
  return (
    <FormSection title={t('activities.payment')}>
      <div className="space-y-4 text-start">
        <FormCheckbox
          id="is_paid"
          label={t('activities.isPaidActivity')}
          register={register('is_paid')}
        />

        {isPaid && (
          <div className="w-full sm:w-1/2 md:w-1/3">
            <FormInput
              id="price"
              label={`${t('activities.price')} *`}
              type="number"
              step="0.01"
              placeholder="0.00"
              icon={<DollarSign className="h-5 w-5 text-gray-400" />}
              register={register('price')}
              error={errors.price}
            />
          </div>
        )}
      </div>
    </FormSection>
  )
}
