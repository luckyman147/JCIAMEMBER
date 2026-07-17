import { useState } from 'react'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.context'
import AuthForm from '../components/AuthForm'
import supabase from '../../../utils/supabase'
import { useTranslation } from 'react-i18next'
import { Mail, Lock } from 'lucide-react'
import GoogleSignInBadge from '../components/GoogleSignInBadge'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmailFormat')),
    password: z.string().min(6, t('auth.passwordMinLength')),
  })

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const fieldKey = issue.path[0]
        if (typeof fieldKey === 'string') {
          fieldErrors[fieldKey] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }
    try {
      setErrors({})
      const { data, error } = await signIn(form)
      if (error) {
        setErrors({ email: error.message || 'Invalid login credentials' })
        return
      }
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_validated')
          .eq('id', data.user.id)
          .single()
        if (profile && !profile.is_validated) {
          navigate('/pending-validation')
          return
        }
      }
      navigate("/")
    } catch {
      setErrors({ email: 'An unexpected error occurred' })
    }
  }

  return (
    <AuthForm
      title={t('auth.welcomeBack')}
      onSubmit={handleSubmit}
      buttonText={t('auth.signIn')}
      link="register"
      text={t('auth.noAccount')}
      linkText={t('auth.register')}
    >
      <div>
        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
          {t('auth.email')}
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="email"
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {t('auth.password')}
          </label>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-semibold text-(--color-myPrimary) hover:underline"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="password"
            name="password"
            placeholder={t('auth.passwordPlaceholder')}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
        <span className="text-gray-300 dark:text-gray-600 text-[10px] font-black tracking-widest">{t('auth.or')}</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
      </div>

      <GoogleSignInBadge />
    </AuthForm>
  )
}
