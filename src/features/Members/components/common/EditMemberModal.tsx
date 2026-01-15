import type { Member } from '../../types';
import MemberAvatarImage from '../profile/identity/MemberAvatarImage';
import { useEditMemberForm } from '../../hooks/useEditMemberForm';
import { EditModalHeader } from './EditModalHeader';
import { BasicInfoFields } from './BasicInfoFields';
import { PosteManagementSection } from './PosteManagementSection';

interface EditMemberModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Member>) => void;
}

export default function EditMemberModal(props: EditMemberModalProps) {
  const { state, setters, handlers } = useEditMemberForm(props);
  const { 
    fullname, phone, birthday, role, posteId,
    availableRoles, availablePostes, loading,
    isManagingPoste, newPosteName, editingPosteId, editPosteName,
    canEditExclusive, isOwnProfile, avatarImage, currentUserRole
  } = state;

  const {
    setFullname, setPhone, setBirthday, setRole, setPosteId,
    setNewPosteName, setEditingPosteId, setEditPosteName
  } = setters;

  const {
    handleSubmit, handleCreatePoste, handleUpdatePoste, handleDeletePoste, toggleManagingPoste
  } = handlers;

  if (!props.isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden'>
        <EditModalHeader 
          onClose={props.onClose}
          isOwnProfile={isOwnProfile}
          canEditExclusive={canEditExclusive}
          loading={loading}
        />

        <div className="flex-1 overflow-y-auto">
          <form id='edit-member-form' onSubmit={handleSubmit} className='p-6 space-y-6'>
            {(isOwnProfile || canEditExclusive) && (
              <MemberAvatarImage fileUpload={avatarImage} />
            )}

            <div className="space-y-4">
              <BasicInfoFields 
                fullname={fullname} setFullname={setFullname}
                phone={phone} setPhone={setPhone}
                birthday={birthday} setBirthday={setBirthday}
                isOwnProfile={isOwnProfile}
                canEditExclusive={canEditExclusive}
              />

              {canEditExclusive && (
                <PosteManagementSection 
                  role={role} setRole={setRole}
                  posteId={posteId} setPosteId={setPosteId}
                  availableRoles={availableRoles}
                  availablePostes={availablePostes}
                  isManagingPoste={isManagingPoste}
                  toggleManagingPoste={toggleManagingPoste}
                  newPosteName={newPosteName}
                  setNewPosteName={setNewPosteName}
                  handleCreatePoste={handleCreatePoste}
                  editingPosteId={editingPosteId}
                  setEditingPosteId={setEditingPosteId}
                  editPosteName={editPosteName}
                  setEditPosteName={setEditPosteName}
                  handleUpdatePoste={handleUpdatePoste}
                  handleDeletePoste={handleDeletePoste}
                  currentUserRole={currentUserRole!}
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
