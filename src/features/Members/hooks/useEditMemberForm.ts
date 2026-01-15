import { useState, useEffect, FormEvent } from 'react';
import type { Member, Poste } from '../types';
import { uploadAvatarImage } from '../../../utils/uploadHelpers';
import { useFileUpload } from '../../Activities/hooks/useFileUpload';
import { getRoles, getPostesByRole, getAllRoles } from '../services/members.service';
import { useAuth } from '../../Authentication/auth.context';
import { EXECUTIVE_LEVELS } from '../../../utils/roles';
import { useCreatePoste, useUpdatePoste, useDeletePoste } from './useMembers';
import { toast } from 'sonner';

interface UseEditMemberFormProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Member>) => void;
}

export const useEditMemberForm = ({ member, isOpen, onClose, onSave }: UseEditMemberFormProps) => {
  const { role: currentUserRole, user } = useAuth();
  const avatarImage = useFileUpload();
  
  const canEditExclusive = EXECUTIVE_LEVELS.includes(currentUserRole?.toLowerCase() || '');
  const isOwnProfile = user?.id === member.id;

  // --- Form State ---
  const [fullname, setFullname] = useState(member.fullname);
  const [phone, setPhone] = useState(member.phone || '');
  const [birthday, setBirthday] = useState(member.birth_date || '');
  const [role, setRole] = useState(member.role);
  const [posteId, setPosteId] = useState(member.poste_id || '');
  
  // --- Data State ---
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availablePostes, setAvailablePostes] = useState<Poste[]>([]);
  const [loading, setLoading] = useState(false);
  const [allRolesDetailed, setAllRolesDetailed] = useState<{ id: string, name: string }[]>([]);

  // --- Poste Management State ---
  const [isManagingPoste, setIsManagingPoste] = useState(false);
  const [newPosteName, setNewPosteName] = useState('');
  const [editingPosteId, setEditingPosteId] = useState<string | null>(null);
  const [editPosteName, setEditPosteName] = useState('');
  const [selectedRoleIdForNew, setSelectedRoleIdForNew] = useState('');

  const createPosteMutation = useCreatePoste();
  const updatePosteMutation = useUpdatePoste();
  const deletePosteMutation = useDeletePoste();

  // Reset state when the modal opens or the member changes
  useEffect(() => {
    if (isOpen) {
      setFullname(member.fullname);
      setPhone(member.phone || '');
      const formattedDate = member.birth_date ? member.birth_date.split('T')[0] : '';
      setBirthday(formattedDate);
      setRole(member.role);
      setPosteId(member.poste_id || '');
      avatarImage.setUrls(member.avatar_url ? [member.avatar_url] : []);
    }
  }, [member, isOpen]);

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      getRoles().then(setAvailableRoles);
      getAllRoles().then(setAllRolesDetailed);
    }
  }, [isOpen]);

  // Fetch postes when role changes
  useEffect(() => {
    if (isOpen && role) {
      getPostesByRole(role).then(setAvailablePostes);
    } else {
      setAvailablePostes([]);
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl: string | null = null;

    try {
      const updates: Partial<Member> = {};

      if (isOwnProfile || canEditExclusive) {
        if (avatarImage.file && avatarImage.file.length > 0) {
          const result = await uploadAvatarImage(avatarImage.file[0]);
          if (!result.success || !result.url) {
            throw new Error(result.error || 'Failed to upload image');
          }
          imageUrl = result.url;
        }

        updates.fullname = fullname;
        updates.phone = phone;
        updates.birth_date = birthday;
        updates.avatar_url = imageUrl || member.avatar_url;
      }

      if (canEditExclusive) {
        updates.role = role;
        updates.poste_id = posteId || undefined;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoste = async () => {
    if (!newPosteName.trim() || !selectedRoleIdForNew) {
      toast.error('Name and Role are required');
      return;
    }
    const tId = toast.loading('Creating position...');
    try {
      await createPosteMutation.mutateAsync({ name: newPosteName, roleId: selectedRoleIdForNew });
      toast.success('Position created!', { id: tId });
      setNewPosteName('');
      setIsManagingPoste(false);
      if (role) getPostesByRole(role).then(setAvailablePostes);
    } catch (err: any) {
      toast.error(err.message || 'Failed', { id: tId });
    }
  };

  const handleUpdatePoste = async (id: string) => {
    if (!editPosteName.trim()) return;
    const tId = toast.loading('Updating...');
    try {
      await updatePosteMutation.mutateAsync({ id, name: editPosteName });
      toast.success('Updated!', { id: tId });
      setEditingPosteId(null);
      if (role) getPostesByRole(role).then(setAvailablePostes);
    } catch (err: any) {
      toast.error(err.message || 'Failed', { id: tId });
    }
  };

  const handleDeletePoste = async (id: string) => {
    if (!confirm('Are you sure? This will remove the position from all assigned members.')) return;
    const tId = toast.loading('Deleting...');
    try {
      await deletePosteMutation.mutateAsync(id);
      toast.success('Deleted!', { id: tId });
      if (posteId === id) setPosteId('');
      if (role) getPostesByRole(role).then(setAvailablePostes);
    } catch (err: any) {
      toast.error(err.message || 'Failed', { id: tId });
    }
  };

  const toggleManagingPoste = () => {
    setIsManagingPoste(!isManagingPoste);
    const currentRoleObj = allRolesDetailed.find(r => r.name.toLowerCase() === role.toLowerCase());
    if (currentRoleObj) setSelectedRoleIdForNew(currentRoleObj.id);
  };

  return {
    state: {
      fullname, phone, birthday, role, posteId,
      availableRoles, availablePostes, loading,
      isManagingPoste, newPosteName, editingPosteId, editPosteName,
      allRolesDetailed, selectedRoleIdForNew,
      canEditExclusive, isOwnProfile, avatarImage, currentUserRole
    },
    setters: {
      setFullname, setPhone, setBirthday, setRole, setPosteId,
      setNewPosteName, setEditingPosteId, setEditPosteName, setSelectedRoleIdForNew
    },
    handlers: {
      handleSubmit, handleCreatePoste, handleUpdatePoste, handleDeletePoste, toggleManagingPoste
    }
  };
};
