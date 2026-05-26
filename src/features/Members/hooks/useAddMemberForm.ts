import { useState, useEffect, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import supabase from '../../../utils/supabase';
import { MEMBER_KEYS } from './useMembers';
import { getRoles, getPostesByRole } from '../services/members.service';
import type { Poste } from '../types';

interface UseAddMemberProps {
    onSuccess: () => void;
}

export const useAddMemberForm = ({ onSuccess }: UseAddMemberProps) => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        role: 'member',
        posteId: '',
        isValidated: true,
    });
    
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [availablePostes, setAvailablePostes] = useState<Poste[]>([]);
    const [loading, setLoading] = useState(false);
    const [emailCheck, setEmailCheck] = useState<{
        checking: boolean;
        exists: boolean | null;
    }>({ checking: false, exists: null });
    const queryClient = useQueryClient();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getRoles().then(setAvailableRoles);
    }, []);

    useEffect(() => {
        if (formData.role) {
            getPostesByRole(formData.role).then(setAvailablePostes);
        }
    }, [formData.role]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const trimmed = formData.email.trim();
        if (!trimmed || !trimmed.includes('@')) {
            setEmailCheck({ checking: false, exists: null });
            return;
        }

        setEmailCheck(prev => ({ ...prev, checking: true }));

        debounceRef.current = setTimeout(async () => {
            try {
                const { data, error } = await supabase.rpc('check_email_exists', {
                    p_email: trimmed.toLowerCase(),
                });
                if (error) throw error;
                setEmailCheck({ checking: false, exists: !!data });
            } catch {
                setEmailCheck({ checking: false, exists: null });
            }
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [formData.email]);

    const generateRandomPassword = (length = 12) => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    };

    const downloadAccessDetails = (fullname: string, email: string, password: string, role: string, isValidated: boolean) => {
        const blob = new Blob([
            `JCI Member Access Details\n`,
            `-------------------------\n`,
            `Name: ${fullname}\n`,
            `Email: ${email}\n`,
            `Password: ${password}\n\n`,
            `Note: This account has been automatically ${isValidated ? 'validated' : 'created (pending validation)'} with the role: ${role}.`
        ], { type: 'text/plain' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jci_access_${email}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddMember = async (e: FormEvent) => {
        e.preventDefault();
        
        if (formData.phone.length !== 8) {
            toast.error('Phone number must be exactly 8 characters');
            return;
        }

        setLoading(true);
        const password = generateRandomPassword();

        try {
            // 1. Check if email already exists in auth.users
            const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
                p_email: formData.email.trim().toLowerCase(),
            });

            if (checkError) throw checkError;

            if (emailExists) {
                toast.error('A member with this email already exists.');
                setLoading(false);
                return;
            }

            // 2. Create a temporary Supabase client that doesn't persist the session
            // This prevents the admin from being logged out
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // 3. Create User in Auth via the temp client
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

            // 4. Fetch specific role ID
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', formData.role)
                .single();

            // 5. Update Profile via main client (admin is already authenticated)
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

            toast.success('Member created successfully!');
            downloadAccessDetails(formData.fullname, formData.email, password, formData.role, formData.isValidated);

            queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists() });
            setFormData({ fullname: '', email: '', phone: '', role: 'member', posteId: '', isValidated: true });
            onSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create member';
            toast.error(message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        availableRoles,
        availablePostes,
        loading,
        emailCheck,
        handleAddMember
    };
};
