import { useState, useEffect } from "react";
import { Moon, Utensils, Pencil, Check, X, Sparkles } from "lucide-react";
import type { Member } from "../../types";
import { useTranslation } from "react-i18next";

interface Props {
    member: Member;
    onUpdate?: (updates: Partial<Member>) => void;
    readOnly?: boolean;
}

const ZODIAC_SIGNS = [
    { id: 'aries', icon: '♈' },
    { id: 'taurus', icon: '♉' },
    { id: 'gemini', icon: '♊' },
    { id: 'cancer', icon: '♋' },
    { id: 'leo', icon: '♌' },
    { id: 'virgo', icon: '♍' },
    { id: 'libra', icon: '♎' },
    { id: 'scorpio', icon: '♏' },
    { id: 'sagittarius', icon: '♐' },
    { id: 'capricorn', icon: '♑' },
    { id: 'aquarius', icon: '♒' },
    { id: 'pisces', icon: '♓' }
];

export default function MemberLifestyle({ member, onUpdate, readOnly = true }: Props) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [sign, setSign] = useState(member.astrological_sign || '');
    const [meal, setMeal] = useState(member.preferred_meal || '');

    useEffect(() => {
        setSign(member.astrological_sign || '');
        setMeal(member.preferred_meal || '');
    }, [member]);

    const handleSave = () => {
        onUpdate?.({ astrological_sign: sign, preferred_meal: meal });
        setIsEditing(false);
    };

    const getSignIcon = (id: string) => ZODIAC_SIGNS.find(s => s.id === id)?.icon || '';

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${isEditing ? 'border-purple-400 ring-4 ring-purple-50' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('profile.lifestyleTitle')}</h3>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.astrologicalSign')}</span>
                    </div>
                    {isEditing ? (
                        <select
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-purple-500"
                            value={sign}
                            onChange={(e) => setSign(e.target.value)}
                        >
                            <option value="">{t('common.select')}</option>
                            {ZODIAC_SIGNS.map(s => (
                                <option key={s.id} value={s.id}>{s.icon} {t(`profile.zodiac.${s.id}`)}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm font-bold text-gray-900 border-l-2 border-purple-100 pl-3 py-1">
                            {member.astrological_sign ? (
                                <span className="flex items-center gap-2">
                                    <span className="text-lg leading-none">{getSignIcon(member.astrological_sign)}</span>
                                    {t(`profile.zodiac.${member.astrological_sign}`)}
                                </span>
                            ) : (
                                <span className="text-gray-300 italic">{t('profile.notSpecified')}</span>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('profile.preferredMeal')}</span>
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                            value={meal}
                            onChange={(e) => setMeal(e.target.value)}
                            placeholder={t('profile.preferredMeal')}
                        />
                    ) : (
                        <p className="text-sm font-bold text-gray-900 border-l-2 border-emerald-100 pl-3 py-1">
                            {member.preferred_meal || <span className="text-gray-300 italic">{t('profile.notSpecified')}</span>}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
