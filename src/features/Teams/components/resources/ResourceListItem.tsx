
import { Trash2 } from "lucide-react";
import { ResourceIcon } from "./ResourceIcon";
import type { TeamResource } from "../../types";

interface ResourceListItemProps {
    resource: TeamResource;
    onRemove: () => void;
}

export const ResourceListItem = ({ resource, onRemove }: ResourceListItemProps) => {
    return (
        <div className="flex items-center justify-between p-3 bg-white border rounded-xl group hover:border-blue-200 transition-colors shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-600 transition-colors">
                    <ResourceIcon type={resource.type} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 truncate">{resource.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{resource.url}</p>
                </div>
            </div>
            <button 
                type="button"
                onClick={onRemove}
                className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                title="Remove resource"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};
