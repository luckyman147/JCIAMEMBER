import { useState, useEffect } from 'react';
import { X, User, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import supabase from '../../../utils/supabase';
import { MEMBER_KEYS } from '../hooks/useMembers';
import { getRoles, getPostesByRole } from '../services/members.service';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    role: 'member',
    posteId: '',
    isValidated: true,
  });
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availablePostes, setAvailablePostes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
        getRoles().then(setAvailableRoles);
    }
  }, [isOpen]);

  // Fetch postes when role changes
  useEffect(() => {
    if (isOpen && formData.role) {
      getPostesByRole(formData.role).then(setAvailablePostes);
    }
  }, [formData.role, isOpen]);

  if (!isOpen) return null;

  const generateRandomPassword = (length = 12) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.phone.length !== 8) {
      toast.error('Phone number must be exactly 8 characters');
      return;
    }

    setLoading(true);
    const password = generateRandomPassword();

    try {
      // 1. Create a temporary Supabase client that doesn't persist the session
      // This prevents the admin from being logged out
      const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
              auth: {
                  persistSession: false,
                  autoRefreshToken: false,
                  detectSessionInUrl: false
              }
          }
      );

      // 2. Create User in Auth via the temp client
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            fullname: formData.fullname,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 3. Fetch specific role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', formData.role)
        .single();

      // 4. Update Profile via main client (admin is already authenticated)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          fullname: formData.fullname,
          phone: formData.phone,
          role_id: roleData?.id || null,
          poste_id: formData.posteId || null,
          is_validated: formData.isValidated,
          points: 100,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // SUCCESS!
      toast.success('Member created successfully!');
      
      // Provide the password file
      const blob = new Blob([
          `JCI Member Access Details\n`,
          `-------------------------\n`,
          `Name: ${formData.fullname}\n`,
          `Email: ${formData.email}\n`,
          `Password: ${password}\n\n`,
          `Note: This account has been automatically ${formData.isValidated ? 'validated' : 'created (pending validation)'} with the role: ${formData.role}.`
      ], { type: 'text/plain' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jci_access_${formData.email}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists() });
      onClose();
      setFormData({ fullname: '', email: '', phone: '', role: 'member', posteId: '', isValidated: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create member');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <User className="text-white w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleAddMember} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="8 digits"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
              </div>

              {/* Administrative Info */}
              <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Assigned Role
                    </label>
                    <select
                        className="w-full px-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        {availableRoles.map(r => (
                            <option key={r} value={r}>{r.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    {availablePostes.length > 0 && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                          Specific Poste
                        </label>
                        <select
                            className="w-full px-4 py-2.5 bg-purple-50/30 border border-purple-100 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-semibold"
                            value={formData.posteId}
                            onChange={(e) => setFormData({ ...formData, posteId: e.target.value })}
                        >
                            <option value="">Select Poste</option>
                            {availablePostes.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                      </div>
                    )}

                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <div>
                              <p className="text-sm font-bold text-gray-900 leading-tight">Validate Profile</p>
                              <p className="text-[10px] text-gray-500 font-medium">Auto-approve this member</p>
                          </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isValidated: !formData.isValidated })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isValidated ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isValidated ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight leading-normal">
                          Notice: A unique password will be generated and downloaded after creation.
                      </p>
                  </div>
              </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Create & Validate Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
