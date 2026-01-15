import { Plus, Trash2, User, ChevronUp, Clock, MessageSquare, Edit2, Check, Star, X } from 'lucide-react'
import { useParticipation, type Participant } from '../../hooks/useParticipation'
import MemberSelector from '../common/MemberSelector'
import StarRating from '../common/StarRating'
import LoadingSpinner from '../common/LoadingSpinner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../Authentication/auth.context'
import { EXECUTIVE_LEVELS } from '../../../../utils/roles'

interface ParticipationSectionProps {
  activityId: string
  activityPoints: number
}

export default function ParticipationSection({ activityId, activityPoints }: ParticipationSectionProps) {
  const {
    participants, members, loading, submitting, showForm, excludeIds,
    selectedMember, memberSearch, rate, notes,
    editingId, editRate, editNotes,
    setMemberSearch, setRate, setNotes, setEditRate, setEditNotes,
    toggleForm, handleAdd, handleDelete, handleSelectMember, handleClearSelection,
    startEdit, cancelEdit, saveEdit
  } = useParticipation({ activityId, activityPoints })

  const actualParticipants = participants.filter(p => !p.is_interested)

  const { role } = useAuth()
  const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Header 
        count={actualParticipants.length} 
        points={activityPoints} 
        showForm={showForm} 
        onToggle={toggleForm} 
        canManage={isExecutive}
      />
      
      {showForm && (
        <AddForm
          members={members}
          excludeIds={excludeIds}
          selectedMember={selectedMember}
          memberSearch={memberSearch}
          rate={rate}
          notes={notes}
          submitting={submitting}
          onSearchChange={setMemberSearch}
          onSelectMember={handleSelectMember}
          onClearSelection={handleClearSelection}
          onRateChange={setRate}
          onNotesChange={setNotes}
          onSubmit={handleAdd}
        />
      )}

      <ParticipantsList
        participants={actualParticipants}
        loading={loading}
        editingId={editingId}
        editRate={editRate}
        editNotes={editNotes}
        onEditRateChange={setEditRate}
        onEditNotesChange={setEditNotes}
        onStartEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onDelete={handleDelete}
        canManage={isExecutive}
      />
 
 
    </div>
  )
}

// ============ SUB-COMPONENTS ============

function Header({ count, points, showForm, onToggle, canManage }: {
  count: number; points: number; showForm: boolean; onToggle: () => void; canManage: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="p-6 sm:p-8 border-b border-gray-100 text-start bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex flex-col">
                <span>{t('activities.participants')}</span>
                <span className="text-xs font-normal text-gray-500">{t('activities.membersJoined', { count: count })}</span>
            </div>
          </h3>
          {points > 0 && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {t('activities.eachGets', { count: points })}
            </p>
          )}
        </div>
        {canManage && (
          <button type="button" onClick={onToggle} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--color-myPrimary) text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95">
            {showForm ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? t('activities.hide') : t('activities.addParticipant')}
          </button>
        )}
      </div>
    </div>
  )
}

function AddForm({ members, excludeIds, selectedMember, memberSearch, rate, notes, submitting, onSearchChange, onSelectMember, onClearSelection, onRateChange, onNotesChange, onSubmit }: {
  members: { id: string; fullname: string }[]
  excludeIds: string[]
  selectedMember: string
  memberSearch: string
  rate: number
  notes: string
  submitting: boolean
  onSearchChange: (v: string) => void
  onSelectMember: (id: string) => void
  onClearSelection: () => void
  onRateChange: (v: number) => void
  onNotesChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  const { t, i18n } = useTranslation()
  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 space-y-4 text-start">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MemberSelector
          members={members}
          selectedMember={selectedMember}
          memberSearch={memberSearch}
          excludeIds={excludeIds}
          onSearchChange={onSearchChange}
          onSelectMember={onSelectMember}
          onClearSelection={onClearSelection}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('activities.rateOptional')}</label>
          <StarRating value={rate} onChange={onRateChange} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('activities.notesOptional')}</label>
        <input type="text" value={notes} onChange={e => onNotesChange(e.target.value)} placeholder={t('activities.notesPlaceholder')} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5 px-3 border" />
      </div>
      <div className={`flex ${i18n.dir() === 'rtl' ? 'justify-start' : 'justify-end'}`}>
        <button type="submit" disabled={submitting || !selectedMember} className="px-6 py-2.5 bg-(--color-mySecondary) text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors min-w-[140px] justify-center">
          {submitting ? <><LoadingSpinner size="sm" /> {t('activities.adding')}</> : <><Plus className="w-4 h-4" /> {t('activities.add')}</>}
        </button>
      </div>
    </form>
  )
}

