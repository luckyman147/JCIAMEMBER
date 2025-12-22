import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MemberPointsProps {
    points: number;
    onPointsChange: (newPoints: number) => void;
    readOnly?: boolean;
}

export default function MemberPoints({ points, onPointsChange, readOnly = false }: MemberPointsProps) {
    const { t } = useTranslation();
    const [pointsInput, setPointsInput] = useState<string>('');
    const [action, setAction] = useState<'add' | 'reduce'>('add');

    const handleUpdatePoints = () => {
        const val = parseInt(pointsInput);
        if (!isNaN(val)) {
            const delta = action === 'add' ? val : -val;
            onPointsChange(points + delta);
            setPointsInput('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('profile.totalPoints')}</h3>
                <span className="text-3xl font-bold text-(--color-myPrimary)">{points}</span>
            </div>

            {!readOnly && (
                <div className="space-y-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setAction('add')}
                            className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${action === 'add' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            {t('profile.increase')}
                        </button>
                        <button 
                            onClick={() => setAction('reduce')}
                            className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${action === 'reduce' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            {t('profile.decrease')}
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder={action === 'add' ? t('profile.pointsToAdd') : t('profile.pointsToRemove')} 
                            value={pointsInput}
                            onChange={(e) => setPointsInput(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                            onClick={handleUpdatePoints}
                            disabled={!pointsInput}
                            className={`px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-all ${
                                action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                        >
                            {t('profile.apply')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
