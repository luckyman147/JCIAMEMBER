import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { recruitmentService } from '../services/recruitmentService'
import type { Candidate, EvaluationTemplate } from '../models/types'
import { toast } from 'sonner'
import { useAuth } from '../../../features/Authentication/auth.context'
import Navbar from '../../../Global_Components/navBar'
import EvaluationForm from '../components/EvaluationForm'
import ScoreSummary from '../components/ScoreSummary'
import { useTranslation } from 'react-i18next'

export default function CandidateEvaluationPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  // Evaluation State
  const [scores, setScores] = useState<Record<string, number>>({})
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({})
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (candidateId: string) => {
    try {
      setLoading(true)
      const [cList, tData, evals] = await Promise.all([
        recruitmentService.getCandidates(),
        recruitmentService.getTemplates(),
        recruitmentService.getEvaluationsByCandidate(candidateId)
      ])
      
      const found = cList.find(c => c.id === candidateId)
      if (found) setCandidate(found)
      setTemplates(tData)

      // Pre-fill if evaluated
      if (evals && evals.length > 0) {
        const lastEval = evals[0] // Get first/latest
        // Find if template still exists
        const templateExists = tData.find(t => t.id === lastEval.template_id)
        if (templateExists) {
            setSelectedTemplateId(lastEval.template_id)
            setScores(lastEval.scores || {})
            setTextAnswers(lastEval.text_answers || {})
            setRemarks(lastEval.remarks || '')
        }
      }

    } catch (error) {
      console.error(error)
      toast.error(t('recruitment.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (questionId: string, score: number, max: number) => {
    if (score < 0) score = 0
    if (score > max) score = max
    setScores(prev => ({ ...prev, [questionId]: score }))
  }

  const calculateTotal = () => {
    return Object.values(scores).reduce((a, b) => a + b, 0)
  }

  const calculateMaxPossible = () => {
    return selectedTemplate?.questions.reduce((a, q) => a + q.maxScore, 0) || 0
  }

  const handleSubmit = async () => {
    if (!candidate || !selectedTemplate) return
    
    try {
      setSaving(true)
      await recruitmentService.saveEvaluation({
        candidate_id: candidate.id,
        template_id: selectedTemplate.id,
        template_title: selectedTemplate.title,
        scores,
        text_answers: textAnswers,
        total_score: calculateTotal(),
        max_possible_score: calculateMaxPossible(),
        remarks,
        created_by: user?.id || '' 
      })
      
      await recruitmentService.updateCandidateStatus(candidate.id, 'evaluated') 
      setCandidate(prev => prev ? { ...prev, status: 'evaluated' } : null)

      toast.success(t('recruitment.evaluationSaved'))
    } catch (error) {
      console.error(error)
      toast.error(t('recruitment.evaluationSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDecision = async (status: 'accepted' | 'rejected') => {
      if (!candidate) return
      
      setSaving(true)
      
      try {
        // 1. Auto-save evaluation if template selected and we have data
        if (selectedTemplate) {
            await recruitmentService.saveEvaluation({
                candidate_id: candidate.id,
                template_id: selectedTemplate.id,
                template_title: selectedTemplate.title,
                scores,
                text_answers: textAnswers,
                total_score: calculateTotal(),
                max_possible_score: calculateMaxPossible(),
                remarks,
                created_by: user?.id || '' 
            })
        }

        

        // 2. Update status
        await recruitmentService.updateCandidateStatus(candidate.id, status)
        setCandidate(prev => prev ? { ...prev, status } : null)
        toast.success(t('recruitment.statusUpdated', { status: t(`recruitment.${status}`).toLowerCase() }))
        setTimeout(() => navigate('/recruitment'), 1000)

      } catch (error) {
        console.error(error)
        toast.error(t('recruitment.statusUpdateFailed'))
      } finally {
        setSaving(false)
      }
  }

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>
  if (!candidate) return <div className="p-8 text-center text-red-500">{t('recruitment.noCandidates')}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
          <main className="md:ms-64 pt-16 md:pt-6">

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button 
            onClick={() => navigate('/recruitment')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
            <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t('recruitment.backToCandidates')}
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('recruitment.evaluationTitle')}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1 font-medium text-gray-900">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            {candidate.fullname}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide
                            ${candidate.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                              candidate.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                              candidate.status === 'evaluated' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {t(`recruitment.${candidate.status}`)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Template Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('recruitment.selectTemplate')}
                    </label>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => {
                            setSelectedTemplateId(e.target.value)
                            setScores({}) // Reset scores only on manual change
                          }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        disabled={loading}
                    >
                        <option value="">{t('recruitment.chooseTemplate')}</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.title} ({t.questions.length} Qs)</option>
                        ))}
                    </select>
                </div>

                {/* Evaluation Form */}
                {selectedTemplate && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-semibold">{selectedTemplate.title}</h2>
                            <p className="text-gray-500 text-sm mt-1">{selectedTemplate.description}</p>
                        </div>
  
                        <EvaluationForm
                            questions={selectedTemplate.questions}
                            scores={scores}
                            textAnswers={textAnswers}
                            onScoreChange={handleScoreChange}
                            onTextAnswerChange={(qId, text) => setTextAnswers({...textAnswers, [qId]: text})}
                        />

                        <div className="border-t border-gray-100 pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('recruitment.additionalRemarks')}
                            </label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                placeholder={t('recruitment.remarksPlaceholder')}
                                />
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Sidebar: Summary */}
            <div className="lg:col-span-1">
                {selectedTemplate && (
                     <ScoreSummary 
                     totalQuestions={selectedTemplate.questions.length}
                     answeredCount={Object.keys(scores).length}
                        totalScore={calculateTotal()}
                        maxPossibleScore={calculateMaxPossible()}
                        saving={saving}
                        onSave={handleSubmit}
                        onDecision={handleDecision}
                     />
                )}
            </div>
        </div>
      </div>
                        </main>
    </div>
  )
}
