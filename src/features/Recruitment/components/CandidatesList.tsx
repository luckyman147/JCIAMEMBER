import { useState } from 'react'
import { ChevronRight, Pencil, Trash2, LayoutGrid, List, Filter, ArrowUpDown, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Candidate } from '../models/types'
import { recruitmentService } from '../services/recruitmentService'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface CandidatesListProps {
    candidates: Candidate[]
    onDelete: (id: string) => void
    onEdit: (candidate: Candidate) => void
}

type ViewMode = 'list' | 'grid'
type SortOption = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'

export default function CandidatesList({ candidates, onDelete, onEdit }: CandidatesListProps) {
    const { t, i18n } = useTranslation()
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [sortBy, setSortBy] = useState<SortOption>('date_desc')
    const [isGrouped, setIsGrouped] = useState(false)

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('recruitment.deleteConfirm'))) return
        try {
            await recruitmentService.deleteCandidate(id)
            onDelete(id)
            toast.success(t('recruitment.deleted'))
        } catch (error) {
            console.error(error)
            toast.error(t('recruitment.deleteFailed'))
        }
    }

    // --- Processing Logic ---
    let processed = [...candidates]

    // 1. Filter
    if (filterStatus !== 'all') {
        processed = processed.filter(c => c.status === filterStatus)
    }

    // 2. Sort
    processed.sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'score_desc') return (b.total_score || 0) - (a.total_score || 0)
        if (sortBy === 'score_asc') return (a.total_score || 0) - (b.total_score || 0)
        return 0
    })

    // 3. Grouping
    const groups: Record<string, Candidate[]> = {}
    if (isGrouped) {
        processed.forEach(c => {
            const status = c.status
            if (!groups[status]) groups[status] = []
            groups[status].push(c)
        })
    } else {
        groups['all'] = processed
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'evaluated': return 'bg-blue-100 text-blue-800'
            case 'accepted': return 'bg-green-100 text-green-800'
            case 'rejected': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const renderCandidateCard = (candidate: Candidate) => (
        <div key={candidate.id} className="overflow-x-auto  bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-(-color-myPrimary) flex items-center justify-center text-white font-bold">
                            {candidate.fullname.substring(0, 2).toUpperCase()   }
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{candidate.fullname}</h3>
                            <p className="text-xs text-gray-500">{new Date(candidate.created_at).toLocaleDateString(i18n.language)}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${getStatusColor(candidate.status)}`}>
                        {t(`recruitment.${candidate.status}`)}
                    </span>
                </div>
                
                <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600 truncate" title={candidate.email}>
                        📧 {candidate.email}
                    </div>
                    <div className="text-sm text-gray-600">
                        📱 {candidate.phone}
                    </div>
                    {candidate.status !== 'pending' && (
                         <div className="text-sm font-medium text-gray-900 mt-2">
                             {t('recruitment.score')}: {candidate.total_score ?? '-'} / {candidate.max_possible_score ?? '?'}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                 <div className="flex gap-2">
                    <button onClick={() => onEdit(candidate)} className="p-1 text-gray-400 hover:text-blue-600" title={t('common.edit')}>
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(candidate.id)} className="p-1 text-gray-400 hover:text-red-600" title={t('common.delete')}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 <Link to={`/recruitment/candidates/${candidate.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                     {t('recruitment.evaluate')} <ChevronRight className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                 </Link>
            </div>
        </div>
    )

    const renderListRow = (candidate: Candidate) => (
         <tr key={candidate.id} className="overflow-x-auto hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-(--color-myPrimary) flex items-center justify-center text-white font-bold">
                        {candidate.fullname.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ms-4 text-start">
                        <div className="text-sm font-medium text-gray-900">{candidate.fullname}</div>
                        <div className="text-xs text-gray-400">{new Date(candidate.created_at).toLocaleDateString(i18n.language)}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-start">
                <div className="text-sm text-gray-900">{candidate.email}</div>
                <div className="text-sm text-gray-500">{candidate.phone}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                    {t(`recruitment.${candidate.status}`).toUpperCase()}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                {candidate.status !== 'pending' && candidate.total_score !== undefined ? (
                    <span className="font-semibold">
                        {candidate.total_score} <span className="text-gray-400 font-normal">/ {candidate.max_possible_score || '?'}</span>
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={() => onEdit(candidate)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={t('common.edit')}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDelete(candidate.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title={t('common.delete')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    <Link 
                        to={`/recruitment/candidates/${candidate.id}`} 
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                        {t('recruitment.evaluate')} <ChevronRight className={`w-4 h-4 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
                    </Link>
                </div>
            </td>
        </tr>
    )

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Status Filter */}
                    <div className="relative flex items-center">
                        <Filter className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`${i18n.dir() === 'rtl' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none`}
                        >
                            <option value="all">{t('recruitment.allStatus')}</option>
                            <option value="pending">{t('recruitment.pending')}</option>
                            <option value="evaluated">{t('recruitment.evaluated')}</option>
                            <option value="accepted">{t('recruitment.accepted')}</option>
                            <option value="rejected">{t('recruitment.rejected')}</option>
                        </select>
                    </div>

                    {/* Sort */}
                     <div className="relative flex items-center">
                        <ArrowUpDown className={`absolute ${i18n.dir() === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className={`${i18n.dir() === 'rtl' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none`}
                        >
                            <option value="date_desc">{t('recruitment.newestFirst')}</option>
                            <option value="date_asc">{t('recruitment.oldestFirst')}</option>
                            <option value="score_desc">{t('recruitment.highestScore')}</option>
                            <option value="score_asc">{t('recruitment.lowestScore')}</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                     {/* Group Toggle */}
                     <button
                        onClick={() => setIsGrouped(!isGrouped)}
                        className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                            isGrouped 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                        title={t('recruitment.group')}
                    >
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('recruitment.group')}</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    {/* View Toggles */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === 'list' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${
                                viewMode === 'grid' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
             <div className="space-y-8 text-start">
                {Object.keys(groups).map((groupName) => {
                    const groupCandidates = groups[groupName]
                    if (groupCandidates.length === 0) return null

                    return (
                        <div key={groupName} className="space-y-4">
                            {isGrouped && (
                                <h3 className="text-lg font-semibold text-gray-700 capitalize flex items-center gap-2">
                                    <span className={`w-2 h-8 rounded-full ${getStatusColor(groupName).split(' ')[0]}`}></span>
                                    {groupName === 'all' ? t('recruitment.allStatus') : t(`recruitment.${groupName}`)} 
                                    <span className="text-gray-400 text-sm font-normal">({groupCandidates.length})</span>
                                </h3>
                            )}

                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupCandidates.map(renderCandidateCard)}
                                </div>
                            ) : (
                                <>
                                    {/* Mobile: Show Cards when in List mode */}
                                    <div className="md:hidden grid grid-cols-1 gap-4">
                                        {groupCandidates.map(renderCandidateCard)}
                                    </div>

                                    {/* Desktop: Show Table */}
                                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        {/* Responsive Table Wrapper */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('recruitment.candidates')}</th>
                                                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('recruitment.email')} / {t('recruitment.phone')}</th>
                                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('recruitment.score')}</th>
                                                        <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {groupCandidates.map(renderListRow)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
                
                {processed.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-2">
                            <Filter className="w-8 h-8 mx-auto opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{t('recruitment.noCandidates')}</h3>
                        <p className="text-gray-500">{t('recruitment.noCandidatesSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
