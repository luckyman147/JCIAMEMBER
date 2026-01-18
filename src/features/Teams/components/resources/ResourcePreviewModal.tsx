
import { X, Download, ExternalLink, Globe, FileText, ImageIcon } from "lucide-react";
import type { TeamResource } from "../../types";

interface ResourcePreviewModalProps {
    open: boolean;
    onClose: () => void;
    resource: TeamResource | null;
}

export const ResourcePreviewModal = ({ open, onClose, resource }: ResourcePreviewModalProps) => {
    if (!open || !resource) return null;

    const isImage = resource.type === 'image';
    const isLink = resource.type === 'link';

    const handleDownload = () => {
        if (!resource.url) return;
        
        if (isLink) {
            window.open(resource.url, '_blank');
            return;
        }

        const link = document.createElement('a');
        link.href = resource.url;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-(--color-myPrimary)">
                            {isImage ? <ImageIcon className="w-5 h-5" /> : isLink ? <Globe className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 leading-tight">{resource.title}</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {resource.type === 'link' ? 'External Resource' : 'Team Shared Asset'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-0 bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
                    {isImage ? (
                        <img 
                            src={resource.url} 
                            alt={resource.title} 
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-6 p-12 text-center">
                            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-gray-300">
                                {isLink ? <Globe className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {isLink ? 'Redirecting to resource' : 'File Preview Unavailable'}
                                </h3>
                                <p className="text-sm text-gray-500 max-w-md">
                                    {isLink 
                                        ? "This resource is hosted externally. Click 'Open Link' to visit the source."
                                        : "Direct preview for this file type is restricted. Download the file to view its contents."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t flex justify-between items-center">
                    <div className="text-[10px] text-gray-400 font-medium">
                        URL: <span className="underline italic ml-1">{resource.url.substring(0, 50)}...</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-8 py-2.5 bg-(--color-myPrimary) text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 shadow-lg shadow-blue-900/10 transition-all font-sans"
                        >
                            {isLink ? (
                                <>
                                    <ExternalLink className="w-4 h-4" />
                                    Open Link
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download File
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
