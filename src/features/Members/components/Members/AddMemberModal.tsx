import React from 'react';
import { X, User, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { useAddMemberForm } from '../../hooks/useAddMemberForm';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
    const {
        formData,
        setFormData,
        availableRoles,
        availablePostes,
        loading,
        handleAddMember
    } = useAddMemberForm({ onSuccess: onClose });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-300">
                <Header onClose={onClose} />

                <div className="flex-1 overflow-y-auto">
                    <form id="add-member-form" onSubmit={handleAddMember} className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 sm:pb-0">
                            <section className="space-y-5">
                                <InputField
                                    label="Full Name"
                                    placeholder="e.g. John Doe"
                                    value={formData.fullname}
                                    onChange={(val) => setFormData({ ...formData, fullname: val })}
                                />
                                <InputField
                                    label="Email Address"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(val) => setFormData({ ...formData, email: val })}
                                />
                                <InputField
                                    label="Phone Number"
                                    placeholder="8 digits"
                                    maxLength={8}
                                    value={formData.phone}
                                    onChange={(val) => setFormData({ ...formData, phone: val.replace(/\D/g, '') })}
                                />
                            </section>

                            <section className="space-y-5">
                                <SelectField
                                    label="Assigned Role"
                                    icon={<Shield className="w-3 h-3" />}
                                    value={formData.role}
                                    onChange={(val) => setFormData({ ...formData, role: val })}
                                    options={availableRoles.map(r => ({ label: r.toUpperCase(), value: r }))}
                                    className="bg-blue-50/50 border-blue-100"
                                />

                                {availablePostes.length > 0 && (
                                    <SelectField
                                        label="Specific Poste"
                                        value={formData.posteId}
                                        onChange={(val) => setFormData({ ...formData, posteId: val })}
                                        options={[
                                            { label: 'Select Poste', value: '' },
                                            ...availablePostes.map(p => ({ label: p.name, value: p.id }))
                                        ]}
                                        className="bg-purple-50/50 border-purple-100"
                                        animate
                                    />
                                )}

                                <div className="space-y-4 pt-2">
                                    <ValidationToggle
                                        isValidated={formData.isValidated}
                                        onToggle={() => setFormData({ ...formData, isValidated: !formData.isValidated })}
                                    />
                                    <Notice text="A unique password will be generated and downloaded after creation." />
                                </div>
                            </section>
                        </div>
                    </form>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <Actions onClose={onClose} loading={loading} />
                </div>
            </div>
        </div>
    );
}

// --- Sub-components (local to this file for organization) ---

function Header({ onClose }: { onClose: () => void }) {
    return (
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
    );
}

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    maxLength?: number;
}

function InputField({ label, value, onChange, placeholder, type = "text", maxLength }: InputFieldProps) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                {label}
            </label>
            <input
                type={type}
                required
                maxLength={maxLength}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

interface SelectFieldProps {
    label: string;
    icon?: React.ReactNode;
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
    className?: string;
    animate?: boolean;
}

function SelectField({ label, icon, value, onChange, options, className, animate }: SelectFieldProps) {
    return (
        <div className={`space-y-2 ${animate ? 'animate-in fade-in slide-in-from-top-1 duration-200' : ''}`}>
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                {icon} {label}
            </label>
            <select
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold ${className}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function ValidationToggle({ isValidated, onToggle }: { isValidated: boolean, onToggle: () => void }) {
    return (
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
                onClick={onToggle}
                className={`w-12 h-6 rounded-full transition-all relative ${isValidated ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isValidated ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function Notice({ text }: { text: string }) {
    return (
        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight leading-normal">
                {text}
            </p>
        </div>
    );
}

function Actions({ onClose, loading }: { onClose: () => void, loading: boolean }) {
    return (
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
    );
}
