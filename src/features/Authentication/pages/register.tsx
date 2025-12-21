import { useState } from 'react'
import { z } from 'zod'
import { useAuth } from '../auth.context'
import AuthForm from '../components/AuthForm'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// ---------------------
// ZOD VALIDATION SCHEMA
// ---------------------
const registerSchema = z.object({
  fullname: z.string().min(3, 'Full name is required'),
  phone: z.string().min(6, 'Phone number is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  birth_date: z.string().min(1, 'Birthday is required'),
  device_id: z.string(),
})

export default function Register() {
  const { signUp, signOut } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    birth_date: '',
    device_id: navigator.userAgent,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })

    // Clear field error when user updates value
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate with Zod
    const result = registerSchema.safeParse(form)
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

    // If valid -> call signUp
    try {
      // Clear previous errors before signup
      setErrors({})
      
      const response = await signUp(form)
      
      // Check if signUp returned an error
      if (response?.error) {
        console.error('SignUp error:', response.error)
        setErrors({ 
          general: response.error.message || 'Failed to create account. Please try again.' 
        })
        return
      }

      // Force signOut if Supabase auto-logged us in, 
      // preventing ProtectedRoute from bouncing us to home.
      await signOut()
      toast.success('Registration successful! Please login to continue.')
      navigate('/login')
    } catch (err: any) {
      // Handle unexpected errors
      console.error('Unexpected error:', err)
      setErrors({ general: err.message || 'Something went wrong' })
    }
  }

  return (
    <AuthForm
      title='Create Account'
      onSubmit={handleSubmit}
      buttonText='Register'
      link='login'
      linkText='Login '
      text='Already have an account?'
    >
      {/* General Error Message */}
      {errors.general && (
        <div className='bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-4 font-bold text-sm'>
          {errors.general}
        </div>
      )}

      {/* Grid for Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
          <input
            name='fullname'
            placeholder='John Doe'
            className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm'
            onChange={handleChange}
          />
          {errors.fullname && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.fullname}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Phone</label>
          <input
            name='phone'
            placeholder='+216 ...'
            className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm'
            onChange={handleChange}
          />
          {errors.phone && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
        <input
          name='email'
          type="email"
          placeholder='name@company.com'
          className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm'
          onChange={handleChange}
        />
        {errors.email && (
          <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.email}</p>
        )}
      </div>

      {/* Grid for Password & Birthday */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
          <input
            type='password'
            name='password'
            placeholder='••••••••'
            className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm'
            onChange={handleChange}
          />
          {errors.password && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Birthday</label>
          <input
            type='date'
            name='birth_date'
            className='w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm'
            onChange={handleChange}
          />
          {errors.birth_date && (
            <p className='text-red-500 text-[10px] font-bold mt-1 ml-1'>{errors.birth_date}</p>
          )}
        </div>
      </div>
    </AuthForm>
  )
}