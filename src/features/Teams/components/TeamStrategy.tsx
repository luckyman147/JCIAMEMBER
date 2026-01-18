import { useState } from "react";
import { Target, Save, Plus } from "lucide-react";
import { updateTeam } from "../services/teams.service";
import { toast } from "sonner";
import type { Team } from "../types";

// Sub-components
import { StrategyItem } from "./strategy/StrategyItem";
import { StrategyEditorItem } from "./strategy/StrategyEditorItem";
import { StrategyTypeToggle } from "./strategy/StrategyTypeToggle";

interface TeamStrategyProps {
    team: Team;
    canManage: boolean;
    onUpdated: () => void;
}

export default function TeamStrategy({ team, canManage, onUpdated }: TeamStrategyProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [listType, setListType] = useState<'ordered' | 'bullet'>('ordered');
    const [strategyItems, setStrategyItems] = useState<string[]>(
        team.strategy ? team.strategy.split('\n').filter(item => item.trim() !== '') : []
    );
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            const strategyText = strategyItems.join('\n');
            await updateTeam(team.id, { strategy: strategyText });
            toast.success("Strategy updated");
            setIsEditing(false);
            onUpdated();
        } catch (error) {
            toast.error("Failed to update strategy");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setStrategyItems(prev => [...prev, ""]);
    };

    const updateItem = (index: number, value: string) => {
        setStrategyItems(prev => {
            const newItems = [...prev];
            newItems[index] = value;
            return newItems;
        });
    };

    const removeItem = (index: number) => {
        setStrategyItems(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-(--color-myAccent)">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Team Strategy</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Mission & Strategic Goals</p>
                    </div>
                </div>
                {canManage && !isEditing && (
                    <div>
                        
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs  text-(--color-myAccent) px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                    >
                        <i className="fa-solid fa-pen-to-square"></i>
                        Adjust Strategy
                    </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <StrategyTypeToggle 
                        listType={listType}
                        onTypeChange={setListType}
                    />

                    <div className="space-y-3">
                        {strategyItems.map((item, index) => (
                            <StrategyEditorItem 
                                key={index}
                                index={index}
                                value={item}
                                listType={listType}
                                onChange={(val) => updateItem(index, val)}
                                onRemove={() => removeItem(index)}
                            />
                        ))}
                    </div>
                    
                    <button 
                        onClick={addItem}
                        className="flex items-center gap-2 text-xs font-black text-(--color-myAccent) uppercase tracking-widest hover:bg-blue-50 transition-colors px-4 py-2 rounded-xl border border-dashed border-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        Add Strategic Point
                    </button>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setStrategyItems(team.strategy ? team.strategy.split('\n').filter(item => item.trim() !== '') : []);
                            }}
                            className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myAccent) text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-opacity-90 shadow-lg shadow-blue-900/10 disabled:opacity-50 transition-all font-sans"
                        >
                            {loading ? "Saving..." : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Commit Strategy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {strategyItems.length > 0 ? (
                        <div className="space-y-3">
                            {strategyItems.map((item, index) => (
                                <StrategyItem 
                                    key={index}
                                    index={index}
                                    content={item}
                                    listType={listType}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-black uppercase tracking-widest">No Strategy Defined</p>
                            <p className="text-xs text-gray-400 mt-1">Define your team's tactical and strategic goals here.</p>
                            {canManage && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-(--color-myAccent) hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    Define Strategy
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
