
import { useState } from "react";
import { Link as LinkIcon, Plus, Trash2, Globe, ExternalLink, Save } from "lucide-react";
import { updateTeam } from "../services/teams.service";
import { toast } from "sonner";
import type { Team, TeamResource } from "../types";

interface TeamLinksProps {
    team: Team;
    canManage: boolean;
    onUpdated: () => void;
}

export default function TeamLinks({ team, canManage, onUpdated }: TeamLinksProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [resources, setResources] = useState<TeamResource[]>(team.resources || []);
    const [loading, setLoading] = useState(false);
    
    // Form for new link
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    const handleAddLink = () => {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
            toast.error("Please provide both a title and a URL");
            return;
        }

        try {
            const url = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
            new URL(url);
            
            const newLink: TeamResource = {
                title: newLinkTitle.trim(),
                url: url,
                type: 'link'
            };

            setResources([...resources, newLink]);
            setNewLinkTitle("");
            setNewLinkUrl("");
        } catch (e) {
            toast.error("Please enter a valid URL");
        }
    };

    const handleRemoveLink = (index: number) => {
        setResources(resources.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateTeam(team.id, { resources });
            toast.success("Team links updated");
            setIsEditing(false);
            onUpdated();
        } catch (error) {
            toast.error("Failed to update links");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                    Team Links & Resources
                </h3>
                {canManage && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        Edit Links
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    {/* New Link Form */}
                    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                            <input 
                                type="text"
                                placeholder="Title (e.g., Slack Channel)"
                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newLinkTitle}
                                onChange={(e) => setNewLinkTitle(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="URL (e.g., https://...)"
                                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddLink}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Current Links List */}
                    <div className="space-y-2">
                        {resources.map((link, index) => (
                            <div key={index} className="flex items-center justify-between p-2.5 bg-white border rounded-lg group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{link.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{link.url}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveLink(index)}
                                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setResources(team.resources || []);
                            }}
                            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            Save Links
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {resources.length > 0 ? (
                        resources.map((resource, idx) => (
                            <a 
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all group shadow-sm"
                            >
                                <div className="flex items-center gap-3 overflow-hidden text-left">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                        <Globe className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                                            {resource.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 truncate">
                                            {resource.url.replace(/^https?:\/\//, '').split('/')[0]}
                                        </p>
                                    </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 shrink-0" />
                            </a>
                        ))
                    ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <LinkIcon className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-400 font-medium">No links added yet.</p>
                            {canManage && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 text-[10px] text-blue-600 hover:underline"
                                >
                                    Add Team Links
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
