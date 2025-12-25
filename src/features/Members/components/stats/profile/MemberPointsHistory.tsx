import { useState, useEffect } from 'react'
import { History, Calendar } from 'lucide-react'
import { getPointsHistory } from '../../../services/members.service'
import type { PointsHistoryEntry } from '../../../types'
import { useTranslation } from "react-i18next";

interface MemberPointsHistoryProps {
  memberId: string
}

export default function MemberPointsHistory({ memberId }: MemberPointsHistoryProps) {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<PointsHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    loadHistory()
  }, [memberId])

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const displayedHistory = history.slice(0, limit)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          {t('profile.pointsHistory')}
        </h3>
        <span className="text-xs text-gray-500">{history.length} {t('profile.entries')}</span>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
           <div className="p-8 text-center text-gray-500 dark:text-slate-400">
             <div className="animate-spin w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full mx-auto mb-2"></div>
             {t('profile.loadingHistory')}
           </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
             <p>{t('profile.noPointsHistoryFound')}</p>
          </div>
        ) : (
          <table className="w-full text-sm text-start">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('profile.date')}</th>
                <th className="px-4 py-3">{t('profile.source')}</th>
                <th className="px-4 py-3">{t('common.description')}</th>
                <th className="px-4 py-3 text-end">{t('profile.points')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {displayedHistory.map((entry) => (
                <tr key={entry.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${entry.source_type === 'activity' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                        entry.source_type === 'objective' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        entry.source_type === 'manual' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {entry.source_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className={`px-4 py-3 text-end font-bold ${entry.points > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {entry.points > 0 ? "+" : ""}    {entry.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {history.length > limit && (
        <div className="p-3 bg-gray-50 dark:bg-slate-900/50 text-center border-t border-gray-100 dark:border-slate-700">
          <button 
            onClick={() => setLimit(prev => prev + 10)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('profile.showMore')}
          </button>
        </div>
      )}
    </div>
  )
}