function ParticipantsList({ participants, loading, editingId, editRate, editNotes, onEditRateChange, onEditNotesChange, onStartEdit, onCancelEdit, onSaveEdit, onDelete, canManage }: {
  participants: Participant[]
  loading: boolean
  editingId: string | null
  editRate: number
  editNotes: string
  onEditRateChange: (v: number) => void
  onEditNotesChange: (v: string) => void
  onStartEdit: (p: Participant) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onDelete: (p: Participant) => void
  canManage: boolean
}) {
  const { t, i18n } = useTranslation()
  const formatDate = (d: string) => new Date(d).toLocaleDateString(i18n.language)

  if (loading) return <div className="p-8 text-center text-gray-500"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />{t('activities.loading')}</div>
  if (participants.length === 0) return <div className="p-8 text-center text-gray-500"><User className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>{t('activities.noParticipantsYet')}</p></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
      {participants.map(p => (
        <div 
          key={p.id} 
          className={`relative group transition-all duration-200 rounded-xl border ${editingId === p.id ? 'border-blue-200 bg-blue-50/30 ring-2 ring-blue-500/20' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
        >
          <div className="p-4">
            {editingId === p.id ? (
              <EditRow p={p} rate={editRate} notes={editNotes} onRateChange={onEditRateChange} onNotesChange={onEditNotesChange} onSave={() => onSaveEdit(p.id)} onCancel={onCancelEdit} />
            ) : (
              <ViewRow p={p} formatDate={formatDate} onEdit={() => onStartEdit(p)} onDelete={() => onDelete(p)} canManage={canManage} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ViewRow({ p, formatDate, onEdit, onDelete, canManage }: { p: Participant; formatDate: (d: string) => string; onEdit: () => void; onDelete: () => void; canManage: boolean }) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="flex flex-col gap-3 text-start h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-900 group-hover:text-(--color-myPrimary) transition-colors">{p.member?.fullname || 'Unknown'}</span>
                {p.rate && <StarRating value={p.rate} size="sm" disabled />}
            </div>
            {canManage && (
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            )}
        </div>
        
        {p.is_temp && (
            <div className="mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {t('activities.temp')}
                </span>
            </div>
        )}

        <div className="space-y-2 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatDate(p.registered_at)}</span>
          </div>
          {p.notes && (
            <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-100/50 p-2 rounded-lg border border-gray-100">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <p className="line-clamp-2 italic">"{p.notes}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EditRow({ p, rate, notes, onRateChange, onNotesChange, onSave, onCancel }: { p: Participant; rate: number; notes: string; onRateChange: (v: number) => void; onNotesChange: (v: string) => void; onSave: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="font-bold text-gray-900">{p.member?.fullname}</span>
        <div className="flex gap-2">
          <button onClick={onSave} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-all"><Check className="w-4 h-4" /></button>
          <button onClick={onCancel} className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('activities.rate')}</label>
            <StarRating value={rate} onChange={onRateChange} />
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-start">{t('activities.notes')}</label>
            <input 
                type="text" 
                value={notes} 
                onChange={e => onNotesChange(e.target.value)} 
                className="w-full rounded-xl border-gray-200 bg-gray-50/50 text-sm py-2.5 px-3 border focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all" 
                placeholder={t('activities.notes')} 
            />
        </div>
      </div>
    </div>
  )
}



