
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTeamByShareToken } from "../services/teams.service";
import Navbar from "../../../Global_Components/navBar";
import { Target, Loader, Globe, ShieldCheck } from "lucide-react";
import TeamStrategy from "../components/TeamStrategy";
import TeamLinks from "../components/TeamLinks";
import TeamTasksList from "../components/TeamTasksList";
import type { Team } from "../types";

export default function TeamSharePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!token) return;
            try {
                const data = await getTeamByShareToken(token);
                setTeam(data);
            } catch (error) {
                console.error("Error fetching team by share token:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="md:ml-64 pt-32 flex flex-col items-center justify-center text-center px-4">
                    <Loader className="w-10 h-10 text-(--color-myPrimary) animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Accessing shared resource...</p>
                </main>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="md:ml-64 pt-32 flex flex-col items-center justify-center text-center px-4">
                    <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <Globe className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Invalid or Expired Link</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">The sharing link you followed might have been revoked, expired, or never existed in the first place.</p>
                        <button 
                            onClick={() => navigate('/teams')}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
                        >
                            Back to Teams
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="md:ml-64 pt-16 md:pt-6">
                {/* Header */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5 animate-pulse">
                                        <ShieldCheck className="w-3 h-3" /> Shared View-Only Link
                                    </span>
                                </div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">{team.name}</h1>
                                <p className="text-gray-500 max-w-2xl text-lg font-medium leading-relaxed">{team.description || "No description provided."}</p>
                            </div>
                            
                            <div className="flex items-center gap-6 pb-2">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Members</p>
                                    <p className="text-2xl font-black text-gray-900">{team.members?.length || 0}</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{team.is_public ? 'Public' : 'Private Access'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
                    
                    {/* Strategy & Links */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <TeamStrategy 
                            team={team} 
                            canManage={false} 
                            onUpdated={() => {}} 
                        />
                        <TeamLinks 
                            team={team} 
                            canManage={false} 
                            onUpdated={() => {}} 
                        />
                    </div>

                    {/* Tasks */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Current Roadmap & Tasks</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active operational objectives</p>
                            </div>
                        </div>
                        
                        <TeamTasksList 
                            teamId={team.id} 
                            refreshTrigger={0} 
                            isAdmin={false} 
                            teamMembers={[]}
                        />
                    </div>
                </div>

                {/* Footer Notice */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        Authenticated via secure sharing token. All actions restricted to read-only.
                    </p>
                </div>
            </main>
        </div>
    );
}
