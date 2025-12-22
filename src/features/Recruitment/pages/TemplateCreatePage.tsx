import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Save, ArrowLeft, Target, HelpCircle } from 'lucide-react'
import { recruitmentService } from '../services/recruitmentService'
import { toast } from 'sonner'
import type { Question } from '../models/types'
import QuestionEditor from '../components/QuestionEditor'
import { useTranslation } from 'react-i18next'

export default function TemplateCreatePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // Check for ID to enable Edit Mode
  const isEditMode = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', maxScore: 10, type: 'numeric', options: [] }
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEditMode && id) {
        loadTemplate(id)
    }
  }, [id, isEditMode])

  const loadTemplate = async (templateId: string) => {
      try {
          setLoading(true)
          const data = await recruitmentService.getTemplateById(templateId)
          if (data) {
              setTitle(data.title)
              setDescription(data.description || '')
              // Ensure questions have type/options properties if missing (migration)
              setQuestions(data.questions.map(q => ({
                  ...q,
                  type: q.type || 'numeric',
                  options: q.options || []
              })))
          }
      } catch (error) {
          toast.error(t('recruitment.saveFailed'))
          console.error(error)
      } finally {
          setLoading(false)
      }
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: crypto.randomUUID(), text: '', maxScore: 10, type: 'numeric', options: [] }
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error(t('recruitment.atLeastOneQuestion'))
      return
    }
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('recruitment.enterTemplateTitle'))
      return
    }
    
    // Validate questions
    const validQuestions = questions.filter(q => q.text.trim() !== '')
    if (validQuestions.length === 0) {
      toast.error(t('recruitment.addValidQuestion'))
      return
    }

    if (questions.some(q => !q.text.trim())) {
        toast.error(t('recruitment.fillAllQuestions'))
        return
    }
    
    // Validate options for choice questions
    if (questions.some(q => q.type === 'choice' && (!q.options || q.options.length < 2 || q.options.some(opt => !opt.label.trim())))) {
        toast.error(t('recruitment.choiceValidation'))
        return
    }

    try {
      setLoading(true)
      const templateData = {
          title,
          description,
          questions: validQuestions
      }
      
      if (isEditMode && id) {
           await recruitmentService.updateTemplate(id, templateData)
           toast.success(t('recruitment.templateUpdated'))
      } else {
           await recruitmentService.saveTemplate(templateData)
           toast.success(t('recruitment.templateCreated'))
      }

      navigate('/recruitment')
    } catch (error) {
        if (isEditMode)
            toast.error(t('recruitment.templateUpdateFailed'))
        else 
            toast.error(t('recruitment.templateCreateFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditMode && !title) return <div className="p-8 text-center">{t('recruitment.loadingTemplate')}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
            <button 
                onClick={() => navigate('/recruitment')}
                className="flex items-center text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                {t('recruitment.backToDashboard')}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isEditMode ? t('recruitment.editTemplate') : t('recruitment.createTemplate')}
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Template Details */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        {t('recruitment.basicInfo')}
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('recruitment.templateTitle')}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="e.g. HR Interview"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('recruitment.templateDescription')}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                placeholder="What is this evaluation for?"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                    <Save className="w-5 h-5" />
                    {loading ? t('recruitment.saving'): isEditMode ? t('recruitment.updateTemplate') : t('recruitment.saveTemplate')}
                </button>
            </div>

            {/* Right: Questions Builder */}
            <div className="lg:col-span-2">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-purple-500" />
                            {t('recruitment.questions')} ({questions.length})
                        </h2>
                        <button
                            onClick={addQuestion}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            {t('recruitment.addQuestion')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {questions.map((q, index) => (
                            <QuestionEditor
                                key={q.id}
                                question={q}
                                index={index}
                                onUpdate={updateQuestion}
                                onRemove={removeQuestion}
                            />
                        ))}
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  )
}
