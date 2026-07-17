import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import logo from '../../../assets/logo.png'
import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'

const features = [
  { img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80', key: 'Activities' },
  { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80', key: 'Teams' },
  { img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80', key: 'Objectives' },
  { img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80', key: 'Treasury' },
  { img: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80', key: 'Outings' },
  { img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', key: 'Members' },
]

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
]

type AuthFormProps = {
  title: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  link: string
  linkText: string
  buttonText: string
  text?: string
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
  const { t, i18n } = useTranslation()
  const [current, setCurrent] = useState(0)
  const isRTL = i18n.dir() === 'rtl'

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const feat = features[current]

  return (
    <div className="min-h-screen flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
        {features.map((f, i) => (
          <img
            key={f.key}
            src={f.img}
            alt={t(`auth.feature${f.key}`)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-(--color-myPrimary)/85 via-(--color-myAccent)/70 to-(--color-mySecondary)/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

        <div className="relative z-10 text-center px-12 w-full max-w-lg">
          <div className=" rounded-3xl p-10   ">
            <img src={logo} alt="Logo" className="h-56 w-auto mx-auto  brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            JCI <span className="text-white/80">A MEMBER</span>
          </h1>

          <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 transition-all duration-500">
            <h3 className="text-2xl font-bold text-white mb-2">{t(`auth.feature${feat.key}`)}</h3>
            <p className="text-white/70 text-base">{t(`auth.feature${feat.key}Desc`)}</p>
          </div>

          <div className="mt-8 flex gap-2 justify-center">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === current ? 'w-8 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 relative">
        <div className="absolute top-4 end-4 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-1">
          <Globe className="w-4 h-4 text-gray-400 mx-1" />
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                i18n.language.startsWith(lang.code)
                  ? 'bg-(--color-myPrimary) text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="Logo" className="h-20 w-auto mx-auto" />
            <h2 className="mt-3 text-xl font-black text-gray-900 dark:text-white">
              JCI <span className="text-(--color-myPrimary)">A MEMBER</span>
            </h2>
          </div>

          <form onSubmit={onSubmit} className="w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {text}{' '}
                <Link to={`/${link}`} className="text-(--color-myPrimary) font-bold hover:underline">
                  {linkText}
                </Link>
              </p>
            </div>

            <div className="space-y-5">{children}</div>

            <button
              type="submit"
              className="mt-6 w-full bg-(--color-myPrimary) text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
