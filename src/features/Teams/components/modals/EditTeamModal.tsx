import { useEffect, useState } from "react";
import { updateTeam } from "../../services/teams.service";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Team } from "../../types";

interface EditTeamModalProps {
    open: boolean;
    onClose: () => void;
    team: Team;
    onUpdated: (updatedTeam: Team) => void;
}

export default function EditTeamModal({ open, onClose, team, onUpdated }: EditTeamModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(team.name);
    const [description, setDescription] = useState(team.description || "");

    useEffect(() => {
        if (open) {
            setName(team.name);
            setDescription(team.description || "");
        }
    }, [open, team]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Team name is required");
            return;
        }

        try {
            setLoading(true);
            const updated = await updateTeam(team.id, {
                name: name.trim(),
                description: description.trim()
            });
            
            if (updated) {
                toast.success("Team updated successfully");
                onUpdated(updated);
                onClose();
            }
        } catch (error) {
            toast.error("Failed to update team");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Edit Team Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g., Marketing Squad"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24"
                            placeholder="What is this team about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
