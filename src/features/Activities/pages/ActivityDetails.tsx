import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, MapPin, Video, DollarSign, Edit, Trash2, ArrowLeft, Clock, Tag, Users } from 'lucide-react'
import { activityService } from '../services/activityService'
import type { Activity } from '../models/Activity'
import { toast } from 'sonner'
import ParticipationSection from '../components/ParticipationSection'
import Navbar from '../../../Global_Components/navBar'
import type { Category } from '../../Members/services/members.service'

export default function ActivityDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadActivity(id)
    }
  }, [id])

  const loadActivity = async (activityId: string) => {
    try {
      const [data, cats] = await Promise.all([
        activityService.getActivityById(activityId),
        activityService.getActivityCategories(activityId)
      ])
      setActivity(data)
      setCategories(cats)
    } catch (error) {
      console.error('Error loading activity:', error)
      navigate('/') // Redirect if not found (no toast needed)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!activity || !confirm('Are you sure you want to delete this activity? This action cannot be undone.')) return
    
    try {
      await activityService.deleteActivity(activity.id)
      toast.success('Activity deleted')
      navigate('/')
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error('Failed to delete activity')
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
          <main className="md:ml-64 pt-16 md:pt-6">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Activities
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
            <div className="absolute top-4 right-4 flex gap-2">
                 <Link
                  to={`/activities/${activity.id}/edit`} 
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-blue-600 hover:text-blue-700 shadow-sm transition-transform hover:scale-105"
                  title="Edit Activity"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-600 hover:text-red-700 shadow-sm transition-transform hover:scale-105"
                  title="Delete Activity"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                  {activity.type}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">{activity.name}</h1>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">About this Activity</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {activity.description || 'No description provided.'}
                    </p>
                </section>
                
                 {/* Meeting Agenda (Only for meetings) */}
                 {activity.type === 'meeting' && activity.meeting_plan && (
                    <section>
                         <h2 className="text-xl font-bold text-gray-900 mb-3">Meeting Agenda</h2>
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
                                            {item.estimatedTime} min
                                          </div>
                                       </div>
                                     ))}
                                     {agendaItems.length > 0 && (
                                        <div className="p-3 bg-white text-right text-sm font-medium text-gray-600">
                                            Total Time: {agendaItems.reduce((acc, curr) => acc + (Number(curr.estimatedTime) || 0), 0)} min
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
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Trainer</h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold">
                          {activity.trainer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{activity.trainer_name}</p>
                          <p className="text-sm text-gray-500">Course Trainer</p>
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
                      {activity.type === 'meeting' ? 'PV Document' : 'Course Materials'}
                    </h2>
                    <a
                      href={activity.type === 'meeting' ? activity.pv_attachments : activity.course_attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {activity.type === 'meeting' ? 'Meeting PV' : 'Course Document'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">Click to view or download</p>
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
                      Recap Photos
                      <span className="ml-2 text-sm font-normal text-gray-500">({activity.recap_images.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activity.recap_images.map((url, index) => (
                        <a
                        key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Recap ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                 {/* Participations Section */}
                 <section>
                    <ParticipationSection activityId={activity.id} activityPoints={activity.activity_points} />
                 </section>
            </div>

            {/* Sidebar Details */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                     <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
                     
                     <div className="flex items-start gap-3">
                         <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-gray-900">Start Date</p>
                             <p className="text-sm text-gray-600">
                                 {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                         <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                             <p className="text-sm font-medium text-gray-900">End Date</p>
                             <p className="text-sm text-gray-600">
                                 {endDate.toLocaleDateString()} at {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                        {activity.is_online ? <Video className="w-5 h-5 text-green-500 mt-0.5" /> : <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />}
                        <div>
                             <p className="text-sm font-medium text-gray-900">{activity.is_online ? 'Online' : 'Location'}</p>
                             <p className="text-sm text-gray-600 break-words">
                                 {activity.is_online ? (
                                    <a href={activity.online_link || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        {activity.online_link || 'Link TBD'}
                                    </a>
                                 ) : (
                                     activity.activity_address || 'Address TBD'
                                 )}
                             </p>
                         </div>
                     </div>

                     <div className="flex items-start gap-3">
                         <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                         <div>
                             <p className="text-sm font-medium text-gray-900">Participants</p>
                             <p className="text-sm text-gray-600">
                                 {activity.activity_participants?.[0]?.count || 0} Members joined
                             </p>
                         </div>
                     </div>

                     <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-gray-900">
                                {activity.is_paid && activity.price ? `$${activity.price}` : 'Free'}
                            </span>
                         </div>
                         {activity.activity_points > 0 && (
                           <span className="text-sm font-medium px-2 py-1 bg-(--color-mySecondary) text-white rounded-md">
                                 {activity.activity_points} Points
                             </span>
                         )}
                     </div>

                     {/* Categories */}
                     {categories.length > 0 && (
                       <div className="pt-4 border-t border-gray-200">
                         <div className="flex items-center gap-2 mb-2">
                           <Tag className="w-4 h-4 text-gray-500" />
                           <span className="text-sm font-medium text-gray-900">Categories</span>
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
      </div>
                             </main>
    </div>
  )
}
