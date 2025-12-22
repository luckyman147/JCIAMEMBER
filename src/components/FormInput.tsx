import { type ReactNode } from 'react'
import { type FieldError, type UseFormRegisterReturn } from 'react-hook-form'

interface FormInputProps {
  id: string
  label: string
  type?: 'text' | 'number' | 'url' | 'datetime-local' | 'email' | 'date' | 'time'
  placeholder?: string
  icon?: ReactNode
  error?: FieldError
  register: UseFormRegisterReturn
  step?: string
  rows?: number
  isTextarea?: boolean
}

export default function FormInput({
  id,
  label,
  type = 'text',
  placeholder,
  icon,
  error,
  register,
  step,
  rows = 4,
  isTextarea = false
}: FormInputProps) {
  const baseInputClasses = "block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
  const inputClasses = icon ? `${baseInputClasses} ps-10 pe-3 py-2` : `${baseInputClasses} px-3 py-2`

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative">
        {icon && (
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {isTextarea ? (
          <textarea
            id={id}
            rows={rows}
            {...register}
            className={baseInputClasses + " px-3 py-2"}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            id={id}
            step={step}
            {...register}
            className={inputClasses}
            placeholder={placeholder}
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  )
}
