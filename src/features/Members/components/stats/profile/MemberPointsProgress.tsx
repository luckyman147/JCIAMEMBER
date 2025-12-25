import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, Trophy, Target, BarChart2 } from 'lucide-react'
import { getPointsHistory } from '../../../services/members.service'
import type { PointsHistoryEntry } from '../../../types'
import { useTranslation } from "react-i18next";

interface MemberPointsProgressProps {
  memberId: string
  currentPoints: number
}

type TimeRange = 'week' | 'month' | 'year'

interface DisplayData {
  label: string
  points: number
}

export default function MemberPointsProgress({ memberId, currentPoints }: MemberPointsProgressProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [history, setHistory] = useState<PointsHistoryEntry[]>([])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        const data = await getPointsHistory(memberId)
        setHistory(data)
      } catch (error) {
        console.error("Failed to load points history", error)
      } finally {
        setLoading(false)
      }
    }

    if (memberId) {
      loadHistory()
    }
  }, [memberId])

  const processData = (range: TimeRange): { points: number; periodLabel: string; data: DisplayData[] } => {
    const now = new Date()
    let filtered: PointsHistoryEntry[] = []
    let groupedData: DisplayData[] = []
    let totalPoints = 0
    let label = ''

    if (range === 'week') {
      label = t('profile.last7Days')
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(now.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      
      filtered = history.filter(h => new Date(h.created_at) >= sevenDaysAgo)
      
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date()
        d.setDate(now.getDate() - 6 + i)
        return {
            date: d.toDateString(),
            label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' })
        }
      })

      groupedData = last7Days.map(day => {
          const dayPoints = filtered
            .filter(h => new Date(h.created_at).toDateString() === day.date)
            .reduce((sum, h) => sum + h.points, 0)
          return { label: day.label, points: dayPoints }
      })

    } else if (range === 'month') {
      label = t('profile.thisMonth')
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = history.filter(h => new Date(h.created_at) >= startOfMonth)

      const weeksMap = new Map<string, number>()
      // Initialize 4 weeks guaranteed
      weeksMap.set('W1', 0); weeksMap.set('W2', 0); weeksMap.set('W3', 0); weeksMap.set('W4', 0);

      filtered.forEach(h => {
          const d = new Date(h.created_at)
          const date = d.getDate()
          const weekNum = Math.ceil(date / 7)
          // Let's allow W5
           if (weekNum === 5) weeksMap.set('W5', 0);
           
          const targetKey = `W${weekNum}`
          weeksMap.set(targetKey, (weeksMap.get(targetKey) || 0) + h.points)
      })
      
      groupedData = Array.from(weeksMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({ label: k, points: v }))

    } else if (range === 'year') {
      label = t('profile.thisYear')
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      filtered = history.filter(h => new Date(h.created_at) >= startOfYear)
      
      const monthIndices = Array.from({ length: 12 }, (_, i) => i);
      const monthPoints = new Array(12).fill(0)

      filtered.forEach(h => {
          const d = new Date(h.created_at)
          monthPoints[d.getMonth()] += h.points
      })

      groupedData = monthIndices.map(i => {
          const d = new Date(now.getFullYear(), i, 1);
          return {
              label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }),
              points: monthPoints[i]
          }
      });
    }
    
    totalPoints = filtered.reduce((a, b) => a + b.points, 0)
    return { points: totalPoints, periodLabel: label, data: groupedData }
  }

  const display = processData(timeRange)
  const hasData = display.points > 0
  const maxValue = Math.max(...display.data.map(d => d.points), 10)
  
  const periodCount = display.data.filter(d => d.points > 0).length
  const avgPerPeriod = periodCount > 0 ? Math.round(display.points / periodCount) : 0

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            {t('profile.pointsProgress')}
          </h3>
          <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-1">
            {(['week', 'month', 'year'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {t(`profile.${range}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 p-4">
        <StatCard icon={Trophy} label={t('profile.totalPoints')} value={currentPoints} color="blue" />
        <StatCard icon={Calendar} label={display.periodLabel} value={display.points} color="green" />
        <StatCard icon={Target} label={t('profile.avgActivity')} value={avgPerPeriod} color="purple" />
      </div>

      {/* Chart */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 relative min-h-[160px]">
           {!hasData && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 z-10">
                <BarChart2 className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">{t('profile.noActivityRange', { range: t(`profile.${timeRange}`) })}</span>
             </div>
           )}
           
          <div className={`flex items-end justify-between gap-2 h-32 ${!hasData ? 'opacity-25 blur-[1px]' : ''}`}>
             {display.data.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  {/* Tooltip */}
                  {item.points > 0 && (
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-20 pointer-events-none">
                        {item.label}: {item.points} pts
                    </div>
                  )}
                  
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                        item.points > 0 
                            ? 'bg-(--color-myAccent) dark:bg-blue-600  dark:hover:bg-blue-500 cursor-pointer' 
                            : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                    style={{ 
                        height: `${Math.max((item.points / maxValue) * 100, 4)}%`,
                        minHeight: '4px'
                    }}
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'green' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
  }

  return (
    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50">
      <div className={`w-8 h-8 mx-auto rounded-full ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}
