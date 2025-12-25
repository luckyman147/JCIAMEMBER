import { useState, useMemo } from "react";
import Navbar from "../../../Global_Components/navBar";
import MembersGrowthChart from "../components/stats/dashboard/MembersGrowthChart";
import MembersList from "../components/MembersList";
import MembersStatistics from "../components/stats/MembersStatistics";
import ComplaintsOverview from "../../../Global_Components/ComplaintsOverview";
import { useMembers, useAllPointsHistory } from "../hooks/useMembers";
import { useAllMemberTasks } from "../../Tasks/hooks/useTasks";
import AddMemberModal from "../components/AddMemberModal";
import { UserPlus, Users, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";

import { useTranslation } from "react-i18next";
// ... imports

export default function MembersPage() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { data: members = [], isLoading: membersLoading } = useMembers();
    const { data: history = [], isLoading: historyLoading } = useAllPointsHistory();
    const { data: allTaskAssignments = [], isLoading: tasksLoading } = useAllMemberTasks();
    const { role } = useAuth();
    const isExecutive = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const loading = membersLoading || historyLoading || tasksLoading;

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
                   <main className="md:ml-64 pt-16 md:pt-6 pb-24 md:pb-0">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900">{t('members.title')}</h1>
                   <p className="text-gray-500 mt-1">{t('members.subtitle')}</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-(--color-myAccent) text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold"
                >
                    <UserPlus className="w-5 h-5" />
                    {t('members.addMember')}
                </button>
            </div>

            {/* Quick Stats Ribbon */}
            {!loading && members.length > 0 && (
                <div className={`flex flex-wrap gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('members.totalMembers')}</p>
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

            {/* Leadership Tools Section */}
            {isExecutive && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                        <h2 className="text-xl font-bold text-gray-900">{t('members.leadership')}</h2>
                    </div>
                    <ComplaintsOverview />
                </div>
            )}

            {/* General Statistics */}
            {!loading && members.length > 0 && <MembersStatistics members={members} tasks={allTaskAssignments} />}

            {/* Growth Chart */}
            <div className="mb-8">
                <MembersGrowthChart history={history} />
            </div>

            {/* Search and Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder={t('common.search')}
                    className="p-2 border border-gray-300 rounded-md w-full shadow-sm px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
