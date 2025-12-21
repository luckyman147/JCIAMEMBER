import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/Authentication/auth.context'
import logo from '../assets/logo.png'
import { useState, useRef, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { EXECUTIVE_LEVELS } from '../utils/roles'

export default function Sidebar() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const avatarUrl = user?.user_metadata?.avatar_url
  const isValidAvatarUrl = typeof avatarUrl === 'string' && avatarUrl.startsWith('http')
  const hasExclusiveAccess = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center gap-3 px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold'
      : 'flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition'

  const handleLogout = async () => {
    try {
      await signOut()
      setIsMobileOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // fallback
      navigate('/login')
    }
  }

  // Close on outside click (mobile)
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4 justify-between">
        <img src={logo} className="h-10" />
        <button onClick={() => setIsMobileOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* OVERLAY (mobile) */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden"></div>
      )}

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r shadow-sm z-50
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <img src={logo} alt="Logo" className="h-10" />
          <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
            <X />
          </button>
        </div>

        {/* USER INFO */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border">
                {isValidAvatarUrl ? (
                  <img src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-500">
                    {user.user_metadata?.fullname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user.user_metadata?.fullname || user.email}
                </p>
                <p className="text-xs text-(--color-myPrimary) uppercase font-medium">
                  {role || 'Member-NF'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NAV LINKS */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/activities" className={navLinkClass}>Activities</NavLink>

          {user ? (
            <>
              {hasExclusiveAccess && (
                <>
                  <NavLink to="/recruitment" className={navLinkClass}>Candidates</NavLink>
                  <NavLink to="/members" end className={navLinkClass}>Members</NavLink>
                </>
              )}
              <NavLink to="/teams" className={navLinkClass}>Teams</NavLink>
              <NavLink to="/me" className={navLinkClass}>My Profile</NavLink>
            </>
          ) : (
            <>
             
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              Logout
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2 rounded-lg bg-(--color-myPrimary) text-white font-semibold  transition"
                onClick={() => setIsMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full text-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                onClick={() => setIsMobileOpen(false)}
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
