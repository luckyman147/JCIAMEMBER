import { Plus, Trash2, Clock } from 'lucide-react'
import { calculateTotalTime, createAgendaItem, type AgendaItem } from '../../../../models/MeetingAgenda'
import { useTranslation } from 'react-i18next'

interface MeetingAgendaProps {
  agenda: AgendaItem[]
  onChange: (agenda: AgendaItem[]) => void
  disabled?: boolean
}

export default function MeetingAgenda({ agenda, onChange, disabled = false }: MeetingAgendaProps) {
  const { t, i18n } = useTranslation()
  const handleAddItem = () => {
    onChange([...agenda, createAgendaItem()])
  }

  const handleRemoveItem = (id: string) => {
    onChange(agenda.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: 'title' | 'estimatedTime', value: string | number) => {
    onChange(
      agenda.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const totalMinutes = calculateTotalTime(agenda)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div className="space-y-4 text-start">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('activities.meetingAgendaLabel')}
        </label>
        {totalMinutes > 0 && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className={`h-4 w-4 ${i18n.dir() === 'rtl' ? 'ml-1' : 'mr-1'}`} />
            {t('activities.total')}: {hours > 0 ? `${hours}h ` : ''}{minutes}{t('activities.min')}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {agenda.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg dark:border-slate-700">
            <p className="text-sm text-gray-500">{t('activities.noAgendaItems')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('activities.clickToAddAgenda')}</p>
          </div>
        ) : (
          agenda.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </div>
              
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                  placeholder={t('activities.agendaItemTitlePlaceholder')}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    {[2, 5, 10, 20].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'estimatedTime', preset)}
                        disabled={disabled}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                          item.estimatedTime === preset
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {preset} {t('activities.min')}
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.estimatedTime && ![2, 5, 10, 20].includes(item.estimatedTime) ? item.estimatedTime : ''}
                        onChange={(e) => handleUpdateItem(item.id, 'estimatedTime', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder={t('activities.custom', 'Custom')}
                        disabled={disabled}
                        className={`w-16 px-2 py-1 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          item.estimatedTime && ![2, 5, 10, 20].includes(item.estimatedTime)
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-gray-300'
                        }`}
                      />
                      <span className="text-xs text-gray-400">{t('activities.min')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                disabled={disabled}
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remove agenda item"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800"
      >
        <Plus className="h-5 w-5" />
        {t('activities.addAgendaItem')}
      </button>
    </div>
  )
}
