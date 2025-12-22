import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface MemberWeaknessesProps {
    weaknesses: string[];
    onUpdate: (weaknesses: string[]) => void;
    readOnly?: boolean;
}

const WEAKNESS_OPTIONS = [
    'Time Management', 'Delegation', 'Perfectionism', 'Public Speaking', 
    'Networking', 'Confidence', 'Overthinking', 'Multitasking', 
    'Attention to Detail', 'Sensitivity', 'Work-Life Balance',
    'Technical Skills', 'Impatience', 'Procrastination'
];

export default function MemberWeaknesses({ weaknesses = [], onUpdate, readOnly = false }: MemberWeaknessesProps) {
    const [newItem, setNewItem] = useState("");

    const handleAddCustom = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newItem.trim()) {
            if (!weaknesses.includes(newItem.trim())) {
                onUpdate([...weaknesses, newItem.trim()]);
            }
            setNewItem("");
        }
    };

    const handleSelectOption = (option: string) => {
        if (option && !weaknesses.includes(option)) {
            onUpdate([...weaknesses, option]);
        }
    };

    const handleRemove = (index: number) => {
        onUpdate(weaknesses.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 h-full hover:border-red-200 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Weaknesses</h3>
                    <p className="text-xs text-gray-500">Areas for development & growth</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {weaknesses.map((w, i) => (
                        <span key={i} className="group px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                            {w}
                            {!readOnly && (
                                <button 
                                    onClick={() => handleRemove(i)} 
                                    className="hover:bg-red-100 p-0.5 rounded transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    ))}
                    {weaknesses.length === 0 && (
                        <p className="text-sm text-gray-400 italic py-2">No areas for improvement noted.</p>
                    )}
                </div>

                {!readOnly && (
                    <div className="space-y-3 mt-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quick Select</label>
                            <select 
                                onChange={(e) => {
                                    handleSelectOption(e.target.value);
                                    e.target.value = "";
                                }}
                                className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white outline-none transition-all cursor-pointer"
                            >
                                <option value="">Choose an area to improve...</option>
                                {WEAKNESS_OPTIONS.filter(opt => !weaknesses.includes(opt)).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Or Type Custom</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={handleAddCustom}
                                    placeholder="Add a weakness..."
                                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                />
                                <div className="absolute right-2 top-1.5">
                                   <kbd className="px-2 py-1 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-sm">
                                        Enter
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
