import React from 'react'
import logo from '../../../assets/logo.png';
import { Link } from 'react-router-dom';
type AuthFormProps = {
  title: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  link:string
  linkText:string
  buttonText: string
    text?:string
}

export default function AuthForm({
  title,
  onSubmit,
  children,
  buttonText,
    link,
    text,
    linkText,
}: AuthFormProps) {
  return (
    <div className='min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-50/50 p-4'>
      {/* Premium Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl w-full gap-8 lg:gap-24">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <img src={logo} alt='Logo' className='h-32 md:h-64 w-auto object-contain drop-shadow-2xl' />
          <h2 className="mt-4 text-2xl font-black text-gray-900 tracking-tight text-center md:hidden">
            JCI <span className="text-(--color-myPrimary)">A MEMBER </span>
          </h2>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          <form
            onSubmit={onSubmit}
            className='w-full bg-white p-8 md:p-10 border border-gray-100 rounded-[2rem] shadow-2xl shadow-gray-200/50'
          >
            <div className="mb-8">
              <h1 className='text-3xl font-black text-gray-900 tracking-tight leading-none'>{title}</h1>
              <div className="mt-2 h-1.5 w-12 bg-(--color-myPrimary) rounded-full"></div>
            </div>

            <div className='space-y-4'>{children}</div>

            <button
              type='submit'
              className='mt-8 w-full bg-(--color-myPrimary) text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-(--color-myPrimary) hover:-translate-y-0.5 transition-all active:scale-95'
            >
              {buttonText}
            </button>

            <p className='text-sm text-center mt-6 text-gray-500 font-medium'>
              {text}  {' '}
              <Link to={`/${link}`} className='text-(--color-myPrimary) font-bold hover:underline transition-all'>
                {linkText}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
