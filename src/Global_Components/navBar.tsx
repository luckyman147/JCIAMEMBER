import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/Authentication/auth.context'
import logo from '../assets/logo.png'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { EXECUTIVE_LEVELS } from '../utils/roles'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const isRTL = i18n.language === 'ar';
  const avatarUrl = user?.user_metadata?.avatar_url
  const isValidAvatarUrl = typeof avatarUrl === 'string' && avatarUrl.startsWith('http')
  const hasExclusiveAccess = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `flex items-center gap-3 px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold transition-all ${isRTL ? 'flex-row-reverse' : ''}`
      : `flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`

  const handleLogout = async () => {
    try {
      await signOut()
      setIsMobileOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      navigate('/login')
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4 justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <img src={logo} className="h-10" />
        <button onClick={() => setIsMobileOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* OVERLAY (mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"></div>
      )}

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} h-full w-64 bg-white shadow-sm z-50
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
          <img src={logo} alt="Logo" className="h-10" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
              <X />
            </button>
          </div>
        </div>

        {/* USER INFO */}
        {user && (
          <div className="p-4 border-b">
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border shrink-0">
                {isValidAvatarUrl ? (
                  <img src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                    {user.user_metadata?.fullname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.user_metadata?.fullname || user.email}
                </p>
                <p className="text-[10px] text-(--color-myPrimary) uppercase font-bold tracking-widest">
                  {role || 'Member'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAV LINKS */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" className={navLinkClass}>
            <span className="flex-1">{t('nav.home')}</span>
          </NavLink>
          <NavLink to="/activities" className={navLinkClass}>
            <span className="flex-1">{t('nav.activities')}</span>
          </NavLink>

          {user && (
            <>
              {hasExclusiveAccess && (
                <>
                  <NavLink to="/recruitment" className={navLinkClass}>
                    <span className="flex-1">{t('nav.recruitment')}</span>
                  </NavLink>
                  <NavLink to="/members" end className={navLinkClass}>
                    <span className="flex-1">{t('nav.members')}</span>
                  </NavLink>
                </>
              )}
              <NavLink to="/teams" className={navLinkClass}>
                <span className="flex-1">{t('nav.teams')}</span>
              </NavLink>
              <NavLink to="/me" className={navLinkClass}>
                <span className="flex-1">{t('common.profile')}</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t">
          {user ? (
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 text-sm font-bold ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth.logout')}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold  transition"
                onClick={() => setIsMobileOpen(false)}
              >
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                className="w-full text-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                onClick={() => setIsMobileOpen(false)}
              >
                {t('auth.register')}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
