import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ScoreSummaryProps {
    totalQuestions: number
    answeredCount: number
    totalScore: number
    maxPossibleScore: number
    saving: boolean
    onSave: () => void
    onDecision: (status: 'accepted' | 'rejected') => void
}

export default function ScoreSummary({ 
    totalQuestions, 
    answeredCount, 
    totalScore, 
    maxPossibleScore, 
    saving, 
    onSave, 
    onDecision 
}: ScoreSummaryProps) {
    const { t } = useTranslation()
    
    return (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4 space-y-6 text-start">
            <div>
                <h3 className="text-lg font-semibold mb-4">{t('recruitment.summary')}</h3>
                
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{t('recruitment.questions')}</span>
                        <span className="font-medium">{totalQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{t('recruitment.answered')}</span>
                        <span className="font-medium">{answeredCount} / {totalQuestions}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-900">{t('recruitment.totalScore')}</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {totalScore} <span className="text-sm text-gray-400 font-normal">/ {maxPossibleScore}</span>
                        </span>
                    </div>
                </div>

                <button
                    onClick={onSave}
                    disabled={saving}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? t('recruitment.saving') : t('recruitment.saveEvaluation')}
                </button>
            </div>

            <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('recruitment.finalDecision')}</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onDecision('accepted')}
                        className="py-2 px-4 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium transition-colors text-center"
                    >
                        {t('recruitment.acceptCandidate')}
                    </button>
                    <button
                        onClick={() => onDecision('rejected')}
                        className="py-2 px-4 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors text-center"
                    >
                        {t('recruitment.rejectCandidate')}
                    </button>
                </div>
            </div>
         </div>
    )
}
