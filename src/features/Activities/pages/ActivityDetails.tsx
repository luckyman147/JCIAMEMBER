
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../utils/roles'
import Navbar from '../../../Global_Components/navBar'
import { 
  ParticipationSection, 
  ActivityCard, 
  MediaPreviewModal,
  ActivityHeader,
  MeetingAgenda,
  ActivitySidebar,
  TypeSpecificDetails,
  RecapGallery,
  AttachmentLink
} from '../components'
import { useActivityDetail } from '../hooks/useActivityDetail'

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const { user, role } = useAuth()
  const { t, i18n } = useTranslation()
  const { activity, categories, otherActivities, loading, deleteActivity } = useActivityDetail(id)
  
  const [preview, setPreview] = useState<{ items: {url: string; title: string}[]; activeIndex: number; isOpen: boolean }>({
    items: [],
    activeIndex: 0,
    isOpen: false
  })

  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!activity) return null

  const handlePreview = (url: string, title: string) => {
    setPreview({
      items: [{ url, title }],
      activeIndex: 0,
      isOpen: true
    })
  }

  const handleRecapPreview = (index: number) => {
    if (!activity.recap_images) return
    setPreview({ 
      items: activity.recap_images.map((url, i) => ({ 
        url, 
        title: `${t('activities.recapPhotos')} ${i + 1}` 
      })), 
      activeIndex: index, 
      isOpen: true 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 text-start">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 group">
            <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-1 rotate-180' : 'mr-1'} transition-transform group-hover:${i18n.dir() === 'rtl' ? 'translate-x-1' : '-translate-x-1'}`} />
            {t('activities.backToActivities')}
          </Link>
          
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-8">
            <ActivityHeader 
              activity={activity} 
              isExecutive={isExecutive} 
              onDelete={deleteActivity} 
            />

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.aboutActivity')}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {activity.description || t('activities.noDescription')}
                  </p>
                </section>
                
                {activity.type === 'meeting' && activity.meeting_plan && (
                  <MeetingAgenda meetingPlan={activity.meeting_plan} />
                )}

                <TypeSpecificDetails activity={activity} />

                <AttachmentLink activity={activity} onPreview={handlePreview} />

                <RecapGallery 
                  images={activity.recap_images || []} 
                  onImageClick={handleRecapPreview} 
                />
              </div>

              <div className="md:col-span-1">
                <ActivitySidebar activity={activity} categories={categories} />
              </div>
            </div>
          </div>

          {user && (
            <div className="mt-12">
              <ParticipationSection activityId={activity.id} activityPoints={activity.activity_points} />
            </div>
          )}

          {otherActivities.length > 0 && (
            <div className="mt-12 pt-12 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('activities.discoverMore')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MediaPreviewModal 
        items={preview.items}
        initialIndex={preview.activeIndex}
        isOpen={preview.isOpen}
        onClose={() => setPreview(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
