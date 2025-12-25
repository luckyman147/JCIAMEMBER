import { useTranslation } from 'react-i18next';
import type { CotisationStatus } from '../../types';

interface MemberStatusProps {
    isValidated: boolean;
    cotisation: CotisationStatus | undefined;
    onValidationChange: (newStatus: boolean) => void;
    onCotisationChange: (newCotisation: CotisationStatus) => void;
    readOnly?: boolean;
}

export default function MemberStatus({ 
    isValidated, 
    cotisation, 
    onValidationChange, 
    onCotisationChange,
    readOnly = false
}: MemberStatusProps) {
    const { t } = useTranslation();
    
    const safeCotisation: boolean[] = Array.isArray(cotisation) ? cotisation : [false, false];

    const handleCotisationToggle = (index: number) => {
        const updated = [...safeCotisation];
        updated[index] = !updated[index];
        onCotisationChange(updated);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.membershipStatus')}</h3>
            
            <div className="space-y-6">
                {/* Validation Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-700">{t('profile.validation')}</p>
                        <p className="text-sm text-gray-500">{t('profile.validationQuestion')}</p>
                    </div>
                    <button 
                        onClick={() => !readOnly && onValidationChange(!isValidated)}
                        disabled={readOnly}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isValidated ? 'bg-(--color-myAccent)' : 'bg-gray-200'} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isValidated ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Cotisation Checkboxes */}
                <div>
                    <p className="font-medium text-gray-700 mb-2">{t('profile.cotisation')}</p>
                    <div className="flex gap-4">
                        <label className={`flex items-center gap-2 p-3 rounded-md flex-1 border ${readOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                            <input 
                                type="checkbox" 
                                checked={safeCotisation[0]} 
                                onChange={() => !readOnly && handleCotisationToggle(0)}
                                disabled={readOnly}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{t('profile.semester1')}</span>
                        </label>
                        
                        <label className={`flex items-center gap-2 p-3 rounded-md flex-1 border ${readOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                            <input 
                                type="checkbox" 
                                checked={safeCotisation[1]} 
                                onChange={() => !readOnly && handleCotisationToggle(1)}
                                disabled={readOnly}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{t('profile.semester2')}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
