
import { useState } from "react";
import { Link as LinkIcon, Save, Loader } from "lucide-react";
import { updateTeam } from "../services/teams.service";
import { uploadTeamResource, deleteStorageFile } from "../../../utils/uploadHelpers";
import { toast } from "sonner";
import type { Team, TeamResource } from "../types";

// Sub-components
import { ResourceCard } from "./resources/ResourceCard";
import { ResourceListItem } from "./resources/ResourceListItem";
import { ResourceForm } from "./resources/ResourceForm";
import { ResourcePreviewModal } from "./resources/ResourcePreviewModal";

interface TeamLinksProps {
    team: Team;
    canManage: boolean;
    onUpdated: () => void;
}

export default function TeamLinks({ team, canManage, onUpdated }: TeamLinksProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [resources, setResources] = useState<TeamResource[]>(team.resources || []);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Modal state
    const [selectedResource, setSelectedResource] = useState<TeamResource | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [pendingUploads, setPendingUploads] = useState<string[]>([]);

    const handleLinkAdd = (title: string, url: string) => {
        if (!title.trim() || !url.trim()) {
            toast.error("Please provide both a title and a URL");
            return;
        }

        try {
            const finalUrl = url.startsWith('http') ? url : `https://${url}`;
            new URL(finalUrl);
            
            const newLink: TeamResource = {
                title: title.trim(),
                url: finalUrl,
                type: 'link'
            };

            setResources(prev => [...prev, newLink]);
        } catch (e) {
            toast.error("Please enter a valid URL");
        }
    };

    const handleFilesUpload = async (files: File[]) => {
        try {
            setUploading(true);
            const newResources: TeamResource[] = [...resources];
            const newPending = [...pendingUploads];
            let successCount = 0;

            for (const file of files) {
                const result = await uploadTeamResource(file);
                
                if (result.success && result.url) {
                    const isImage = file.type.startsWith('image/');
                    newResources.push({
                        title: file.name,
                        url: result.url,
                        type: isImage ? 'image' : 'file'
                    });
                    newPending.push(result.url);
                    successCount++;
                } else {
                    toast.error(`Failed to upload ${file.name}: ${result.error || "Unknown error"}`);
                }
            }

            if (successCount > 0) {
                setResources(newResources);
                setPendingUploads(newPending);
                toast.success(`${successCount} file(s) uploaded successfully`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveResource = (index: number) => {
        setResources(prev => prev.filter((_, i) => i !== index));
    };

    const handleImmediateDelete = async (index: number) => {
        if (!window.confirm("Are you sure you want to remove this resource?")) return;

        try {
            setLoading(true);
            const updatedResources = resources.filter((_, i) => i !== index);
            await updateTeam(team.id, { resources: updatedResources });
            setResources(updatedResources);
            toast.success("Resource deleted");
            onUpdated();
        } catch (error) {
            toast.error("Failed to delete resource");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateTeam(team.id, { resources });
            setPendingUploads([]); // Confirmed, no need to cleanup
            toast.success("Team links updated");
            setIsEditing(false);
            onUpdated();
        } catch (error) {
            toast.error("Failed to update links");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (pendingUploads.length > 0) {
            // Delete files that were uploaded but not saved
            await Promise.all(pendingUploads.map(url => deleteStorageFile(url, 'team-attachments')));
        }
        setPendingUploads([]);
        setIsEditing(false);
        setResources(team.resources || []);
    };

    const openPreview = (resource: TeamResource) => {
        setSelectedResource(resource);
        setIsPreviewOpen(true);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <LinkIcon className="w-5 h-5 text-(--color-myPrimary)" />
                    Links & Resources
                </h3>
                {canManage && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs  text-(--color-myPrimary) px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    >
                        Manager Resources
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <ResourceForm 
                        onLinkAdd={handleLinkAdd}
                        onFilesUpload={handleFilesUpload}
                        uploading={uploading}
                    />

                    {/* Current Resources List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {resources.map((link, index) => (
                            <ResourceListItem 
                                key={index}
                                resource={link}
                                onRemove={() => handleRemoveResource(index)}
                            />
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button 
                            onClick={handleCancel}
                            className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading || uploading}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-opacity-90 shadow-lg shadow-blue-900/10 disabled:opacity-50 transition-all font-sans"
                        >
                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Confirm Changes
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resources.length > 0 ? (
                        resources.map((resource, idx) => (
                            <ResourceCard 
                                key={idx} 
                                resource={resource} 
                                onClick={() => openPreview(resource)}
                                onDelete={() => handleImmediateDelete(idx)}
                                canManage={canManage}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <LinkIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-400 font-black uppercase tracking-widest">Empty Resources</p>
                            <p className="text-xs text-gray-400 mt-1">Add shared links, images, or documents for your team.</p>
                            {canManage && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-4 px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-(--color-myPrimary) hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    Start Adding
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Asset Preview Modal */}
            <ResourcePreviewModal 
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                resource={selectedResource}
            />
        </div>
    );
}
