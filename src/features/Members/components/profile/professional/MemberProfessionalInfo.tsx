import { useState, useEffect } from "react";
import { Briefcase, Calendar, Clock, Sparkles, Plus, X } from "lucide-react";
import type { Member } from "../../../types";
import { useTranslation } from "react-i18next";
import { ProfileCard } from "../shared";

interface MemberProfessionalInfoProps {
    member: Member;
    onUpdate?: (updates: Partial<Member>) => void;
    readOnly?: boolean;
}

const JOB_OPTIONS = [
    'Student', 'Software Engineer', 'Civil Engineer', 'Doctor', 'Lawyer', 
    'Accountant', 'Manager', 'Entrepreneur', 'Graphic Designer', 
    'Marketing Specialist', 'Teacher', 'Freelancer', 'Data Analyst', 
    'Business Consultant', 'Architect', 'Pharmacist'
];

const SPECIALTY_OPTIONS = [
    'Project Management', 'Strategic Planning', 'Public Speaking', 
    'Graphic Design', 'Web Development', 'Digital Marketing', 
    'Human Resources', 'Financial Analysis', 'Event Planning', 
    'Crisis Management', 'Training & Coaching', 'Soft Skills', 
    'Legal Advice', 'Copywriting', 'SEO', 'Data Visualization', 'UI/UX Design'
];

