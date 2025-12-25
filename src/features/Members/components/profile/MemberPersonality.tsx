import { useTranslation } from 'react-i18next';
import { Brain, Info } from 'lucide-react';

interface MemberPersonalityProps {
    type?: 'Dominant' | 'Influence' | 'Steadiness' | 'Conscientious';
    onUpdate: (type: 'Dominant' | 'Influence' | 'Steadiness' | 'Conscientious') => void;
    readOnly?: boolean;
}

const PERSONALITIES_CONFIG = [
    { id: 'Dominant', color: 'bg-red-500', hover: 'hover:ring-red-500/50' },
    { id: 'Influence', color: 'bg-yellow-400', hover: 'hover:ring-yellow-400/50' },
    { id: 'Steadiness', color: 'bg-green-500', hover: 'hover:ring-green-500/50' },
    { id: 'Conscientious', color: 'bg-blue-500', hover: 'hover:ring-blue-500/50' }
] as const;

export default function MemberPersonality({ type, onUpdate, readOnly = false }: MemberPersonalityProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const handleUpdate = (newType: typeof type) => {
        if (newType && newType !== type) {
            onUpdate(newType);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full hover:shadow-md transition-all">
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('profile.personalityTitle')}</h3>
                        <p className="text-[10px] text-gray-500 font-medium">{t('profile.personalitySubtitle')}</p>
                    </div>
                </div>
                {!readOnly && (
                    <div title={t('profile.personalitySubtitle')}>
                        <Info className="w-4 h-4 text-gray-300 cursor-help" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PERSONALITIES_CONFIG.map((p) => {
                    const isSelected = type === p.id;
                    const selectedBg = p.id === 'Dominant' ? 'bg-red-600' : 
                                     p.id === 'Influence' ? 'bg-yellow-500' : 
                                     p.id === 'Steadiness' ? 'bg-green-600' : 
                                     'bg-blue-600';
                    const activeBorder = p.id === 'Dominant' ? 'border-red-700' : 
                                       p.id === 'Influence' ? 'border-yellow-600' : 
                                       p.id === 'Steadiness' ? 'border-green-700' : 
                                       'border-blue-700';

                    const pName = t(`profile.disc.${p.id}.name`);
                    const pDesc = t(`profile.disc.${p.id}.desc`);

                    return (
                        <button
                            key={p.id}
                            disabled={readOnly}
                            onClick={() => handleUpdate(p.id)}
                            className={`w-full group relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                                isSelected 
                                    ? `${selectedBg} ${activeBorder} shadow-xl scale-[1.02] z-10` 
                                    : `border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 shadow-sm`
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                                isSelected ? 'bg-white/20 ring-4 ring-white/20' : `${p.color} shadow-lg`
                            }`}>
                                <span className="font-black text-xl text-white">{pName[0]}</span>
                            </div>

                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-sm font-black uppercase tracking-wider ${
                                        isSelected ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {pName}
                                    </span>
                                    {isSelected && (
                                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                                            {t('profile.chosen')}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs leading-relaxed font-medium ${
                                    isSelected ? 'text-white/90' : 'text-gray-500'
                                }`}>
                                    {pDesc}
                                </p>
                            </div>

                            {isSelected && (
                                <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} animate-in zoom-in duration-300`}>
                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {readOnly && !type && (
                <div className="mt-4 p-4 border border-dashed border-gray-100 rounded-xl text-center">
                    <p className="text-xs text-gray-400 italic">{t('profile.noPersonality')}</p>
                </div>
            )}
        </div>
    );
}
