
import { ExternalLink, Trash2, Eye } from "lucide-react";
import { ResourceIcon } from "./ResourceIcon";
import type { TeamResource } from "../../types";

interface ResourceCardProps {
    resource: TeamResource;
    onClick: () => void;
    onDelete?: () => void;
    canManage?: boolean;
}

export const ResourceCard = ({ resource, onClick, onDelete, canManage }: ResourceCardProps) => {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-(--color-myPrimary) hover:bg-blue-50/10 transition-all group shadow-sm bg-white cursor-pointer relative"
        >
            <div className="flex items-center gap-3 overflow-hidden text-left flex-1">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors text-gray-400 group-hover:text-(--color-myPrimary)">
                    <ResourceIcon type={resource.type} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-(--color-myPrimary)">
                        {resource.title}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                        {resource.type === 'link' 
                            ? resource.url.replace(/^https?:\/\//, '').split('/')[0]
                            : 'Stored File'}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                {canManage && onDelete && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete resource"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
                <div className="p-2 text-gray-300 group-hover:text-(--color-myPrimary) transition-all">
                    {resource.type === 'link' ? (
                        <ExternalLink className="w-4 h-4 group-hover:scale-110" />
                    ) : (
                        <Eye className="w-4 h-4 group-hover:scale-110" />
                    )}
                </div>
            </div>
        </div>
    );
};
