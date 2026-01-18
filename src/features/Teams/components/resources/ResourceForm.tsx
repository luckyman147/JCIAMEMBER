
import { useState, useRef } from "react";
import { Link as LinkIcon, Plus, Upload, Loader } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface ResourceFormProps {
    onLinkAdd: (title: string, url: string) => void;
    onFilesUpload: (files: File[]) => Promise<void>;
    uploading: boolean;
}

export const ResourceForm = ({ onLinkAdd, onFilesUpload, uploading }: ResourceFormProps) => {
    const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddLink = () => {
        onLinkAdd(newLinkTitle, newLinkUrl);
        setNewLinkTitle("");
        setNewLinkUrl("");
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    type="button"
                    onClick={() => setActiveTab('link')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all",
                        activeTab === 'link' ? "bg-white text-(--color-myPrimary) shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <LinkIcon className="w-3.5 h-3.5" /> Link
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('file')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all",
                        activeTab === 'file' ? "bg-white text-(--color-myPrimary) shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Upload className="w-3.5 h-3.5" /> File / Image
                </button>
            </div>

            {/* Form Area */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                {activeTab === 'link' ? (
                    <div className="grid grid-cols-1 gap-2">
                        <input 
                            type="text"
                            placeholder="Title (e.g., Slack Channel)"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-(--color-myPrimary) outline-none"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="URL (e.g., https://...)"
                                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-(--color-myPrimary) outline-none"
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={handleAddLink}
                                className="px-4 py-2 bg-(--color-myPrimary) text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="text-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) onFilesUpload(files);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Choose file to upload</p>
                                <p className="text-[10px] text-gray-400">PDF, Word, or Images up to 10MB</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
