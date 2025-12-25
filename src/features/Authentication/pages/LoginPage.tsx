import { useState } from 'react'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.context'
import AuthForm from '../components/AuthForm'
import supabase from '../../../utils/supabase'
import { useTranslation } from 'react-i18next'
import GoogleSignInBadge from '../components/GoogleSignInBadge'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmailFormat')),
    password: z.string().min(6, t('auth.passwordMinLength')),
  })

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

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
      // Clear previous errors before signin
      setErrors({})
      const { data, error } = await signIn(form)
      
      if (error) {
        setErrors({ email: error.message || 'Invalid login credentials' })
        return
      }

      if (data?.user) {
        // Fetch profile to check validation status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_validated')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        } else if (profile && !profile.is_validated) {
          // If not validated, steer to rh advisor page
          navigate('/pending-validation')
          return
        }
      }

      navigate("/")
    } catch (error) {
      console.error('Error during login:', error)
      setErrors({ email: 'An unexpected error occurred' })
    }
  }

  return (
    <AuthForm title='Welcome Back' onSubmit={handleSubmit} buttonText='Login' link='register' text='Don t Have an account?' linkText='Create one'>
      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
        <input
          name='email'
          type="email"
          placeholder='name@company.com'
          className='w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all'
          onChange={handleChange}
        />
        {errors.email && (
          <p className='text-red-500 text-xs font-bold mt-1 ml-1'>{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1 ml-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
          <button 
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-bold text-(--color-myPrimary) hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <input
          type='password'
          name='password'
          placeholder='••••••••'
          className='w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all'
          onChange={handleChange}
        />
        {errors.password && (
          <p className='text-red-500 text-xs font-bold mt-1 ml-1'>{errors.password}</p>
        )}
      </div>

      {/* OR Divider */}
      <div className='flex items-center my-6 gap-3'>
        <div className='flex-1 h-px bg-gray-100' />
        <span className='text-gray-300 text-[10px] font-black tracking-widest'>OR</span>
        <div className='flex-1 h-px bg-gray-100' />
      </div>

      {/* GOOGLE LOGIN BUTTON */}
      <div className="flex justify-center">
        <GoogleSignInBadge />
      </div>

      {/* Register link */}
    
    </AuthForm>
  )
}
