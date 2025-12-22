import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import type { Candidate } from '../models/types'
import { toast } from 'sonner'
import Navbar from '../../../Global_Components/navBar'
import CandidatesList from '../components/CandidatesList'
import TemplatesList from '../components/TemplatesList'
import { useTranslation } from 'react-i18next'

import { useCandidates, useTemplates, useAllEvaluations, useCreateCandidate, useUpdateCandidate, useDeleteCandidate, useDeleteTemplate } from '../hooks/useRecruitment'


export default function RecruitmentPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'candidates' | 'templates'>('candidates')
  
  const { data: rawCandidates = [], isLoading: candidatesLoading } = useCandidates()
  const { data: templates = [], isLoading: templatesLoading } = useTemplates()
  const { data: evaluations = [], isLoading: evaluationsLoading } = useAllEvaluations()

  const createCandidateMutation = useCreateCandidate()
  const updateCandidateMutation = useUpdateCandidate()
  const deleteCandidateMutation = useDeleteCandidate()
  const deleteTemplateMutation = useDeleteTemplate()

  const loading = candidatesLoading || templatesLoading || evaluationsLoading

  // Derived state: Merge scores into candidates
  const candidates = rawCandidates.map(c => {
    const candidateEvaluations = evaluations.filter(e => e.candidate_id === c.id)
    if (candidateEvaluations.length > 0) {
        const latest = candidateEvaluations[0] 
        return {
            ...c,
            total_score: latest.total_score,
            max_possible_score: latest.max_possible_score
        }
    }
    return c
  })

  // Candidate Form State
  const [showModal, setShowModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [formData, setFormData] = useState({ fullname: '', email: '', phone: '' })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleOpenAdd = () => {
      setEditingCandidate(null)
      setFormData({ fullname: '', email: '', phone: '' })
      setShowModal(true)
  }

  const handleOpenEdit = (candidate: Candidate) => {
      setEditingCandidate(candidate)
      setFormData({ fullname: candidate.fullname, email: candidate.email, phone: candidate.phone || '' })
      setShowModal(true)
  }

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCandidate) {
          await updateCandidateMutation.mutateAsync({ id: editingCandidate.id, updates: formData })
          toast.success(t('recruitment.candidateUpdated'))
      } else {
          await createCandidateMutation.mutateAsync({
            ...formData,
            status: 'pending',
          })
          toast.success(t('recruitment.candidateAdded'))
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving candidate:', error)
      toast.error(t('recruitment.saveFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
          <main className="md:ms-64 pt-16 md:pt-6">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('recruitment.title')}</h1>
            <p className="text-gray-500">{t('recruitment.subtitle')}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'candidates' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {t('recruitment.candidates')}
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'templates' 
                ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {t('recruitment.templates')}
            </button>
          </div>
        </div>

        {activeTab === 'candidates' ? (
          <div className="space-y-6">
             <div className="flex justify-end">
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-(--color-myPrimary) text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    {t('recruitment.addCandidate')}
                </button>
             </div>

             <CandidatesList 
                candidates={candidates} 
                onDelete={(id) => deleteCandidateMutation.mutate(id)}
                onEdit={handleOpenEdit}
             />
          </div>
        ) : (
          <TemplatesList 
            templates={templates} 
            onDelete={(id) => deleteTemplateMutation.mutate(id)} 
          />
        )}
      </div>

      {/* Add/Edit Candidate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4">{editingCandidate ? t('recruitment.editCandidate') : t('recruitment.addNewCandidate')}</h2>
                <form onSubmit={handleSaveCandidate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('recruitment.fullname')}</label>
                        <input 
                            required
                            type="text" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            value={formData.fullname}
                            onChange={e => setFormData({...formData, fullname: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('recruitment.email')}</label>
                        <input 
                            required
                            type="email" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('recruitment.phone')}</label>
                        <input 
                            required
                            type="tel" 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {editingCandidate ? t('recruitment.updateCandidate') : t('recruitment.addCandidate')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
                             </main>
    </div>
  )
}
