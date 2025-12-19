import { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { getCategories, getProfileCategories, removeProfileCategory, addProfileCategory, createCategory, type Category } from "../../services/members.service";

interface MemberInterestsProps {
    memberId: string;
    readOnly?: boolean;
}

export default function MemberInterests({ memberId, readOnly = false }: MemberInterestsProps) {
    const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

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

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCreateError("Category name cannot be empty");
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
            setCreateError(error.message === 'Category already exists' ? "A category with this name already exists" : "Failed to create category");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Tag className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Interests</h3>
                </div>
                {!showCreateInput && !readOnly && (
                    <button
                        onClick={() => setShowCreateInput(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        + Add New
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                {showCreateInput && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                placeholder="Category name..."
                                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/20 outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateCategory}
                                disabled={creating || !newCategoryName.trim()}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md"
                            >
                                {creating ? "..." : "Add"}
                            </button>
                            <button onClick={() => setShowCreateInput(false)} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-200 rounded-md">
                                Cancel
                            </button>
                        </div>
                        {createError && <p className="mt-2 text-[10px] text-red-600">{createError}</p>}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
                        <span>Loading...</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryToggle(cat)}
                                disabled={readOnly}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    selectedCategoryIds.has(cat.id)
                                        ? 'bg-(--color-mySecondary) text-white border-(--color-mySecondary) shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                } ${readOnly ? 'cursor-default' : 'active:scale-95'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
