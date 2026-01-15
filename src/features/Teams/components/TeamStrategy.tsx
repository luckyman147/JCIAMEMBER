
import { useState } from "react";
import { Target, Save, Edit2, Plus, Trash2 } from "lucide-react";
import { updateTeam } from "../services/teams.service";
import { toast } from "sonner";
import type { Team } from "../types";

interface TeamStrategyProps {
    team: Team;
    canManage: boolean;
    onUpdated: () => void;
}

export default function TeamStrategy({ team, canManage, onUpdated }: TeamStrategyProps) {
    const [isEditing, setIsEditing] = useState(false);
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
        setStrategyItems([...strategyItems, ""]);
    };

    const updateItem = (index: number, value: string) => {
        const newItems = [...strategyItems];
        newItems[index] = value;
        setStrategyItems(newItems);
    };

    const removeItem = (index: number) => {
        setStrategyItems(strategyItems.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Team Strategy
                </h2>
                {canManage && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <div className="space-y-3">
                        {strategyItems.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <span className="shrink-0 w-6 h-10 flex items-center justify-center font-bold text-blue-600">
                                    {index + 1}.
                                </span>
                                <input 
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={item}
                                    onChange={(e) => updateItem(index, e.target.value)}
                                    placeholder={`Goal ${index + 1}...`}
                                />
                                <button 
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={addItem}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add Strategic Goal
                    </button>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setStrategyItems(team.strategy ? team.strategy.split('\n').filter(item => item.trim() !== '') : []);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Strategy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {strategyItems.length > 0 ? (
                        <ol className="space-y-3">
                            {strategyItems.map((item, index) => (
                                <li key={index} className="flex gap-4 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 group">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <p className="text-gray-700 leading-relaxed pt-1">
                                        {item}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 font-medium">No strategy defined for this team yet.</p>
                            {canManage && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-3 text-xs bg-white border border-gray-200 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
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
