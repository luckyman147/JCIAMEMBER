
import { List, ListOrdered } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface StrategyTypeToggleProps {
    listType: 'ordered' | 'bullet';
    onTypeChange: (type: 'ordered' | 'bullet') => void;
}

export const StrategyTypeToggle = ({ listType, onTypeChange }: StrategyTypeToggleProps) => {
    return (
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button 
                type="button"
                onClick={() => onTypeChange('ordered')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    listType === 'ordered' ? "bg-white text-(--color-myAccent) shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
            >
                <ListOrdered className="w-3.5 h-3.5" /> Numbered
            </button>
            <button 
                type="button"
                onClick={() => onTypeChange('bullet')}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                    listType === 'bullet' ? "bg-white text-(--color-myAccent) shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
            >
                <List className="w-3.5 h-3.5" /> Bullets
            </button>
        </div>
    );
};
