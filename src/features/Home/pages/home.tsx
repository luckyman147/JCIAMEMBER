import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from '../../../Global_Components/navBar'
import ActivitiesFilter from '../components/ActivitiesFilter'
import { useActivities } from '../../Activities/hooks/useActivities'
import type { ActivityFilterDTO } from '../../Activities/dto/ActivityDTOs'

import TopPerformers from '../components/TopPerformers'
import TeamsOverview from '../components/TeamsOverview'
import PendingCandidates from '../components/PendingCandidates'
import ComplaintsOverview from '../../../Global_Components/ComplaintsOverview'
import { useAuth } from '../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../utils/roles'
import { useTranslation } from 'react-i18next'
import { getMemberById } from '../../Members/services/members.service'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import ActivityCard from '../../Activities/components/list/ActivityCard'

const Home = () => {
  const { t, i18n } = useTranslation() 
  const { activities, loading, fetchActivities } = useActivities() 
  const { user, role } = useAuth()
  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')
  const [profileIncomplete, setProfileIncomplete] = useState(false)

  const checkProfileCompleteness = useCallback(async () => {
    if (!user) return
    try {
      const profile = await getMemberById(user.id)
      if (profile) {
        const isIncomplete = !profile.job_title || !profile.description || !profile.avatar_url || (profile.specialties?.length || 0) === 0
        setProfileIncomplete(isIncomplete)
      }
    } catch (error) {
      console.error('Error checking profile completeness:', error)
    }
  }, [user])

  useEffect(() => {
    checkProfileCompleteness()
  }, [checkProfileCompleteness])

  
  // Handlers
  const handleFilterChange = useCallback((filters: ActivityFilterDTO) => {
    fetchActivities(filters)
  }, [fetchActivities])

  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="md:ml-64 pt-16 md:pt-6 pb-20 md:pb-0">
        {/* Hero Section (Visible to guests) */}
        {!user && (
          <section className='bg-white border-b border-gray-100 py-20 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-7xl mx-auto text-center'>
              <h1 className='text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 animate-in fade-in slide-in-from-top-4 duration-700'>
                {t('home.heroTitle')} <span className='text-(--color-myPrimary)'>{t('home.heroTitleHighlight')}</span> <br className='hidden md:block' /> {t('home.heroTitleSuffix')}
              </h1>
              <p className='text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-top-6 duration-1000'>
                {t('home.heroSubtitle')}
              </p>
              <div className='flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000'>
                <Link 
                  to="/register" 
                  className='px-8 py-3.5 bg-(--color-myPrimary) text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100'
                >
                  {t('common.getStarted')}
                </Link>
                <Link 
                  to="/login" 
                  className='px-8 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition'
                >
                  {t('common.memberLogin')}
                </Link>
              </div>

             
            </div>
          </section>
        )}
        {/* Dashboard Widgets Section (Visible to logged in users) */}
        {user && (
          <section className='py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full'>
            
            {/* Profile Completeness Alert */}
            {profileIncomplete && (
              <div className="mb-8 p-1 bg-gradient-to-r from-(--color-myPrimary)  to-(--color-mySecondary) rounded-2xl shadow-xl shadow-blue-200/50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 relative">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 text-center sm:text-start">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {t('home.completeProfileTitle')}
                    </h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                      {t('home.completeProfileDesc')}
                    </p>
                  </div>
                  
                  <Link 
                    to={`/me`}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-(--color-mySecondary)  text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 group whitespace-nowrap"
                  >
                    {t('home.completeNow')}
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6 px-1">
                 <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('home.dashboardTitle')}</h2>
                 <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-200">{t('common.internal')}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <TopPerformers />
              <TeamsOverview />
              {isExecutive && <ComplaintsOverview />}
              {isExecutive && <PendingCandidates />}
            </div>
          </section>
        )}

        {/* Activities Section */}
        <section className='py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full'>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className='text-3xl font-bold text-gray-900'>{t('home.activitiesTitle')}</h2>
              <p className='text-gray-500 mt-2'>{t('home.activitiesSubtitle')}</p>
            </div>
          </div>

          {/* Filters */}
          <ActivitiesFilter onFilterChange={handleFilterChange} />

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((activity) => (
                <div key={activity.id} className="h-full">
                  <ActivityCard 
                    activity={activity} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xl text-gray-500 font-medium">{t('common.noActivities')}</p>
              <button 
                onClick={() => fetchActivities()} 
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                {t('common.clearFilters')}
              </button>
            </div>
          )}
        </section>
      </main>
      {/* Footer */}
   
    </div>
  )
}

export default Home
