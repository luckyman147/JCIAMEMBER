import { useState, useEffect, useRef } from "react";
import { Tag, Trash2 } from "lucide-react";
import { 
    getCategories, 
    getProfileCategories, 
    removeProfileCategory, 
    addProfileCategory, 
    createCategory, 
    deleteGlobalCategory,
    type Category 
} from "../../../services/members.service";
import { useAuth } from "../../../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../../../utils/roles";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { ProfileCard } from "../shared";

interface MemberInterestsProps {
    memberId: string;
    readOnly?: boolean;
}

export default function MemberInterests({ memberId, readOnly = false }: MemberInterestsProps) {
    const { t } = useTranslation();
    const { role } = useAuth();
    const canDeleteGlobal = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');
    
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Long Press State
    const longPressTimer = useRef<any>(null);
    const [pressingId, setPressingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [allCategories, profileCategories] = await Promise.all([
                    getCategories(),
                    getProfileCategories(memberId)
                ]);
                
                setAvailableCategories(allCategories);
                setSelectedCategoryIds(new Set(profileCategories.map(c => c.id)));
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [memberId]);

    const handleCategoryToggle = async (category: Category) => {
        if (readOnly) return;
        const isSelected = selectedCategoryIds.has(category.id);
        
        try {
            if (isSelected) {
                await removeProfileCategory(memberId, category.id);
                setSelectedCategoryIds(prev => {
                    const next = new Set(prev);
                    next.delete(category.id);
                    return next;
                });
            } else {
                await addProfileCategory(memberId, category.id);
                setSelectedCategoryIds(prev => new Set(prev).add(category.id));
            }
        } catch (error) {
            console.error('Error toggling category:', error);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (!canDeleteGlobal) return;
        
        const confirmed = window.confirm(t('profile.categoryDeleteConfirm', { name: category.name }));
        if (!confirmed) return;

        try {
            await deleteGlobalCategory(category.id);
            setAvailableCategories(prev => prev.filter(c => c.id !== category.id));
            toast.success(t('profile.categoryDeleted', { name: category.name }));
        } catch (error) {
            toast.error(t('profile.categoryDeleteFailed'));
        }
    };

    const startPress = (category: Category) => {
        if (!canDeleteGlobal) return;
        setPressingId(category.id);
        longPressTimer.current = setTimeout(() => {
            handleDeleteCategory(category);
            setPressingId(null);
        }, 800); // 800ms for long press
    };

    const cancelPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setPressingId(null);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCreateError(t('profile.categoryNameEmpty'));
            return;
        }
        
        setCreating(true);
        setCreateError(null);
        
        try {
            const newCategory = await createCategory(newCategoryName);
            if (newCategory) {
                setAvailableCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
                setNewCategoryName("");
                setShowCreateInput(false);
            }
        } catch (error: any) {
            setCreateError(error.message === 'Category already exists' ? t('profile.categoryExists') : t('profile.categoryCreateFailed'));
        } finally {
            setCreating(false);
        }
    };

    return (
        <ProfileCard
            title={t('profile.interests')}
            subtitle={canDeleteGlobal ? t('profile.longPressDelete') : undefined}
            icon={Tag}
            iconColorClass="text-blue-600"
            iconBgClass="bg-blue-50"
            headerActions={!showCreateInput && !readOnly && (
                <button
                    onClick={() => setShowCreateInput(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                >
                    {t('profile.addNew')}
                </button>
            )}
            readOnly={true}
        >
            <div className="space-y-4">
                {showCreateInput && (
                    <div className="p-2.5 bg-gray-50/50 rounded-xl border border-blue-100 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-col gap-2.5">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                placeholder={t('profile.addInterestPlaceholder')}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                autoFocus
                            />
                            <div className="flex gap-1.5 justify-end">
                                <button
                                    onClick={handleCreateCategory}
                                    disabled={creating || !newCategoryName.trim()}
                                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-all shadow-sm active:scale-95"
                                >
                                    {creating ? t('profile.creating') : t('profile.create')}
                                </button>
                                <button 
                                    onClick={() => setShowCreateInput(false)} 
                                    className="px-3 py-1.5 text-[10px] font-bold text-gray-500 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-all"
                                >
                                    {t('profile.cancel')}
                                </button>
                            </div>
                        </div>
                        {createError && (
                            <p className="mt-1.5 text-[9px] font-bold text-red-600 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                                {createError.toUpperCase()}
                            </p>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                        <span>{t('common.loading')}</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.length === 0 && (
                            <p className="text-sm text-gray-400 italic py-2">{t('profile.noInterests')}</p>
                        )}
                        {availableCategories.map(cat => {
                            const isPressing = pressingId === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => !pressingId && handleCategoryToggle(cat)}
                                    onMouseDown={() => startPress(cat)}
                                    onMouseUp={cancelPress}
                                    onMouseLeave={cancelPress}
                                    onTouchStart={() => startPress(cat)}
                                    onTouchEnd={cancelPress}
                                    disabled={readOnly}
                                    className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        selectedCategoryIds.has(cat.id)
                                            ? 'bg-(--color-mySecondary) text-white border-(--color-mySecondary) shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                    } ${readOnly ? 'cursor-default' : 'active:scale-95'} ${isPressing ? 'scale-110 !border-red-500 !text-red-600 ring-2 ring-red-100' : ''}`}
                                >
                                    {isPressing && (
                                        <div className="absolute -top-1 -end-1">
                                            <Trash2 className="w-3 h-3 text-red-500 animate-bounce" />
                                        </div>
                                    )}
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </ProfileCard>
    );
}
