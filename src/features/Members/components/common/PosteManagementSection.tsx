import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import type { Poste } from '../../types';

interface PosteManagementSectionProps {
  role: string;
  setRole: (val: string) => void;
  posteId: string;
  setPosteId: (val: string) => void;
  availableRoles: string[];
  availablePostes: Poste[];
  isManagingPoste: boolean;
  toggleManagingPoste: () => void;
  newPosteName: string;
  setNewPosteName: (val: string) => void;
  handleCreatePoste: () => void;
  editingPosteId: string | null;
  setEditingPosteId: (val: string | null) => void;
  editPosteName: string;
  setEditPosteName: (val: string) => void;
  handleUpdatePoste: (id: string) => void;
  handleDeletePoste: (id: string) => void;
  currentUserRole: string | undefined;
}

export const PosteManagementSection: React.FC<PosteManagementSectionProps> = ({
  role, setRole,
  posteId, setPosteId,
  availableRoles, availablePostes,
  isManagingPoste, toggleManagingPoste,
  newPosteName, setNewPosteName, handleCreatePoste,
  editingPosteId, setEditingPosteId,
  editPosteName, setEditPosteName, handleUpdatePoste,
  handleDeletePoste, currentUserRole
}) => {
  const { t } = useTranslation();
  const isPresident = currentUserRole?.toLowerCase() === 'president';

  return (
    <div className="space-y-4 pt-2 border-t border-gray-100">
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {t('profile.role')}
        </label>
        <select
          className='w-full border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary)'
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPosteId('');
          }}
        >
          {availableRoles.length === 0 && <option value={role}>{role}</option>}
          {availableRoles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex items-center justify-between mb-1">
          <label className='block text-sm font-medium text-gray-700'>
            {t('profile.poste', 'Poste Specific')}
          </label>
          {isPresident && (
            <button
              type="button"
              onClick={toggleManagingPoste}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{isManagingPoste ? 'Cancel' : 'Manage'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              className='flex-1 border rounded-md p-2 text-sm focus:ring-(--color-myPrimary) focus:border-(--color-myPrimary)'
              value={posteId}
              onChange={(e) => setPosteId(e.target.value)}
            >
              <option value="">{t('common.select', 'Select Poste')}</option>
              {availablePostes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {posteId && isPresident && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const p = availablePostes.find(x => x.id === posteId);
                    if (p) {
                      setEditingPosteId(p.id);
                      setEditPosteName(p.name);
                    }
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePoste(posteId)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Inline Creation */}
          {isManagingPoste && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Create New Position for {role}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Poste name..."
                  className="flex-1 text-xs border border-purple-200 rounded p-1.5"
                  value={newPosteName}
                  onChange={e => setNewPosteName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreatePoste}
                  className="bg-purple-600 text-white p-1.5 rounded hover:bg-purple-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Inline Editing */}
          {editingPosteId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Rename Position</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 text-xs border border-blue-200 rounded p-1.5"
                  value={editPosteName}
                  onChange={e => setEditPosteName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleUpdatePoste(editingPosteId)}
                  className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPosteId(null)}
                  className="bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
