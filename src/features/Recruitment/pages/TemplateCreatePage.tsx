import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Save, ArrowLeft, Target, HelpCircle } from 'lucide-react'
import { recruitmentService } from '../services/recruitmentService'
import { toast } from 'sonner'
import type { Question } from '../models/types'
import QuestionEditor from '../components/QuestionEditor'
import { useTranslation } from 'react-i18next'
import Navbar from '../../../Global_Components/navBar'

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

    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="md:ml-64 pt-16 md:pt-6 pb-12 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                     <button 
                        onClick={() => navigate('/recruitment')}
                        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-2"
                    >
                        <ArrowLeft className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                        {t('recruitment.backToDashboard')}
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditMode ? t('recruitment.editTemplate') : t('recruitment.createTemplate')}
                    </h1>
                </div>
                
                <div className="flex items-center gap-3">
                     <span className="text-sm text-gray-500 hidden sm:block">
                        {questions.length} {t('recruitment.questionsCount', 'Questions')}
                     </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Template Details - Sticky on Desktop */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
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
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border transition-shadow"
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
                                    rows={4}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border transition-shadow resize-none"
                                    placeholder="What is this evaluation for?"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-md transition-all duration-200"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? t('recruitment.saving'): isEditMode ? t('recruitment.updateTemplate') : t('recruitment.saveTemplate')}
                    </button>
                </div>

                {/* Right: Questions Builder */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-purple-500" />
                                {t('recruitment.questions')} 
                                <span className="text-sm font-normal text-gray-500 ml-1">({questions.length})</span>
                            </h2>
                            <button
                                onClick={addQuestion}
                                className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {t('recruitment.addQuestion')}
                            </button>
                        </div>

                        <div className="space-y-6">
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
                        
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                            <button
                                onClick={addQuestion}
                                className="group flex flex-col items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors py-4 px-8 rounded-xl hover:bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-200 w-full"
                            >
                                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-medium">{t('recruitment.addNewQuestion')}</span>
                            </button>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}
