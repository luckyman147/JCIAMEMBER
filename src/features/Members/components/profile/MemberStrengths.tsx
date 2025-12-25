import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MemberStrengthsProps {
    strengths: string[];
    onUpdate: (strengths: string[]) => void;
    readOnly?: boolean;
}

const STRENGTH_OPTIONS = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 
    'Public Speaking', 'Creativity', 'Organization', 'Adaptability', 
    'Strategic Thinking', 'Project Management', 'Conflict Resolution',
    'Decision Making', 'Time Management', 'Networking'
];

export default function MemberStrengths({ strengths = [], onUpdate, readOnly = false }: MemberStrengthsProps) {
    const { t } = useTranslation();
    const [newItem, setNewItem] = useState("");

    const handleAddCustom = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newItem.trim()) {
            if (!strengths.includes(newItem.trim())) {
                onUpdate([...strengths, newItem.trim()]);
            }
            setNewItem("");
        }
    };

    const handleSelectOption = (option: string) => {
        if (option && !strengths.includes(option)) {
            onUpdate([...strengths, option]);
        }
    };

    const handleRemove = (index: number) => {
        onUpdate(strengths.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 h-full hover:border-green-200 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('profile.strengthsTitle')}</h3>
                    <p className="text-xs text-gray-500">{t('profile.strengthsSubtitle')}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                            {strengths.map((s, i) => (
                        <span key={i} className="group px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            {t(`profile.strengthOptions.${s}`, { defaultValue: s })}
                            {!readOnly && (
                                <button 
                                    onClick={() => handleRemove(i)} 
                                    className="hover:bg-green-100 p-0.5 rounded transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))}
                    {strengths.length === 0 && (
                        <p className="text-sm text-gray-400 italic py-2">{t('profile.noStrengths')}</p>
                    )}
                </div>

                {!readOnly && (
                    <div className="space-y-3 mt-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.quickSelect')}</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {STRENGTH_OPTIONS.map(opt => {
                                    const isSelected = strengths.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => isSelected ? handleRemove(strengths.indexOf(opt)) : handleSelectOption(opt)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                                isSelected 
                                                ? 'bg-green-600 text-white border-green-600' 
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600'
                                            }`}
                                        >
                                            {t(`profile.strengthOptions.${opt}`, { defaultValue: opt })}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.orTypeCustom')}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={handleAddCustom}
                                    placeholder={t('profile.addStrength')}
                                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                />
                                <div className="absolute right-2 top-1.5">
                                   <kbd className="px-2 py-1 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-sm">
                                        {t('profile.pressEnter')}
                                   </kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
