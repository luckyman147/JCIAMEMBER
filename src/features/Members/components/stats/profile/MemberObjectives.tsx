import React, { useState, useEffect } from 'react'
import { Target, CheckCircle, Circle, Trophy, Plus, Trash2, XCircle, Minus, X, Star, Users } from 'lucide-react'
import { objectivesService } from '../../../services/objectivesService'
import type { UserObjectifInfos } from '../../../types/objectives'
import { useTranslation } from "react-i18next";
import CreateObjectifForm from '../../objectives/CreateObjectifForm';

interface MemberObjectivesProps {
  memberId: string;
  isAdmin?: boolean;
}

export default function MemberObjectives({ memberId, isAdmin = false }: MemberObjectivesProps) {
  const { t } = useTranslation();
  const [objectivesData, setObjectivesData] = useState<UserObjectifInfos[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvailable, setShowAvailable] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await objectivesService.getUserObjectives(memberId)
      setObjectivesData(data)
    } catch (error) {
      console.error("Failed to load objectives", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (memberId) fetchData()
  }, [memberId])

  const handleAssign = async (objectiveId: string) => {
    try {
      await objectivesService.assignObjectiveToUser(memberId, objectiveId)
      await fetchData() // Refresh to move it to assigned list
      setShowAvailable(false)
    } catch (error) {
      alert(t('profile.assignObjectiveFailed'))
    }
  }

  const handleUnassign = async (objectiveId: string) => {
    if (!window.confirm(t('profile.unassignObjectiveConfirm'))) return
    try {
      await objectivesService.unassignObjective(memberId, objectiveId)
      await fetchData()
    } catch (error) {
      alert(t('profile.unassignObjectiveFailed'))
    }
  }

  const handleDeletePermanent = async (objectiveId: string) => {
    if (!window.confirm(t('profile.deleteObjectiveConfirm'))) return
    try {
      await objectivesService.deleteObjective(objectiveId)
      await fetchData()
    } catch (error) {
      alert(t('profile.deleteObjectiveFailed'))
    }
  }

  const handleUpdateProgress = async (objectiveId: string, newProgress: number) => {
    try {
      // Optimistic update could go here, but for now specific update
      await objectivesService.updateProgress(memberId, objectiveId, newProgress)
      await fetchData()
    } catch (error) {
      console.error("Failed to update progress", error)
    }
  }

  // Derived state
  const assignedObjectives = objectivesData.filter(info => info.userObjectif !== null)
  const availableObjectives = objectivesData.filter(info => info.userObjectif === null)

  const completedCount = assignedObjectives.filter(info => info.userObjectif!.isCompleted).length
  const inProgressCount = assignedObjectives.filter(info => !info.userObjectif!.isCompleted).length
  // For points, we sum up what's earned. If points_earned isn't on UserObjectif (it wasn't in DB originally on userObjectif type, usually we use isCompleted * points)
  // Check our UserObjectif type... it has currentProgress, isCompleted, assignedAt. 
  // It effectively earns points when completed.
  const totalPoints = assignedObjectives.reduce((sum, info) => {
    if (info.userObjectif!.isCompleted) return sum + info.objectif.points
    return sum
  }, 0)

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            {t('profile.objectivesTitle')}
          </h3>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-medium px-3 py-1.5 me-2 ms-2 bg-(--color-myPrimary) text-white  rounded-lg transition-colors flex items-center gap-1"
                >
                <Plus className="w-3 h-3" />
                {t('profile.newSystemGoal')}
                </button>
                <button
                onClick={() => setShowAvailable(!showAvailable)}
                className="text-xs font-medium px-3 py-1.5 bg-(--color-mySecondary) text-white  rounded-lg transition-colors flex items-center gap-1"
                >
                {showAvailable ? <XCircle className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAvailable ? t('profile.closeList') : t('profile.addToMyGoals')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <QuickStat icon={CheckCircle} value={completedCount} label={t('profile.completed')} color="green" />
          <QuickStat icon={Circle} value={inProgressCount} label={t('profile.inProgress')} color="blue" />
          <QuickStat icon={Trophy} value={totalPoints} label={t('profile.ptsEarned')} color="yellow" />
        </div>
      </div>

      {/* Available Objectives Section */}
      {showAvailable && (
        <div className="p-4 bg-blue-50 dark:bg-slate-900/50 border-b border-blue-100 dark:border-slate-700">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">{t('profile.availableSystemGoals')}</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
            {availableObjectives.length === 0 ? (
              <p className="text-sm text-slate-500">{t('profile.noNewGoalsAvailable')}</p>
            ) : (
              availableObjectives.map(info => (
                <div key={info.objectif.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 hover:border-blue-400 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DifficultyBadge difficulty={info.objectif.difficulty?.toString() || null} />
                    <div className="flex flex-col">
                    
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                       {info.objectif.title!=null ? (info.objectif.title) : 
                         (info.objectif.groupObjectif) + ": " + info.objectif.objectifActionType + " " + info.objectif.feature}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                         <span className="text-xs text-slate-500">{t('profile.target')}: {info.objectif.target || 1}</span>
                         {(info.objectif.cible || []).length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Users className="w-3 h-3" />
                                <div className="flex gap-1">
                                    {info.objectif.cible.map(c => (
                                        <span key={c} className="px-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px]">
                                            {t(`objectives.role.${c}`, { defaultValue: c })}
                                        </span>
                                    ))}
                                </div>
                            </div>
                         )}
                      </div>
                    </div>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold ms-auto me-4">+{info.objectif.points} pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAssign(info.objectif.id)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {t('profile.start')}
                    </button>
                    <button
                      onClick={() => handleDeletePermanent(info.objectif.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title={t('profile.permanentlyDeleteObjective')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Assigned Member Objectives List */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
        {assignedObjectives.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <Target className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
            <p>{t('profile.noObjectivesAssigned')}</p>
            <p className="text-sm">{t('profile.clickAddToMyGoals')}</p>
          </div>
        ) : (
          assignedObjectives.map(info => (
             <ObjectiveCard 
               key={info.objectif.id} 
               info={info} 
               isAdmin={isAdmin}
               onUnassign={() => handleUnassign(info.objectif.id)}
               onUpdate={(prog) => handleUpdateProgress(info.objectif.id, prog)}
             />
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-1">
              <CreateObjectifForm onSuccess={() => {
                setIsCreateModalOpen(false)
                fetchData()
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickStat({ icon: Icon, value, label, color }: {
  icon: React.ElementType
  value: number
  label: string
  color: 'green' | 'blue' | 'yellow'
}) {
  const colors = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-600 dark:text-yellow-400'
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${colors[color]}`} />
      <span className="font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

function ObjectiveCard({ info, isAdmin, onUnassign, onUpdate }: { 
  info: UserObjectifInfos; 
  isAdmin: boolean;
  onUnassign: () => void;
  onUpdate: (newProgress: number) => void;
}) {
  const { t } = useTranslation();
  const { objectif, userObjectif } = info
  if (!userObjectif) return null // Should not happen in this list
  
  const target = objectif.target || 1
  const progress = Math.min((userObjectif.currentProgress / target) * 100, 100)
  const isCompleted = userObjectif.isCompleted || userObjectif.currentProgress >= target

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isCompleted 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white">
              {objectif.groupObjectif} - {objectif.objectifActionType} {objectif.feature}
            </span>
            <DifficultyBadge difficulty={objectif.difficulty || null} />
            {isCompleted && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                ✓ {t('profile.statusComplete')}
              </span>
            )}
          </div>

          {/* Progress Section */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                {userObjectif.currentProgress} / {target}
              </span>
            </div>
            
            {/* Progress Controls */}
            {isAdmin && !isCompleted && (
              <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onUpdate(Math.max(0, userObjectif.currentProgress - 1))}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs text-slate-500">{t('profile.updateProgress')}</span>
                <button 
                  onClick={() => onUpdate(Math.min(target, userObjectif.currentProgress + 1))}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

          {/* Meta & Cibles */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
            {objectif.feature && <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">{objectif.feature}</span>}
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
              <Star className="w-3 h-3" />{objectif.points} pts
            </span>
            
            {(objectif.cible || []).length > 0 && (
                <div className="flex items-center gap-1 ms-2 border-s border-gray-200 ps-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <div className="flex flex-wrap gap-1">
                        {objectif.cible.map(c => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px]">
                                {t(`objectives.role.${c}`, { defaultValue: c })}
                            </span>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
           {isAdmin && (
             <button 
              onClick={onUnassign}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title={t('profile.removingGoal')}
             >
              <X className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
    </div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  const { t } = useTranslation();
  if (!difficulty) return null
  
  const colors: Record<string, string> = {
    Basic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    Hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Extreme: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  // Fallback if the difficulty string from DB doesn't match keys exactly (e.g. Title case)
  const normalizedDiff = Object.keys(colors).find(k => k.toLowerCase() === difficulty.toLowerCase()) || 'Medium';

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[normalizedDiff]}`}>
      {t(`profile.difficulty${normalizedDiff}`)}
    </span>
  )
}
