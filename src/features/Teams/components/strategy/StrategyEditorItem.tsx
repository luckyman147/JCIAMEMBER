
import { Trash2 } from "lucide-react";

interface StrategyEditorItemProps {
    index: number;
    value: string;
    listType: 'ordered' | 'bullet';
    onChange: (value: string) => void;
    onRemove: () => void;
}

export const StrategyEditorItem = ({ index, value, listType, onChange, onRemove }: StrategyEditorItemProps) => {
    return (
        <div className="flex gap-2 group">
            <div className="shrink-0 w-8 h-10 flex items-center justify-center font-black text-(--color-myAccent)">
                {listType === 'ordered' ? `${index + 1}.` : '•'}
            </div>
            <input 
                className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-(--color-myAccent) outline-none transition-all placeholder:text-gray-300 text-sm font-medium"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Goal ${index + 1}...`}
            />
            <button 
                type="button"
                onClick={onRemove}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};
