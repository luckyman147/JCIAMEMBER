
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TagManagerProps {
    tags: string[];
    onUpdate: (tags: string[]) => void;
    options?: string[];
    readOnly?: boolean;
    placeholder?: string;
    tagColorClass?: string;
    tagBgClass?: string;
    tagBorderClass?: string;
    translationPrefix?: string;
    customInputLabel?: string;
    quickSelectLabel?: string;
}

export const TagManager = ({
    tags = [],
    onUpdate,
    options = [],
    readOnly = false,
    placeholder,
    tagColorClass = "text-blue-700",
    tagBgClass = "bg-blue-50",
    tagBorderClass = "border-blue-100",
    translationPrefix,
    customInputLabel,
    quickSelectLabel
}: TagManagerProps) => {
    const { t } = useTranslation();
    const [newItem, setNewItem] = useState("");

    const handleAddCustom = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newItem.trim()) {
            if (!tags.includes(newItem.trim())) {
                onUpdate([...tags, newItem.trim()]);
            }
            setNewItem("");
        }
    };

    const handleSelectOption = (option: string) => {
        if (option && !tags.includes(option)) {
            onUpdate([...tags, option]);
        }
    };

    const handleRemove = (index: number) => {
        onUpdate(tags.filter((_, i) => i !== index));
    };

    const renderTagName = (tag: string) => {
        if (!translationPrefix) return tag;
        return t(`${translationPrefix}.${tag}`, { defaultValue: tag });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                    <span 
                        key={i} 
                        className={`group px-3 py-1.5 ${tagBgClass} ${tagColorClass} border ${tagBorderClass} rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in zoom-in duration-300`}
                    >
                        {renderTagName(tag)}
                        {!readOnly && (
                            <button 
                                onClick={() => handleRemove(i)} 
                                className="hover:bg-black/5 p-0.5 rounded transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
                {tags.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-2">{t('profile.noData')}</p>
                )}
            </div>

            {!readOnly && (
                <div className="space-y-4 mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    {options.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {quickSelectLabel || t('profile.quickSelect')}
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                {options.map(opt => {
                                    const isSelected = tags.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => isSelected ? handleRemove(tags.indexOf(opt)) : handleSelectOption(opt)}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                                isSelected 
                                                ? `${tagBgClass} ${tagColorClass} !text-white border` 
                                                : `bg-white text-gray-400 border-gray-200 hover:border-${tagBorderClass}`
                                            }`}
                                        >
                                            {renderTagName(opt)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {customInputLabel || t('profile.orTypeCustom')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={handleAddCustom}
                                placeholder={placeholder || t('profile.addPlaceholder')}
                                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-100 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                            <div className="absolute right-2 top-1.5 flex items-center gap-1">
                                <kbd className="hidden sm:block px-2 py-1 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded-md">
                                    {t('profile.pressEnter')}
                                </kbd>
                                <button 
                                    onClick={() => handleAddCustom({ key: 'Enter' } as any)} 
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