export default function MemberProfessionalInfo({ member, onUpdate, readOnly = true }: MemberProfessionalInfoProps) {
    const { t } = useTranslation();
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Edit States
    const [isEditingProf, setIsEditingProf] = useState(false);
    const [isEditingAvail, setIsEditingAvail] = useState(false);

    // Temp Profile State
    const [tempJob, setTempJob] = useState(member.job_title || "");
    const [tempSpecialties, setTempSpecialties] = useState<string[]>(member.specialties || []);
    const [newSpecialty, setNewSpecialty] = useState("");

    // Temp Availability State
    const [tempDays, setTempDays] = useState<string[]>(member.availability_days || []);
    const [tempTime, setTempTime] = useState(member.availability_time || 'matinal');
    const [tempHours, setTempHours] = useState(member.estimated_volunteering_hours || 0);

    // Sync state when member prop changes
    useEffect(() => {
        setTempJob(member.job_title || "");
        setTempSpecialties(member.specialties || []);
        setTempDays(member.availability_days || []);
        setTempTime(member.availability_time || 'matinal');
        setTempHours(member.estimated_volunteering_hours || 0);
    }, [member]);

    const handleSaveProf = () => {
        onUpdate?.({ job_title: tempJob, specialties: tempSpecialties });
        setIsEditingProf(false);
    };

    const handleSaveAvail = () => {
        onUpdate?.({ availability_days: tempDays, availability_time: tempTime, estimated_volunteering_hours: tempHours });
        setIsEditingAvail(false);
    };

    const toggleDay = (day: string) => {
        setTempDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const addSpecialty = (s: string) => {
        if (s && !tempSpecialties.includes(s)) {
            setTempSpecialties([...tempSpecialties, s]);
        }
        setNewSpecialty("");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <ProfileCard
                title={t('profile.professionalProfile')}
                subtitle={!isEditingProf ? (member.job_title || t('profile.noJobSpecified')) : undefined}
                icon={Briefcase}
                isEditing={isEditingProf}
                onEdit={() => setIsEditingProf(true)}
                onSave={handleSaveProf}
                onCancel={() => setIsEditingProf(false)}
                readOnly={readOnly}
            >
                {isEditingProf ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">{t('profile.jobTitle')}</label>
                            <select 
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                value={tempJob}
                                onChange={(e) => setTempJob(e.target.value)}
                            >
                                <option value="">{t('profile.jobTitlePlaceholder')}</option>
                                {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <input 
                                type="text"
                                placeholder={t('profile.customJobPlaceholder')}
                                className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                value={tempJob}
                                onChange={(e) => setTempJob(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">{t('profile.specialties')}</label>
                            <div className="flex gap-2 mb-3">
                                <select 
                                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 outline-none"
                                    onChange={(e) => { addSpecialty(e.target.value); e.target.value = ""; }}
                                >
                                    <option value="">{t('profile.quickAdd')}</option>
                                    {SPECIALTY_OPTIONS.filter(o => !tempSpecialties.includes(o)).map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text"
                                        placeholder={t('profile.customPlaceholder')}
                                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 outline-none"
                                        value={newSpecialty}
                                        onChange={(e) => setNewSpecialty(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSpecialty(newSpecialty)}
                                    />
                                    <button onClick={() => addSpecialty(newSpecialty)} className="absolute right-2 top-2 text-blue-600">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tempSpecialties.map((s, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2">
                                        {s}
                                        <button onClick={() => setTempSpecialties(prev => prev.filter((_, i) => i !== idx))}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('profile.currentOccupation')}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 border-l-2 border-blue-100 pl-3 py-1">
                                {member.job_title || <span className="text-gray-400 italic font-medium">{t('profile.notSpecified')}</span>}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('profile.expertiseTitle')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {member.specialties && member.specialties.length > 0 ? (
                                    member.specialties.map((s, idx) => (
                                        <span key={idx} className="bg-gray-50 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100 italic hover:bg-white hover:border-blue-100 transition-all">
                                            # {s}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">{t('profile.noSpecialties')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </ProfileCard>

            <ProfileCard
                title={t('profile.availability')}
                subtitle={t('profile.availabilitySubtitle')}
                icon={Calendar}
                iconColorClass="text-emerald-600"
                iconBgClass="bg-emerald-50"
                isEditing={isEditingAvail}
                onEdit={() => setIsEditingAvail(true)}
                onSave={handleSaveAvail}
                onCancel={() => setIsEditingAvail(false)}
                readOnly={readOnly}
                activeBorderClass="border-emerald-400 ring-4 ring-emerald-50"
            >
                <div className="space-y-6">
                    <div>
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS.map(day => {
                                const isAvailable = isEditingAvail ? tempDays.includes(day) : member.availability_days?.includes(day);
                                return (
                                    <div key={day} className="flex flex-col items-center gap-1">
                                        <button
                                            disabled={!isEditingAvail}
                                            onClick={() => toggleDay(day)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                                isAvailable 
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                                : 'bg-gray-50 text-gray-300 border border-gray-100'
                                            } ${isEditingAvail ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                                        >
                                            {t(`profile.${day.toLowerCase()}`).substring(0, 1)}
                                        </button>
                                        <span className={`text-[8px] font-bold uppercase ${isAvailable ? 'text-emerald-600' : 'text-gray-300'}`}>
                                            {t(`profile.${day.toLowerCase()}`).substring(0, 3)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{t('profile.preferredTime')}</span>
                            </div>
                            {isEditingAvail ? (
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {['matinal', 'afternoon', 'full_day'].map(slot => (
                                        <button
                                            key={slot}
                                            onClick={() => setTempTime(slot as any)}
                                            className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                                                tempTime === slot ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        >
                                            {t(`profile.${slot}`)}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    member.availability_time === 'matinal' ? 'bg-amber-100 text-amber-700' :
                                    member.availability_time === 'afternoon' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {member.availability_time ? t(`profile.${member.availability_time}`) : t('profile.notSpecified')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{t('profile.estimatedVolunteeringHours')}</span>
                            </div>
                            {isEditingAvail ? (
                                <input 
                                    type="number"
                                    min="0"
                                    max="168"
                                    className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                                    value={tempHours}
                                    onChange={(e) => setTempHours(parseInt(e.target.value) || 0)}
                                />
                            ) : (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    {member.estimated_volunteering_hours || 0} {t('profile.hoursAbbr', 'hrs')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </ProfileCard>
        </div>
    );
}
