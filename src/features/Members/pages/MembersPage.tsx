import { useState, useMemo } from "react";
import Navbar from "../../../Global_Components/navBar";
import MembersGrowthChart from "../components/stats/MembersGrowthChart";
import MembersList from "../components/MembersList";
import MembersStatistics from "../components/stats/MembersStatistics";
import { useMembers, useAllPointsHistory } from "../hooks/useMembers";
import AddMemberModal from "../components/AddMemberModal";
import { UserPlus, Users, ShieldCheck, User } from "lucide-react";

export default function MembersPage() {
    const { data: members = [], isLoading: membersLoading } = useMembers();
    const { data: history = [], isLoading: historyLoading } = useAllPointsHistory();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const loading = membersLoading || historyLoading;

    const roleStats = useMemo(() => {
        const stats: Record<string, number> = {};
        members.forEach(m => {
            const r = m.role || 'Member';
            stats[r] = (stats[r] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [members]);

    const filteredMembers = members.filter(m => 
        m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
          <div className="min-h-screen bg-gray-50">
              <Navbar />
                   <main className="md:ml-64 pt-16 md:pt-6">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900">Members</h1>
                   <p className="text-gray-500 mt-1">Manage organization members and their statistics</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Quick Stats Ribbon */}
            {!loading && members.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Members</p>
                            <p className="text-xl font-bold text-gray-900">{members.length}</p>
                        </div>
                    </div>

                    {roleStats.map(([role, count]) => (
                        <div key={role} className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                {role.toLowerCase().includes('admin') || role.toLowerCase().includes('lead') ? (
                                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                                ) : (
                                    <User className="w-5 h-5 text-gray-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{role}</p>
                                <p className="text-xl font-bold text-gray-900">{count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddMemberModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />

            {/* General Statistics */}
            {!loading && members.length > 0 && <MembersStatistics members={members} />}

            {/* Growth Chart */}
            <MembersGrowthChart history={history} />

            {/* Search and Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search members..."
                    className="p-2 border border-gray-300 rounded-md w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Members List */}
            <MembersList members={filteredMembers} loading={loading} />
        </div>
                    </main>
    </div>
    );
}
