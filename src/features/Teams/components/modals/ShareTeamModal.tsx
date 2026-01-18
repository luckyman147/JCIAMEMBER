
import { useState } from "react";
import { X, Copy, Check, Share2, Globe, Lock, RefreshCw } from "lucide-react";
import { updateTeam } from "../../services/teams.service";
import { toast } from "sonner";
import type { Team } from "../../types";

interface ShareTeamModalProps {
    open: boolean;
    onClose: () => void;
    team: Team;
    onUpdated: () => void;
}

export default function ShareTeamModal({ open, onClose, team, onUpdated }: ShareTeamModalProps) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const baseUrl =  window.location.origin ;
    const activeToken = team.share_tokens?.find(t => !t.revoked)?.token;
    const shareUrl = activeToken 
        ? `${baseUrl}/teams/share/${activeToken}`
        : "";

    const generateToken = async () => {
        try {
            setLoading(true);
            const newTokenValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Revoke all existing tokens and add new one
            const currentTokens = team.share_tokens || [];
            const updatedTokens = [
                ...currentTokens.map(t => ({ ...t, revoked: true })),
                { token: newTokenValue, revoked: false }
            ];

            await updateTeam(team.id, { share_tokens: updatedTokens });
            toast.success("Sharing link generated!");
            onUpdated();
        } catch (error) {
            toast.error("Failed to generate link");
        } finally {
            setLoading(false);
        }
    };

    const revokeToken = async () => {
        if (!confirm("Are you sure you want to revoke this link? Anyone with the old link will lose access.")) return;
        try {
            setLoading(true);
            // Revoke all tokens
            const currentTokens = team.share_tokens || [];
            const updatedTokens = currentTokens.map(t => ({ ...t, revoked: true }));

            await updateTeam(team.id, { share_tokens: updatedTokens });
            toast.success("Sharing link revoked");
            onUpdated();
        } catch (error) {
            console.error("Revoke error:", error);
            toast.error("Failed to revoke link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied to clipboard");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-(--color-myPrimary)">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Share Team</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-4">
                        <div className="shrink-0 pt-1">
                            <Globe className="w-5 h-5 text-(--color-myPrimary)" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-900">Read-Only Sharing</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Share this private link to allow anyone to view your team's strategy, resources, and tasks without needing to join or be an admin.
                            </p>
                        </div>
                    </div>

                    {!activeToken ? (
                        <div className="text-center py-4">
                            <button 
                                onClick={generateToken}
                                disabled={loading}
                                className="w-full py-3 bg-(--color-myPrimary) text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                Generate Sharing Link
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block ml-1">Private Share URL</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-mono text-gray-600 truncate select-all">
                                        {shareUrl}
                                    </div>
                                    <button 
                                        onClick={copyToClipboard}
                                        className="shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <button 
                                    onClick={revokeToken}
                                    disabled={loading}
                                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                                >
                                    <Lock className="w-3 h-3" />
                                    Revoke Access
                                </button>
                                <button 
                                    onClick={generateToken}
                                    disabled={loading}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
                                >
                                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                    Regenerate Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 rounded-xl transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
