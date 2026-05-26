
import { useState, useEffect } from "react";
import { getTeams, addTeamMember } from "../../services/teams.service";
import type { Team } from "../../types";
import { X, Search, Check, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";

interface AssignTeamModalProps {
    open: boolean;
    onClose: () => void;
    memberId: string;
    existingTeamIds: string[];
    onAssigned: () => void;
}

export default function AssignTeamModal({ open, onClose, memberId, existingTeamIds, onAssigned }: AssignTeamModalProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (open) {
            loadTeams();
            setSelectedTeamIds([]);
            setSearch("");
        }
    }, [open]);

    const loadTeams = async () => {
        setLoading(true);
        try {
            const allTeams = await getTeams(); // Fetch all teams
            // Filter only public teams and those member is not already in
            setTeams(allTeams.filter(t => t.is_public && !existingTeamIds.includes(t.id)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        if (selectedTeamIds.includes(id)) {
            setSelectedTeamIds(prev => prev.filter(tid => tid !== id));
        } else {
            setSelectedTeamIds(prev => [...prev, id]);
        }
    };

    const handleAssign = async () => {
        if (selectedTeamIds.length === 0) return;
        setAssigning(true);
        try {
            await Promise.all(selectedTeamIds.map(tid => addTeamMember(tid, memberId, 'member')));
            toast.success(`Member assigned to ${selectedTeamIds.length} teams`);
            onAssigned();
            onClose();
        } catch (error) {
            toast.error("Failed to assign to teams");
        } finally {
            setAssigning(false);
        }
    };

    const filteredTeams = teams.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Assign to Team</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search teams..." 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400">Loading teams...</div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                             {teams.length === 0 ? "Member is already in all available teams." : "No teams found."}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTeams.map(team => {
                                const isSelected = selectedTeamIds.includes(team.id);
                                return (
                                    <div 
                                        key={team.id}
                                        onClick={() => toggleSelection(team.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                            isSelected ? "bg-blue-50 border-blue-100 ring-1 ring-blue-500" : "hover:bg-gray-50 border border-transparent"
                                        )}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${team.is_public ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-1">{team.description}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {selectedTeamIds.length} selected
                    </span>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAssign}
                            disabled={assigning || selectedTeamIds.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
