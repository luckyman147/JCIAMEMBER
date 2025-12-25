import { Trash2, Plus, Star } from 'lucide-react'
import type { Question } from '../models/types'
import { useTranslation } from 'react-i18next'

interface QuestionEditorProps {
    question: Question
    index: number
    onUpdate: (id: string, field: keyof Question, value: any) => void
    onRemove: (id: string) => void
}

export default function QuestionEditor({ question, index, onUpdate, onRemove }: QuestionEditorProps) {
    const { t, i18n } = useTranslation()
    
    return (
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 group text-start">
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Question Number */}
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 font-bold text-gray-500 text-xs sm:text-base">
                    {index + 1}
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Question Text */}
                    <div>
                        <input
                            type="text"
                            value={question.text}
                            onChange={(e) => onUpdate(question.id, 'text', e.target.value)}
                            className="w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border text-sm sm:text-base"
                            placeholder={t('recruitment.questionPlaceholder')}
                        />
                    </div>

                    {/* Question Type & Max Score */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                {t('recruitment.questionType')}
                            </label>
                            <select
                                value={question.type || 'numeric'}
                                onChange={(e) => {
                                    const newType = e.target.value
                                    onUpdate(question.id, 'type', newType)
                                    // Auto-set max score for rating
                                    if (newType === 'rating') {
                                        onUpdate(question.id, 'maxScore', 5)
                                    }
                                }}
                                className="w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 sm:py-1 sm:px-2 text-sm border"
                            >
                                <option value="numeric">{t('recruitment.numeric')}</option>
                                <option value="text">{t('recruitment.text')}</option>
                                <option value="checkbox">{t('recruitment.checkbox')}</option>
                                <option value="choice">{t('recruitment.choice')}</option>
                                <option value="rating">{t('recruitment.rating')}</option>
                            </select>
                        </div>
                        
                        {question.type !== 'choice' && (
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                                    {t('recruitment.maxScore')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={question.maxScore}
                                        onChange={(e) => onUpdate(question.id, 'maxScore', parseInt(e.target.value) || 0)}
                                        className={`w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 sm:py-1 sm:px-2 text-sm border ${
                                            question.type === 'rating' ? 'bg-gray-100 text-gray-500' : ''
                                        }`}
                                        min="1"
                                        disabled={question.type === 'rating'}
                                    />
                                    {question.type === 'rating' && (
                                        <div className={`absolute ${i18n.dir() === 'rtl' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-yellow-400`}>
                                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Options for choice/checkbox */}
                    {(question.type === 'choice' || question.type === 'checkbox') && (
                        <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                                {t('recruitment.options')}
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {question.options?.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                        <input
                                            type="text"
                                            value={opt.label}
                                            onChange={(e) => {
                                                const newOpts = [...(question.options || [])]
                                                newOpts[optIdx].label = e.target.value
                                                onUpdate(question.id, 'options', newOpts)
                                            }}
                                            placeholder={t('recruitment.optionPlaceholder')}
                                            className="flex-1 w-full text-sm border-gray-300 rounded border p-2 sm:p-1"
                                        />
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <input
                                                type="number"
                                                value={opt.score}
                                                onChange={(e) => {
                                                    const newOpts = [...(question.options || [])]
                                                    newOpts[optIdx].score = parseInt(e.target.value) || 0
                                                    
                                                    if (question.type === 'choice') {
                                                        const max = Math.max(...newOpts.map(o => o.score))
                                                        onUpdate(question.id, 'maxScore', max)
                                                    } else {
                                                        const sum = newOpts.reduce((acc, curr) => acc + (curr.score > 0 ? curr.score : 0), 0)
                                                        onUpdate(question.id, 'maxScore', sum)
                                                    }
                                                    onUpdate(question.id, 'options', newOpts)
                                                }}
                                                placeholder={t('recruitment.ptsPlaceholder')}
                                                className="w-16 text-sm border-gray-300 rounded border p-1 text-center"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOpts = question.options?.filter((_, i) => i !== optIdx)
                                                    onUpdate(question.id, 'options', newOpts)
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                aria-label={t('recruitment.removeOption')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    const newOpts = [...(question.options || []), { label: '', score: 0 }]
                                    onUpdate(question.id, 'options', newOpts)
                                }}
                                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-2"
                            >
                                <Plus className="w-3 h-3" /> {t('recruitment.addOption')}
                            </button>
                        </div>
                    )}

                    {/* Info messages */}
                    {question.type === 'text' && (
                        <div className="text-sm text-gray-500 italic p-3 bg-gray-50 border border-gray-200 rounded">
                            {t('recruitment.textInfo')}
                        </div>
                    )} 
                    {question.type === 'rating' && (
                        <div className="text-sm text-gray-500 italic p-3 bg-gray-50 border border-gray-200 rounded">
                            {t('recruitment.ratingInfo')}
                        </div>
                    )} 
                </div>

                {/* Remove button - always visible on mobile, only on hover on desktop */}
                <button
                    onClick={() => onRemove(question.id)}
                    className="p-1 sm:p-2 text-gray-400 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title={t('recruitment.removeQuestion')}
                    aria-label={t('recruitment.removeQuestion')}
                >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    )
}