import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, MapPin, Video, DollarSign, Edit, Trash2, ArrowLeft, Clock, Tag, Users } from 'lucide-react'
import { activityService } from '../services/activityService'
import type { Activity } from '../models/Activity'
import { toast } from 'sonner'
import ParticipationSection from '../components/ParticipationSection'
import Navbar from '../../../Global_Components/navBar'
import { EXECUTIVE_LEVELS } from '../../../utils/roles'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../Authentication/auth.context'
import type { Category } from '../../Members/services/members.service'
import MediaPreviewModal from '../components/MediaPreviewModal'
import ActivityCard from '../components/ActivityCard'

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { t, i18n } = useTranslation()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [otherActivities, setOtherActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{ items: {url: string; title: string}[]; activeIndex: number; isOpen: boolean }>({
    items: [],
    activeIndex: 0,
    isOpen: false
  })

  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  useEffect(() => {
    if (id) {
      loadActivity(id)
    }
  }, [id])

  const loadActivity = async (activityId: string) => {
    try {
      setLoading(true)
      const [data, cats, allActs] = await Promise.all([
        activityService.getActivityById(activityId),
        activityService.getActivityCategories(activityId),
        activityService.getActivities()
      ])
      setActivity(data)
      setCategories(cats)
      setOtherActivities(allActs.filter(a => a.id !== activityId).slice(0, 3))
      
      // Scroll to top when loading new activity
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error loading activity:', error)
      navigate('/activities') 
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!activity || !confirm(t('activities.deleteConfirm'))) return
    
    try {
      await activityService.deleteActivity(activity.id)
      toast.success(t('activities.activityDeleted'))
      navigate('/')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error(t('activities.deleteFailed'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!activity) return null

  const startDate = new Date(activity.activity_begin_date)
  const endDate = new Date(activity.activity_end_date)

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
          <main className="md:ms-64 pt-16 md:pt-6 text-start">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 group">
          <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-1 rotate-180' : 'mr-1'} transition-transform group-hover:${i18n.dir() === 'rtl' ? 'translate-x-1' : '-translate-x-1'}`} />
          {t('activities.backToActivities')}
        </Link>
        
        {/* Header Content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-8">
          {/* Cover Image */}
          <div className="relative h-64 md:h-80 w-full bg-gray-200">
             <img
              src={activity.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
            {isExecutive && (
              <div className={`absolute top-4 ${i18n.dir() === 'rtl' ? 'left-4' : 'right-4'} flex gap-2`}>
                   <Link
                    to={`/activities/${activity.id}/edit`} 
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-blue-600 hover:text-blue-700 shadow-sm transition-transform hover:scale-105"
                    title={t('activities.editActivity')}
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-600 hover:text-red-700 shadow-sm transition-transform hover:scale-105"
                    title={t('activities.deleteActivity')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
              </div>
            )}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                  {t(`profile.${activity.type}`)}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">{activity.name}</h1>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.aboutActivity')}</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {activity.description || t('activities.noDescription')}
                    </p>
                </section>
                
                 {/* Meeting Agenda (Only for meetings) */}
                 {activity.type === 'meeting' && activity.meeting_plan && (
                    <section>
                         <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.meetingAgenda')}</h2>
                         <div className="bg-(--color-myAccent) rounded-lg border border-gray-200 overflow-hidden">
                             {(() => {
                               try {
                                 const agendaItems = JSON.parse(activity.meeting_plan) as Array<{id: string, title: string, estimatedTime: number}>
                                 return (
                                   <div className="divide-y divide-gray-200">
                                     {agendaItems.map((item, index) => (
                                       <div key={item.id || index} className="p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center text-sm font-medium">
                                              {index + 1}
                                            </span>
                                            <span className=" text-white font-bold">{item.title}</span>
                                          </div>
                                          <div className="flex items-center text-sm text-white font-bold gap-1">
                                            <Clock className="w-4 h-4" />
                                            {item.estimatedTime} {t('activities.min')}
                                          </div>
                                       </div>
                                     ))}
                                      {agendaItems.length > 0 && (
                                        <div className={`p-3 bg-white text-sm font-medium text-gray-600 ${i18n.dir() === 'rtl' ? 'text-left' : 'text-right'}`}>
                                            {t('activities.totalTime')}: {agendaItems.reduce((acc, curr) => acc + (Number(curr.estimatedTime) || 0), 0)} {t('activities.min')}
                                        </div>
                                     )}
                                   </div>
                                 )
                               } catch (e) {
                                 console.error('Failed to parse meeting plan', e)
                                 return (
                                   <div className="p-4 text-sm text-red-500">
                                     Failed to load agenda details. Raw: {activity.meeting_plan}
                                   </div>
                                 )
                               }
                             })()}
                         </div>
                    </section>
                )}

                 {/* Formation: Trainer Info */}
                {activity.type === 'formation' && activity.trainer_name && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{t('activities.trainer')}</h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold">
                          {activity.trainer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{activity.trainer_name}</p>
                          <p className="text-sm text-gray-500">{t('activities.courseTrainer')}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Attachments Section */}
                {((activity.type === 'meeting' && activity.pv_attachments) || 
                  (activity.type === 'formation' && activity.course_attachment)) && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      {activity.type === 'meeting' ? t('activities.pvDocument') : t('activities.courseMaterials')}
                    </h2>
                    <a
                      href={activity.type === 'meeting' ? activity.pv_attachments : activity.course_attachment}
                      onClick={(e) => {
                        e.preventDefault();
                        const url = (activity.type === 'meeting' ? activity.pv_attachments : activity.course_attachment) || '';
                        const title = activity.type === 'meeting' ? t('activities.meetingPV') : t('activities.courseDocument');
                        setPreview({
                          items: [{ url, title }],
                          activeIndex: 0,
                          isOpen: true
                        });
                      }}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {activity.type === 'meeting' ? t('activities.meetingPV') : t('activities.courseDocument')}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{t('activities.clickToView')}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </section>
                )}

                {/* Recap Images */}
                {activity.recap_images && activity.recap_images.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      {t('activities.recapPhotos')}
                      <span className={`text-sm font-normal text-gray-500 ${i18n.dir() === 'rtl' ? 'mr-2' : 'ml-2'}`}>({activity.recap_images.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activity.recap_images.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setPreview({ 
                            items: activity.recap_images?.map((url, i) => ({ 
                              url, 
                              title: `${t('activities.recapPhotos')} ${i + 1}` 
                            })) || [], 
                            activeIndex: index, 
                            isOpen: true 
                          })}
                          className="block aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Recap ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

            </div>

             {/* Sidebar Details */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4 text-start">
                     <h3 className="font-semibold text-gray-900 mb-4">{t('activities.eventDetails')}</h3>
                     
                     <div className="flex items-start gap-3">
                         <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-gray-900">{t('activities.startDate')}</p>
                             <p className="text-sm text-gray-600">
                                 {startDate.toLocaleDateString(i18n.language)} {t('activities.at')} {startDate.toLocaleTimeString(i18n.language, {hour: '2-digit', minute:'2-digit'})}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                         <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                             <p className="text-sm font-medium text-gray-900">{t('activities.endDate')}</p>
                             <p className="text-sm text-gray-600">
                                 {endDate.toLocaleDateString(i18n.language)} {t('activities.at')} {endDate.toLocaleTimeString(i18n.language, {hour: '2-digit', minute:'2-digit'})}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                        {activity.is_online ? <Video className="w-5 h-5 text-green-500 mt-0.5" /> : <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />}
                        <div>
                             <p className="text-sm font-medium text-gray-900">{activity.is_online ? t('activities.online') : t('activities.location')}</p>
                             <p className="text-sm text-gray-600 break-words">
                                 {activity.is_online ? (
                                    <a href={activity.online_link || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        {activity.online_link || t('activities.linkTBD')}
                                    </a>
                                 ) : (
                                     activity.activity_address || t('activities.addressTBD')
                                 )}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                         <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-gray-900">{t('activities.participants')}</p>
                             <p className="text-sm text-gray-600">
                                 {activity.activity_participants?.[0]?.count || 0} {t('activities.membersJoined')}
                             </p>
                         </div>
                     </div>

                     <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-gray-900">
                                {activity.is_paid && activity.price ? `$${activity.price}` : t('activities.free')}
                            </span>
                         </div>
                         {activity.activity_points > 0 && (
                           <span className="text-sm font-medium px-2 py-1 bg-(--color-mySecondary) text-white rounded-md">
                                 {t('activities.points', { count: activity.activity_points })}
                             </span>
                         )}
                     </div>

                     {/* Categories */}
                     {categories.length > 0 && (
                       <div className="pt-4 border-t border-gray-200">
                         <div className="flex items-center gap-2 mb-2">
                           <Tag className="w-4 h-4 text-gray-500" />
                           <span className="text-sm font-medium text-gray-900">{t('activities.categories')}</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                           {categories.map(cat => (
                             <span 
                             key={cat.id}
                               className="px-3 py-1 text-xs font-medium bg-(--color-myPrimary) text-white rounded-full"
                             >
                               {cat.name}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                </div>
            </div>
          </div>
        </div>

        {/* Participations Section - Wide Layout */}
        {user && (
            <div className="mt-12">
               <ParticipationSection activityId={activity.id} activityPoints={activity.activity_points} />
            </div>
        )}

        {/* Other Activities Section */}
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
